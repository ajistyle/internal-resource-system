import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RemoteInfo } from '../entities/remote-info.entity';
import { CreateRemoteInfoDto } from './dto/create-remote-info.dto';
import { UpdateRemoteInfoDto } from './dto/update-remote-info.dto';
import { OperationLogsService } from '../operation-logs/operation-logs.service';
import { OperationLogTarget, OperationLogType } from '../entities/operation-log.entity';

type Operator = { username?: string; realName?: string };
const operatorNameOf = (u: Operator | undefined | null) => (u?.realName || u?.username || 'unknown');
const fmt = (v: unknown) => (v == null || v === '' ? '-' : String(v));

@Injectable()
export class RemoteInfosService {
  constructor(
    @InjectRepository(RemoteInfo)
    private repo: Repository<RemoteInfo>,
    private opLogs: OperationLogsService,
  ) {}

  async findAll(projectId?: number): Promise<RemoteInfo[]> {
    const where = projectId != null ? { projectId } : {};
    return this.repo.find({
      where,
      relations: ['project'],
      order: { id: 'ASC' },
    });
  }

  async findOne(id: number): Promise<RemoteInfo> {
    const one = await this.repo.findOne({
      where: { id },
      relations: ['project'],
    });
    if (!one) throw new NotFoundException('远程信息不存在');
    return one;
  }

  async create(dto: CreateRemoteInfoDto, operator?: Operator): Promise<RemoteInfo> {
    const entity = this.repo.create(dto);
    const saved = await this.repo.save(entity);
    await this.opLogs.createLog({
      type: OperationLogType.CREATE,
      target: OperationLogTarget.REMOTE_INFO,
      operatorName: operatorNameOf(operator),
      message: `新增 远程信息：${fmt(saved.remark || `#${saved.id}`)}`,
    });
    return saved;
  }

  async update(id: number, dto: UpdateRemoteInfoDto, operator?: Operator): Promise<RemoteInfo> {
    const before = await this.findOne(id);
    const updateData: Record<string, unknown> = {};
    if (dto.content !== undefined) updateData.content = dto.content;
    if (dto.remark !== undefined) updateData.remark = dto.remark;
    if (Object.keys(updateData).length) await this.repo.update(id, updateData);
    const after = await this.findOne(id);

    const changes: string[] = [];
    (Object.keys(updateData) as string[]).forEach((k) => {
      const b = (before as unknown as Record<string, unknown>)[k];
      const a = (after as unknown as Record<string, unknown>)[k];
      if (k === 'content') {
        if (fmt(b) !== fmt(a)) changes.push('content：已更新');
      } else if (fmt(b) !== fmt(a)) {
        changes.push(`${k}：${fmt(b)} -> ${fmt(a)}`);
      }
    });
    if (changes.length) {
      await this.opLogs.createLog({
        type: OperationLogType.UPDATE,
        target: OperationLogTarget.REMOTE_INFO,
        operatorName: operatorNameOf(operator),
        message: `变更 远程信息：${fmt(after.remark || `#${after.id}`)}；${changes.join('；')}`,
      });
    }
    return after;
  }

  async remove(id: number, operator?: Operator): Promise<void> {
    const entity = await this.findOne(id);
    await this.repo.remove(entity);
    await this.opLogs.createLog({
      type: OperationLogType.DELETE,
      target: OperationLogTarget.REMOTE_INFO,
      operatorName: operatorNameOf(operator),
      message: `删除 远程信息：${fmt(entity.remark || `#${entity.id}`)}`,
    });
  }
}
