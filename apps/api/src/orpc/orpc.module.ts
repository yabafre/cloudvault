import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ORPCModule } from '@orpc/nest';

import { OrpcErrorFilter } from './orpc-error.filter.js';

@Module({
  imports: [
    ORPCModule.forRoot({
      interceptors: [],
    }),
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: OrpcErrorFilter,
    },
  ],
  exports: [ORPCModule],
})
export class OrpcModule {}
