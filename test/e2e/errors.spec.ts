import request from 'supertest';
import { setupTestContext } from '../utils/context';
import { createMap, createUser } from '../factories';

describe('error handling', () => {
  const context = setupTestContext();
  const get = (path: string) => request(context.app.getHttpServer()).get(path);

  it('answers 404 with the api error shape for a route that does not exist', async () => {
    const { body } = await get('/does-not-exist').expect(404);

    expect(body).toMatchObject({
      statusCode: 404,
      message: expect.any(String),
    });
  });

  it('answers 404 for a method the route does not serve', async () => {
    await request(context.app.getHttpServer()).post('/climb/maps').expect(404);
    await request(context.app.getHttpServer())
      .delete('/climb/maps/1')
      .expect(404);
  });

  it('names the resource that was not found', async () => {
    const { body } = await get('/climb/users/999').expect(404);

    expect(body).toEqual({
      statusCode: 404,
      error: 'Not Found',
      message: 'User not found',
    });
  });

  it('answers 400 when a path id is not a number', async () => {
    const { body } = await get('/climb/maps/abc').expect(400);

    expect(body).toEqual({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Validation failed (numeric string is expected)',
    });
  });

  // ErrorMessageInterceptor joins what class-validator reports as an array
  it('joins several validation messages into one string', async () => {
    const user = await createUser(context.dataSource);

    const { body } = await get(
      `/climb/users/${user.id}/activity?type=records&year=abc`,
    ).expect(400);

    expect(typeof body.message).toBe('string');
    expect(body.message).toBe(
      'year must be a positive number | year must be an integer number',
    );
  });

  it('leaves a single validation message alone', async () => {
    const user = await createUser(context.dataSource);

    const { body } = await get(
      `/climb/users/${user.id}/activity?type=records&month=1`,
    ).expect(400);

    expect(body.message).toBe('property month should not exist');
  });

  // QueryFailedFilter turns Postgres invalid_text_representation into a 400
  it('answers 400 when a filter value cannot be read as the column type', async () => {
    await createMap(context.dataSource);

    const { body } = await get('/climb/maps?filter.hardest=abc').expect(400);

    expect(body).toEqual({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Invalid query parameter value',
    });
  });

  it('keeps the failing statement out of the error it answers with', async () => {
    await createMap(context.dataSource);

    const { text } = await get('/climb/maps?filter.hardest=abc').expect(400);

    expect(text).not.toContain('SELECT');
    expect(text).not.toContain('maps');
  });

  it('does not answer with a stack trace', async () => {
    const { text } = await get('/climb/users/999').expect(404);

    expect(text).not.toContain('at ');
    expect(text).not.toContain('.ts:');
  });

  it('answers json even when the request asks for something else', async () => {
    const { headers } = await request(context.app.getHttpServer())
      .get('/climb/users/999')
      .set('Accept', 'text/html')
      .expect(404);

    expect(headers['content-type']).toContain('application/json');
  });
});
