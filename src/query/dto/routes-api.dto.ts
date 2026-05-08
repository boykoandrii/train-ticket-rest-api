import { ApiProperty } from '@nestjs/swagger';
import { GraphNodeResponseDto } from './graph-api.dto';

export class RouteWithNodesResponseDto {
  @ApiProperty({ type: 'array', items: { type: 'string' } })
  path!: string[];

  @ApiProperty({ type: [GraphNodeResponseDto] })
  nodes!: GraphNodeResponseDto[];
}

export class RoutesQueryResultResponseDto {
  @ApiProperty({ type: 'array', items: { type: 'string' } })
  filters_applied!: string[];

  @ApiProperty()
  total_routes!: number;

  @ApiProperty({ type: [RouteWithNodesResponseDto] })
  routes!: RouteWithNodesResponseDto[];
}
