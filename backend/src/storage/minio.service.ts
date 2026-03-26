import { Injectable, OnModuleInit, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';

@Injectable()
export class MinioService implements OnModuleInit {
  private client: Minio.Client | null = null;

  readonly bucketName: string;

  constructor(private readonly config: ConfigService) {
    this.bucketName = this.config.get<string>('MINIO_BUCKET') ?? 'project-attachments';
  }

  async onModuleInit() {
    const endPoint = this.config.get<string>('MINIO_ENDPOINT');
    const accessKey = this.config.get<string>('MINIO_ACCESS_KEY');
    const secretKey = this.config.get<string>('MINIO_SECRET_KEY');
    const port = parseInt(this.config.get<string>('MINIO_PORT') ?? '9000', 10);
    const useSSL = (this.config.get<string>('MINIO_USE_SSL') ?? 'false').toLowerCase() === 'true';
    if (!endPoint || !accessKey || !secretKey) {
      console.warn(
        '[MinioService] 未配置 MINIO_ENDPOINT / MINIO_ACCESS_KEY / MINIO_SECRET_KEY，附件上传将不可用',
      );
      return;
    }
    this.client = new Minio.Client({
      endPoint,
      port,
      useSSL,
      accessKey,
      secretKey,
    });
    try {
      const exists = await this.client.bucketExists(this.bucketName);
      if (!exists) {
        await this.client.makeBucket(this.bucketName, 'us-east-1');
      }
    } catch (err) {
      console.error('[MinioService] 初始化存储桶失败', err);
    }
  }

  assertClient(): Minio.Client {
    if (!this.client) {
      throw new ServiceUnavailableException('对象存储未配置或不可用，请联系管理员配置 MinIO 环境变量');
    }
    return this.client;
  }

  async putObject(
    objectKey: string,
    buffer: Buffer,
    size: number,
    meta?: Record<string, string>,
  ): Promise<void> {
    const c = this.assertClient();
    await c.putObject(this.bucketName, objectKey, buffer, size, meta);
  }

  async removeObject(objectKey: string): Promise<void> {
    const c = this.assertClient();
    await c.removeObject(this.bucketName, objectKey);
  }

  async presignedGetUrl(objectKey: string, expirySeconds: number): Promise<string> {
    const c = this.assertClient();
    return c.presignedGetObject(this.bucketName, objectKey, expirySeconds);
  }
}
