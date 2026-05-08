import { Injectable } from '@nestjs/common';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { RawGraphData } from '../model/graph.model';
import type { GraphInitialSource } from './graph-initial-source';

@Injectable()
export class BundledTrainTicketInitialSource implements GraphInitialSource {
  async load(): Promise<RawGraphData> {
    const path = join(__dirname, '..', 'data', 'train-ticket.json');
    const text = await readFile(path, 'utf-8');
    return JSON.parse(text) as RawGraphData;
  }
}
