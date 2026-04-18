import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ORPCModule } from '@orpc/nest';
import { experimental_RethrowHandlerPlugin as RethrowHandlerPlugin } from '@orpc/server/plugins';

import { OrpcErrorFilter } from './orpc-error.filter.js';

@Module({
  imports: [
    ORPCModule.forRoot({
      interceptors: [],
      // Re-throw any non-ORPCError so NestJS's global OrpcErrorFilter can
      // normalize it to the typed ApiError wire shape. Without this, oRPC's
      // default handler serializes exceptions in its own format and
      // OrpcErrorFilter would never see them (AC2 would silently fail once
      // real handlers ship in 1-6+).
      plugins: [
        new RethrowHandlerPlugin({
          filter: (error) => {
            const candidate = error as { defined?: unknown } | null;
            return !(candidate?.defined === true);
          },
        }),
      ],
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
