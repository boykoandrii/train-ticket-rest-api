import { Module } from '@nestjs/common';
import { GraphService } from './graph.service';
import { BundledTrainTicketInitialSource } from './ingestion/bundled-train-ticket.initial-source';
import { GRAPH_INITIAL_SOURCE } from './ingestion/graph-initial-source';
import { GraphIngestionService } from './ingestion/graph-ingestion.service';

@Module({
  providers: [
    GraphService,
    GraphIngestionService,
    BundledTrainTicketInitialSource,
    {
      provide: GRAPH_INITIAL_SOURCE,
      useExisting: BundledTrainTicketInitialSource,
    },
  ],
  exports: [GraphService, GraphIngestionService],
})
export class GraphModule {}
