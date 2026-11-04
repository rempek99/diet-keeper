import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import { db } from './db';

@Injectable()
export class PrismaService implements OnApplicationShutdown {
  readonly client: typeof db = db;

  async onApplicationShutdown(): Promise<void> {
    await this.client.close();
  }
}
