import { Inject, Injectable } from '@nestjs/common';
import { GraphService } from '../graph/graph.service';
import type { FilterInfoDto } from './dto/filters-api.dto';
import type { GraphOverviewResponseDto } from './dto/graph-api.dto';
import type { QueryFiltersDto } from './dto/query-filters.dto';
import type { RoutesQueryResultResponseDto } from './dto/routes-api.dto';
import { ROUTE_FILTERS, type RouteFilter } from './filters/route-filter';
import type { Route } from './model/route';

@Injectable()
export class QueryService {
  constructor(
    private readonly graphService: GraphService,
    @Inject(ROUTE_FILTERS)
    private readonly routeFilters: readonly RouteFilter[],
  ) {}

  getAvailableFilters(): FilterInfoDto[] {
    return this.routeFilters.map((f) => ({
      name: f.name,
      description: f.description,
    }));
  }

  getFullGraph(): GraphOverviewResponseDto {
    return {
      nodes: this.graphService.getAllNodes(),
      edges: this.graphService.getAllEdges(),
    } as GraphOverviewResponseDto;
  }

  findAllRoutes(): Route[] {
    const acc: Route[] = [];
    const seen = new Set<string>();
    for (const { name: start } of this.graphService.getStartNodes()) {
      this.walkFromStart(start, acc, seen);
    }
    return acc;
  }

  findRoutes(params: QueryFiltersDto): Route[] {
    let routes = this.findAllRoutes();
    for (const filter of this.routeFilters) {
      if (filter.isActive(params)) {
        routes = filter.apply(routes, this.graphService);
      }
    }
    return routes;
  }

  resolveAppliedFilterNames(params: QueryFiltersDto): string[] {
    return this.routeFilters
      .filter((f) => f.isActive(params))
      .map((f) => f.name);
  }

  buildRoutesResponse(params: QueryFiltersDto): RoutesQueryResultResponseDto {
    const routes = this.findRoutes(params);
    return {
      filters_applied: this.resolveAppliedFilterNames(params),
      total_routes: routes.length,
      routes: routes.map((r) => ({
        path: [...r],
        nodes: r.map((name) => {
          const n = this.graphService.getNode(name);
          if (n === undefined) {
            throw new Error(`Missing node "${name}"`);
          }
          return n;
        }),
      })),
    } as RoutesQueryResultResponseDto;
  }

  private walkFromStart(start: string, acc: Route[], seen: Set<string>): void {
    const path: string[] = [start];
    const visited = new Set<string>([start]);
    this.dfs(start, path, visited, acc, seen);
  }

  private dfs(
    current: string,
    path: string[],
    visited: Set<string>,
    acc: Route[],
    seen: Set<string>,
  ): void {
    const neighbors = this.graphService.getNeighbors(current);
    const isLeaf = neighbors.length === 0;
    const isSinkNode = this.graphService.isSink(current);

    if (isLeaf || isSinkNode) {
      this.pushRouteIfNew(path, acc, seen);
    }

    if (isLeaf) {
      return;
    }

    for (const next of neighbors) {
      if (visited.has(next)) {
        continue;
      }
      visited.add(next);
      path.push(next);
      this.dfs(next, path, visited, acc, seen);
      path.pop();
      visited.delete(next);
    }
  }

  private pushRouteIfNew(
    path: string[],
    acc: Route[],
    seen: Set<string>,
  ): void {
    if (path.length < 2) {
      return;
    }
    const route = [...path] as Route;
    const key = route.join('\0');
    if (!seen.has(key)) {
      seen.add(key);
      acc.push(route);
    }
  }
}
