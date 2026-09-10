import { CallHandler, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Expose } from 'class-transformer';
import { firstValueFrom, of } from 'rxjs';
import {
  Serialize,
  SerializeInterceptor,
  SerializePaginate,
} from './serialize';

class SampleDto {
  @Expose()
  id: number;

  @Expose()
  name: string;
}

// The decorators are the only way the interceptor learns about a dto, so the
// handlers here carry the real ones
class SampleController {
  @Serialize(SampleDto)
  one() {
    return undefined;
  }

  @Serialize(SampleDto, { isArray: true })
  many() {
    return undefined;
  }

  @SerializePaginate(SampleDto)
  page() {
    return undefined;
  }

  plain() {
    return undefined;
  }
}

const interceptor = new SerializeInterceptor(new Reflector());

const run = (handler: () => unknown, payload: unknown) => {
  const context = {
    getHandler: () => handler,
  } as unknown as ExecutionContext;
  const next: CallHandler = { handle: () => of(payload) };

  return firstValueFrom(interceptor.intercept(context, next));
};

describe('SerializeInterceptor', () => {
  it('wraps a serialized resource in the data envelope', async () => {
    const result = await run(SampleController.prototype.one, {
      id: 1,
      name: 'one',
    });

    expect(result).toEqual({ data: { id: 1, name: 'one' } });
  });

  it('drops fields the dto does not expose', async () => {
    const result = await run(SampleController.prototype.one, {
      id: 1,
      name: 'one',
      passwordHash: 'secret',
      internal: { token: 'secret' },
    });

    expect(result).toEqual({ data: { id: 1, name: 'one' } });
    expect(JSON.stringify(result)).not.toContain('secret');
  });

  it('reports a field the dto expects but the payload lacks as undefined', async () => {
    const result = await run(SampleController.prototype.one, { id: 1 });

    expect(result).toEqual({ data: { id: 1, name: undefined } });
  });

  it('serializes every entry of an array', async () => {
    const result = await run(SampleController.prototype.many, [
      { id: 1, name: 'one', secret: 'x' },
      { id: 2, name: 'two', secret: 'y' },
    ]);

    expect(result).toEqual({
      data: [
        { id: 1, name: 'one' },
        { id: 2, name: 'two' },
      ],
    });
  });

  it('keeps the meta and links of a paginated payload and serializes its rows', async () => {
    const result = await run(SampleController.prototype.page, {
      data: [{ id: 1, name: 'one', secret: 'x' }],
      meta: { totalItems: 1 },
      links: { current: 'http://localhost/x' },
    });

    expect(result).toEqual({
      data: [{ id: 1, name: 'one' }],
      meta: { totalItems: 1 },
      links: { current: 'http://localhost/x' },
    });
  });

  it('leaves an empty page empty', async () => {
    const result = await run(SampleController.prototype.page, {
      data: [],
      meta: { totalItems: 0 },
    });

    expect(result).toMatchObject({ data: [] });
  });

  it('passes a handler without a dto straight through', async () => {
    const payload = { anything: 'at all' };

    expect(await run(SampleController.prototype.plain, payload)).toBe(payload);
  });

  it('wraps a null resource rather than dropping the envelope', async () => {
    const result = await run(SampleController.prototype.one, null);

    expect(result).toEqual({ data: null });
  });
});
