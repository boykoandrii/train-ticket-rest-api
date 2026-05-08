import { Module } from '@nestjs/common';
import { GraphModule } from '../graph/graph.module';
import { ROUTE_FILTERS } from './filters/route-filter';
import { PublicStartFilter } from './filters/public-start.filter';
import { SinkEndFilter } from './filters/sink-end.filter';
import { VulnerabilityFilter } from './filters/vulnerability.filter';
import { QueryController } from './query.controller';
import { QueryService } from './query.service';

@Module({
  imports: [GraphModule],
  controllers: [QueryController],
  providers: [
    QueryService,
    PublicStartFilter,
    SinkEndFilter,
    VulnerabilityFilter,
    {
      provide: ROUTE_FILTERS,
      useFactory: (
        a: PublicStartFilter,
        b: SinkEndFilter,
        c: VulnerabilityFilter,
      ) => [a, b, c] as const,
      inject: [PublicStartFilter, SinkEndFilter, VulnerabilityFilter],
    },
  ],
})
export class QueryModule {}
