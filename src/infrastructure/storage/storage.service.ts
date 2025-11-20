import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { mkdirSync } from 'fs';
import { extname, join } from 'path';

@Injectable()
export class StorageService {
  private readonly uploadsRoot = join(process.cwd(), 'uploads');

  getEventUploadDir() {
    const dir = join(this.uploadsRoot, 'events');
    mkdirSync(dir, { recursive: true });
    return dir;
  }

  buildEventPosterName(originalName: string) {
    return `${Date.now()}-${randomUUID()}${extname(originalName) || '.jpg'}`;
  }

  toPublicUrl(relativePath: string) {
    return `/uploads/${relativePath.replace(/\\/g, '/')}`;
  }
}
