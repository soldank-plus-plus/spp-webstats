import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { firstValueFrom, of, throwError } from 'rxjs';
import { ErrorMessageInterceptor } from './interceptors';

const interceptor = new ErrorMessageInterceptor();
const context = {} as ExecutionContext;

const run = (handler: CallHandler) =>
  firstValueFrom(interceptor.intercept(context, handler));

const failWith = (error: unknown): CallHandler => ({
  handle: () => throwError(() => error),
});

const caught = async (error: unknown) => {
  try {
    await run(failWith(error));

    throw new Error('the interceptor swallowed the error');
  } catch (thrown) {
    return thrown as HttpException;
  }
};

describe('ErrorMessageInterceptor', () => {
  it('joins the messages class-validator reports as an array', async () => {
    const error = await caught(
      new BadRequestException(['first is wrong', 'second is wrong']),
    );

    expect(error.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    expect(error.getResponse()).toMatchObject({
      statusCode: 400,
      message: 'first is wrong | second is wrong',
    });
  });

  it('keeps the error label of the original response', async () => {
    const error = await caught(new BadRequestException(['a', 'b']));

    expect(error.getResponse()).toMatchObject({ error: 'Bad Request' });
  });

  it('leaves an exception that carries a single message alone', async () => {
    const original = new NotFoundException('User not found');
    const error = await caught(original);

    expect(error).toBe(original);
    expect(error.getResponse()).toMatchObject({ message: 'User not found' });
  });

  it('joins the messages even when the body carries no error label', async () => {
    const error = await caught(
      new HttpException({ message: ['first', 'second'], statusCode: 400 }, 400),
    );

    expect(error.getResponse()).toMatchObject({ message: 'first | second' });
  });

  it('leaves an exception whose response is a plain string alone', async () => {
    const original = new HttpException('gone wrong', HttpStatus.BAD_GATEWAY);
    const error = await caught(original);

    expect(error).toBe(original);
  });

  it('leaves an exception whose body carries no status code alone', async () => {
    const original = new HttpException({ message: ['a', 'b'] }, 400);
    const error = await caught(original);

    expect(error).toBe(original);
  });

  it('does not touch an error that is not an http exception', async () => {
    const original = new Error('boom');
    const error = await caught(original);

    expect(error).toBe(original);
  });

  it('lets a successful response through untouched', async () => {
    const payload = { data: [1, 2, 3] };

    expect(await run({ handle: () => of(payload) })).toBe(payload);
  });

  it('turns a list holding a single message into that message', async () => {
    const error = await caught(new BadRequestException(['the only one']));

    expect(error.getResponse()).toMatchObject({ message: 'the only one' });
  });

  // joining an empty list gives an empty message, which nest fills back in with
  // the error label rather than answering with a blank one
  it('falls back to the error label when the list of messages is empty', async () => {
    const error = await caught(new BadRequestException([]));

    expect(error.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    expect(error.getResponse()).toMatchObject({ message: 'Bad Request' });
  });
});
