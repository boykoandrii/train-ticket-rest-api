import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class VulnerabilityResponseDto {
  @ApiProperty()
  file!: string;

  @ApiProperty({ enum: ['low', 'medium', 'high', 'critical'] })
  severity!: string;

  @ApiProperty()
  message!: string;

  @ApiPropertyOptional()
  cwe?: string;
}

export class GraphNodeResponseDto {
  @ApiProperty()
  name!: string;

  @ApiProperty({ enum: ['service', 'rds', 'sqs', 'sql'] })
  kind!: string;

  @ApiPropertyOptional()
  language?: string;

  @ApiPropertyOptional()
  path?: string;

  @ApiProperty()
  publicExposed!: boolean;

  @ApiProperty({ type: [VulnerabilityResponseDto] })
  vulnerabilities!: VulnerabilityResponseDto[];

  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  metadata?: Record<string, unknown>;
}

export class GraphEdgeResponseDto {
  @ApiProperty()
  from!: string;

  @ApiProperty()
  to!: string;
}

export class GraphOverviewResponseDto {
  @ApiProperty({ type: [GraphNodeResponseDto] })
  nodes!: GraphNodeResponseDto[];

  @ApiProperty({ type: [GraphEdgeResponseDto] })
  edges!: GraphEdgeResponseDto[];
}

export class GraphUploadResponseDto {
  @ApiProperty()
  node_count!: number;

  @ApiProperty()
  edge_count!: number;
}
