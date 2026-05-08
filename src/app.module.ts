import { Module } from '@nestjs/common';
import { GraphModule } from './graph/graph.module';
import { QueryModule } from './query/query.module';

@Module({
  imports: [GraphModule, QueryModule],
})
export class AppModule {}
