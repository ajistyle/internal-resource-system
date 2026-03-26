import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DataBackup } from './entities/data-backup.entity';
import { CreateDataBackupDto } from './dto/create-data-backup.dto';
import { UpdateDataBackupDto } from './dto/update-data-backup.dto';
import { OperationLogsService } from '../operation-logs/operation-logs.service';
import { OperationLogTarget, OperationLogType } from '../entities/operation-log.entity';

type Operator = { username?: string; realName?: string };
const operatorNameOf = (u: Operator | undefined | null) => u?.realName || u?.username || 'unknown';
const fmt = (v: unknown) => (v == null || v === '' ? '-' : String(v));

@Injectable()
export class DataBackupsService {
  constructor(
    @InjectRepository(DataBackup)
    private repo: Repository<DataBackup>,
    private opLogs: OperationLogsService,
  ) {}

  async findAll(query: { projectId?: number; serverId?: number; backupType?: string; backupPolicy?: string }) {
    const qb = this.repo.createQueryBuilder('b').leftJoinAndSelect('b.project', 'p').leftJoinAndSelect('b.server', 's');
    if (query.projectId != null) qb.andWhere('b.projectId = :projectId', { projectId: query.projectId });
    if (query.serverId != null) qb.andWhere('b.serverId = :serverId', { serverId: query.serverId });
    if (query.backupType) qb.andWhere('b.backupType = :backupType', { backupType: query.backupType });
    if (query.backupPolicy) qb.andWhere('b.backupPolicy = :backupPolicy', { backupPolicy: query.backupPolicy });
    qb.orderBy('b.id', 'DESC');
    return qb.getMany();
  }

  async findOne(id: number) {
    const row = await this.repo.findOne({ where: { id }, relations: ['project', 'server'] });
    if (!row) throw new NotFoundException('数据备份配置不存在');
    return row;
  }

  async create(dto: CreateDataBackupDto, operator?: Operator) {
    const entity = this.repo.create({
      projectId: dto.projectId,
      serverId: dto.serverId,
      backupType: dto.backupType,
      backupPolicy: dto.backupPolicy,
      scope: dto.scope,
      cron: dto.cron,
      retentionDays: dto.retentionDays,
      localBackupPath: dto.localBackupPath ?? null,
      remoteBackupPath: dto.remoteBackupPath ?? null,
      localScriptPath: dto.localScriptPath ?? null,
      gitScriptPath: dto.gitScriptPath ?? null,
      remark: dto.remark ?? null,
    });
    const saved = await this.repo.save(entity);
    const after = await this.findOne(saved.id);
    await this.opLogs.createLog({
      type: OperationLogType.CREATE,
      target: OperationLogTarget.DATA_BACKUP,
      operatorName: operatorNameOf(operator),
      message: `新增 数据备份：服务器 ${fmt((after.server as any)?.ip)} 类型 ${fmt(after.backupType)} 策略 ${fmt(after.backupPolicy)}`,
    });
    return after;
  }

  async update(id: number, dto: UpdateDataBackupDto, operator?: Operator) {
    const before = await this.findOne(id);
    const updateData: Record<string, unknown> = {};
    if (dto.projectId !== undefined) updateData.projectId = dto.projectId;
    if (dto.serverId !== undefined) updateData.serverId = dto.serverId;
    if (dto.backupType !== undefined) updateData.backupType = dto.backupType;
    if (dto.backupPolicy !== undefined) updateData.backupPolicy = dto.backupPolicy;
    if (dto.scope !== undefined) updateData.scope = dto.scope;
    if (dto.cron !== undefined) updateData.cron = dto.cron;
    if (dto.retentionDays !== undefined) updateData.retentionDays = dto.retentionDays;
    if (dto.localBackupPath !== undefined) updateData.localBackupPath = dto.localBackupPath ?? null;
    if (dto.remoteBackupPath !== undefined) updateData.remoteBackupPath = dto.remoteBackupPath ?? null;
    if (dto.localScriptPath !== undefined) updateData.localScriptPath = dto.localScriptPath ?? null;
    if (dto.gitScriptPath !== undefined) updateData.gitScriptPath = dto.gitScriptPath ?? null;
    if (dto.remark !== undefined) updateData.remark = dto.remark ?? null;
    if (Object.keys(updateData).length) await this.repo.update(id, updateData);
    const after = await this.findOne(id);

    const changes: string[] = [];
    Object.keys(updateData).forEach((k) => {
      const b = (before as any)[k];
      const a = (after as any)[k];
      if (fmt(b) !== fmt(a)) changes.push(`${k}：${fmt(b)} -> ${fmt(a)}`);
    });
    if (changes.length) {
      await this.opLogs.createLog({
        type: OperationLogType.UPDATE,
        target: OperationLogTarget.DATA_BACKUP,
        operatorName: operatorNameOf(operator),
        message: `变更 数据备份：#${id}；${changes.join('；')}`,
      });
    }
    return after;
  }

  async remove(id: number, operator?: Operator) {
    const row = await this.findOne(id);
    await this.repo.remove(row);
    await this.opLogs.createLog({
      type: OperationLogType.DELETE,
      target: OperationLogTarget.DATA_BACKUP,
      operatorName: operatorNameOf(operator),
      message: `删除 数据备份：#${id} 服务器 ${fmt((row.server as any)?.ip)}`,
    });
  }
}

