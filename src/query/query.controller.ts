import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiExtraModels,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { GraphIngestionService } from '../graph/ingestion/graph-ingestion.service';
import { isRawGraphData } from '../graph/model/raw-graph-shape';
import { FilterInfoDto, FiltersListResponseDto } from './dto/filters-api.dto';
import {
  GraphEdgeResponseDto,
  GraphNodeResponseDto,
  GraphOverviewResponseDto,
  GraphUploadResponseDto,
  VulnerabilityResponseDto,
} from './dto/graph-api.dto';
import { QueryFiltersDto } from './dto/query-filters.dto';
import {
  RouteWithNodesResponseDto,
  RoutesQueryResultResponseDto,
} from './dto/routes-api.dto';
import { QueryService } from './query.service';

@ApiTags('graph')
@ApiExtraModels(
  FilterInfoDto,
  FiltersListResponseDto,
  GraphEdgeResponseDto,
  GraphNodeResponseDto,
  GraphOverviewResponseDto,
  GraphUploadResponseDto,
  RouteWithNodesResponseDto,
  RoutesQueryResultResponseDto,
  VulnerabilityResponseDto,
)
@Controller('api/graph')
export class QueryController {
  constructor(
    private readonly queryService: QueryService,
    private readonly graphIngestion: GraphIngestionService,
  ) {}

  @Post()
  @HttpCode(200)
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary', description: 'Graph JSON' },
      },
    },
  })
  @ApiOkResponse({
    description: 'Graph replaced in memory',
    type: GraphUploadResponseDto,
  })
  uploadGraph(
    @UploadedFile() file: Express.Multer.File | undefined,
  ): GraphUploadResponseDto {
    if (file?.buffer === undefined) {
      throw new BadRequestException('Expected multipart field "file"');
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(file.buffer.toString('utf-8'));
    } catch {
      throw new BadRequestException('Invalid JSON');
    }
    if (!isRawGraphData(parsed)) {
      throw new BadRequestException('Invalid graph document');
    }
    const { nodeCount, edgeCount } = this.graphIngestion.ingest(parsed);
    return { node_count: nodeCount, edge_count: edgeCount };
  }

  @Get()
  @ApiOkResponse({
    description: 'Full dependency graph',
    type: GraphOverviewResponseDto,
  })
  getGraph(): GraphOverviewResponseDto {
    return this.queryService.getFullGraph();
  }

  @Get('routes')
  @ApiOkResponse({
    description: 'Routes with optional filters',
    type: RoutesQueryResultResponseDto,
  })
  getRoutes(@Query() query: QueryFiltersDto): RoutesQueryResultResponseDto {
    return this.queryService.buildRoutesResponse(query);
  }

  @Get('filters')
  @ApiOkResponse({
    description: 'Registered route filters',
    type: FiltersListResponseDto,
  })
  getFilters(): FiltersListResponseDto {
    return { filters: this.queryService.getAvailableFilters() };
  }
}
