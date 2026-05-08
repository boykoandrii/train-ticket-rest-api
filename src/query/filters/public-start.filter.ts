import { Injectable } from '@nestjs/common';
import type { GraphReadModel } from '../../graph/model/graph.model';
import type { QueryFiltersDto } from '../dto/query-filters.dto';
import type { Route } from '../model/route';
import type { RouteFilter } from './route-filter';

@Injectable()
export class PublicStartFilter implements RouteFilter {
  readonly name = 'startPublic';
  readonly description = 'Routes that start from a publicly exposed service';

  isActive(params: QueryFiltersDto): boolean {
    return params.startPublic === true;
  }

  apply(routes: Route[], graph: GraphReadModel): Route[] {
    return routes.filter((route) => {
      const start = graph.getNode(route[0]);
      return start?.publicExposed === true;
    });
  }
}
