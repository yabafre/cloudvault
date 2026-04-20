import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ORPCModule } from '@orpc/nest';
import { experimental_RethrowHandlerPlugin as RethrowHandlerPlugin } from '@orpc/server/plugins';

import { OrpcErrorFilter } from './orpc-error.filter.js';
import { rethrowAdHocErrors } from './rethrow-ad-hoc-filter.js';

@Module({
  imports: [
    ORPCModule.forRoot({
      interceptors: [],
      plugins: [new RethrowHandlerPlugin({ filter: rethrowAdHocErrors })],
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
