import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import * as path from 'path';
import { ProjectAttachment } from '../entities/project-attachment.entity';
import { Project } from '../entities/project.entity';
import { User } from '../entities/user.entity';
import { MinioService } from '../storage/minio.service';
import { OperationLogsService } from '../operation-logs/operation-logs.service';
import { OperationLogTarget, OperationLogType } from '../entities/operation-log.entity';
import {
  ALLOWED_PROJECT_ATTACHMENT_CATEGORIES,
  PROJECT_ATTACHMENT_CATEGORY_ORIGINAL,
} from './project-attachments.constants';

const MAX_BYTES = 50 * 1024 * 1024;

type Operator = { username?: string; realName?: string | null };

const operatorNameOf = (u: Operator | undefined | null) => u?.realName || u?.username || 'unknown';

/**
 * Multer/busboy 常把 multipart 里 UTF-8 字节按 latin1 转成字符串，导致中文乱码。
 * 若串中已含 codePoint >= 256 的字符，视为已是正确 Unicode（或用户真实 latin1 名），不再转换。
 */
function normalizeUploadOriginalName(name: string): string {
  if (!name) return name;
  const onlyByteLikeChars = [...name].every((ch) => (ch.codePointAt(0) ?? 0) < 256);
  if (!onlyByteLikeChars) return name;
  return Buffer.from(name, 'latin1').toString('utf8');
}

function safeBasename(name: string): string {
  const normalized = normalizeUploadOriginalName(name);
  const base = path.basename(normalized).replace(/[/\\?%*:|"<>]/g, '_');
  return base.slice(0, 200) || 'file';
}

function normalizeCategory(category: string | undefined): string {
  const c = (category ?? PROJECT_ATTACHMENT_CATEGORY_ORIGINAL).trim();
  if (!(ALLOWED_PROJECT_ATTACHMENT_CATEGORIES as readonly string[]).includes(c)) {
    throw new BadRequestException(`不支持的附件分类：${c}`);
  }
  return c;
}

@Injectable()
export class ProjectAttachmentsService {
  constructor(
    @InjectRepository(ProjectAttachment)
    private readonly repo: Repository<ProjectAttachment>,
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
    private readonly minio: MinioService,
    private readonly opLogs: OperationLogsService,
  ) {}

  toPublicRow(a: ProjectAttachment) {
    return {
      id: a.id,
      projectId: a.projectId,
      category: a.category,
      originalName: a.originalName,
      mimeType: a.mimeType,
      size: a.size,
      uploaderName: a.uploaderName,
      createdAt: a.createdAt,
    };
  }

  async findByProject(projectId: number, category?: string) {
    const cat = normalizeCategory(category);
    const project = await this.projectRepo.findOne({ where: { id: projectId } });
    if (!project) throw new NotFoundException('项目不存在');
    const rows = await this.repo.find({
      where: { projectId, category: cat, status: 1 },
      order: { id: 'DESC' },
    });
    return rows.map((r) => this.toPublicRow(r));
  }

  async upload(
    projectId: number,
    category: string | undefined,
    file: Express.Multer.File,
    operator?: User,
  ) {
    if (!file?.buffer?.length) throw new BadRequestException('请选择文件');
    if (file.size > MAX_BYTES) throw new BadRequestException('单文件不超过 50MB');

    const cat = normalizeCategory(category);
    const project = await this.projectRepo.findOne({ where: { id: projectId } });
    if (!project) throw new NotFoundException('项目不存在');

    const displayName = normalizeUploadOriginalName(file.originalname);
    const safeName = safeBasename(file.originalname);
    const objectFolder = randomUUID();
    const objectKey = `projects/${projectId}/${objectFolder}/${safeName}`;

    await this.minio.putObject(objectKey, file.buffer, file.size, {
      'Content-Type': file.mimetype || 'application/octet-stream',
    });

    const uploaderName = operator ? operator.realName || operator.username : null;
    const row = this.repo.create({
      projectId,
      category: cat,
      originalName: displayName.slice(0, 512),
      bucket: this.minio.bucketName,
      objectKey,
      mimeType: file.mimetype || null,
      size: String(file.size),
      uploaderName,
      status: 1,
    });
    const saved = await this.repo.save(row);
    await this.opLogs.createLog({
      type: OperationLogType.CREATE,
      target: OperationLogTarget.PROJECT_ATTACHMENT,
      operatorName: operatorNameOf(operator),
      message: `上传 项目附件（${cat}）：${saved.originalName}（项目 #${projectId}）`,
    });
    return this.toPublicRow(saved);
  }

  async getDownloadUrl(id: number, expirySeconds = 600) {
    const row = await this.repo.findOne({ where: { id, status: 1 } });
    if (!row) throw new NotFoundException('附件不存在');
    const url = await this.minio.presignedGetUrl(row.objectKey, expirySeconds);
    return { url, fileName: row.originalName, mimeType: row.mimeType };
  }

  async remove(id: number, operator?: User) {
    const row = await this.repo.findOne({ where: { id, status: 1 } });
    if (!row) throw new NotFoundException('附件不存在');
    try {
      await this.minio.removeObject(row.objectKey);
    } catch {
      // 对象可能已删，仍删除元数据
    }
    await this.repo.remove(row);
    await this.opLogs.createLog({
      type: OperationLogType.DELETE,
      target: OperationLogTarget.PROJECT_ATTACHMENT,
      operatorName: operatorNameOf(operator),
      message: `删除 项目附件（${row.category}）：${row.originalName}（项目 #${row.projectId}）`,
    });
  }
}
