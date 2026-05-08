import type { GraphReadModel } from '../../graph/model/graph.model';
import type { QueryFiltersDto } from '../dto/query-filters.dto';
import type { Route } from '../model/route';

export const ROUTE_FILTERS = Symbol('ROUTE_FILTERS');

export interface RouteFilter {
  readonly name: string;
  readonly description: string;
  isActive(params: QueryFiltersDto): boolean;
  apply(routes: Route[], graph: GraphReadModel): Route[];
}
