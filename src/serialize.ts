import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ClassConstructor, plainToInstance } from 'class-transformer';

import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const SERIALIZE_DTO_KEY = 'serialize_dto';
export const SERIALIZE_PAGINATE_DTO_KEY = 'serialize_paginate_dto';

export const Serialize = (dto: ClassConstructor<any>) =>
  SetMetadata(SERIALIZE_DTO_KEY, dto);

export const SerializePaginate = (dto: ClassConstructor<any>) =>
  SetMetadata(SERIALIZE_PAGINATE_DTO_KEY, dto);

@Injectable()
export class SerializeInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const dtoClass = this.reflector.get<ClassConstructor<any> | undefined>(
      SERIALIZE_DTO_KEY,
      context.getHandler(),
    );
    const paginateDtoClass = this.reflector.get<
      ClassConstructor<any> | undefined
    >(SERIALIZE_PAGINATE_DTO_KEY, context.getHandler());

    return next.handle().pipe(
      map((data) => {
        if (paginateDtoClass) {
          return {
            ...data,
            data: plainToInstance(paginateDtoClass, data.data, {
              excludeExtraneousValues: true,
            }),
          };
        }

        return dtoClass
          ? plainToInstance(dtoClass, data, { excludeExtraneousValues: true })
          : data;
      }),
    );
  }
}
