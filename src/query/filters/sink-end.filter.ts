import { Injectable } from '@nestjs/common';
import type { GraphReadModel } from '../../graph/model/graph.model';
import type { QueryFiltersDto } from '../dto/query-filters.dto';
import type { Route } from '../model/route';
import type { RouteFilter } from './route-filter';

@Injectable()
export class SinkEndFilter implements RouteFilter {
  readonly name = 'endSink';
  readonly description =
    'Routes that end in a data sink (RDS, SQS, or SQL — see SINK_KINDS)';

  isActive(params: QueryFiltersDto): boolean {
    return params.endSink === true;
  }

  apply(routes: Route[], graph: GraphReadModel): Route[] {
    return routes.filter((route) => {
      const last = route[route.length - 1];
      return graph.isSink(last);
    });
  }
}
