import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: Redis;

  constructor(config: ConfigService) {
    this.client = new Redis(config.get<string>('REDIS_URL') ?? 'redis://localhost:6379', {
      maxRetriesPerRequest: null,
      retryStrategy: (times) => Math.min(times * 100, 3_000),
    });
  }

  async ping() {
    return this.client.ping();
  }

  async acquireSeatLock(showId: string, hallSeatId: string, owner: string, ttlMs: number) {
    const key = this.getSeatLockKey(showId, hallSeatId);
    const result = await this.client.set(key, owner, 'PX', ttlMs, 'NX');
    return result === 'OK';
  }

  async releaseSeatLock(showId: string, hallSeatId: string) {
    await this.client.del(this.getSeatLockKey(showId, hallSeatId));
  }

  async releaseSeatLocks(showId: string, hallSeatIds: string[]) {
    if (!hallSeatIds.length) return;
    const keys = hallSeatIds.map((id) => this.getSeatLockKey(showId, id));
    await this.client.del(keys);
  }

  private getSeatLockKey(showId: string, hallSeatId: string) {
    return `seat-lock:${showId}:${hallSeatId}`;
  }

  async onModuleDestroy() {
    await this.client.quit();
  }
}
