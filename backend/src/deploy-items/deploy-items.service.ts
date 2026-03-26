import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeployItem } from '../entities/deploy-item.entity';
import { CreateDeployItemDto } from './dto/create-deploy-item.dto';
import { UpdateDeployItemDto } from './dto/update-deploy-item.dto';
import { OperationLogsService } from '../operation-logs/operation-logs.service';
import { OperationLogTarget, OperationLogType } from '../entities/operation-log.entity';

type Operator = { username?: string; realName?: string };
const operatorNameOf = (u: Operator | undefined | null) => (u?.realName || u?.username || 'unknown');
const fmt = (v: unknown) => (v == null || v === '' ? '-' : String(v));

@Injectable()
export class DeployItemsService {
  constructor(
    @InjectRepository(DeployItem)
    private repo: Repository<DeployItem>,
    private opLogs: OperationLogsService,
  ) {}

  async findAll(enabled?: number, softwareType?: string, name?: string): Promise<DeployItem[]> {
    const qb = this.repo.createQueryBuilder('d').orderBy('d.id', 'ASC');
    if (enabled != null) qb.andWhere('d.enabled = :enabled', { enabled });
    if (softwareType != null && softwareType !== '') qb.andWhere('d.softwareType = :softwareType', { softwareType });
    if (name != null && name !== '') qb.andWhere('d.name LIKE :name', { name: `%${name}%` });
    return qb.getMany();
  }

  async findOne(id: number): Promise<DeployItem> {
    const one = await this.repo.findOne({ where: { id } });
    if (!one) throw new NotFoundException('部署内容不存在');
    return one;
  }

  async create(dto: CreateDeployItemDto, operator?: Operator): Promise<DeployItem> {
    const entity = this.repo.create({
      ...dto,
      selectedAt: dto.selectedAt ? new Date(dto.selectedAt) : null,
      enabled: dto.enabled ?? 1,
    });
    const saved = await this.repo.save(entity);
    await this.opLogs.createLog({
      type: OperationLogType.CREATE,
      target: OperationLogTarget.DEPLOY_ITEM,
      operatorName: operatorNameOf(operator),
      message: `新增 软件清单：${fmt(saved.name)}`,
    });
    return saved;
  }

  async update(id: number, dto: UpdateDeployItemDto, operator?: Operator): Promise<DeployItem> {
    const before = await this.findOne(id);
    const updateData: Record<string, unknown> = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.version !== undefined) updateData.version = dto.version;
    if (dto.softwareType !== undefined) updateData.softwareType = dto.softwareType;
    if (dto.defaultAccess !== undefined) updateData.defaultAccess = dto.defaultAccess;
    if (dto.selectedAt !== undefined) updateData.selectedAt = dto.selectedAt ? new Date(dto.selectedAt) : null;
    if (dto.enabled !== undefined) updateData.enabled = dto.enabled;
    if (dto.remark !== undefined) updateData.remark = dto.remark;
    if (Object.keys(updateData).length) await this.repo.update(id, updateData);
    const after = await this.findOne(id);

    const changes: string[] = [];
    (Object.keys(updateData) as string[]).forEach((k) => {
      const b = (before as unknown as Record<string, unknown>)[k];
      const a = (after as unknown as Record<string, unknown>)[k];
      if (fmt(b) !== fmt(a)) changes.push(`${k}：${fmt(b)} -> ${fmt(a)}`);
    });
    if (changes.length) {
      await this.opLogs.createLog({
        type: OperationLogType.UPDATE,
        target: OperationLogTarget.DEPLOY_ITEM,
        operatorName: operatorNameOf(operator),
        message: `变更 软件清单：${fmt(after.name)}；${changes.join('；')}`,
      });
    }
    return after;
  }

  async remove(id: number, operator?: Operator): Promise<void> {
    const entity = await this.findOne(id);
    await this.repo.remove(entity);
    await this.opLogs.createLog({
      type: OperationLogType.DELETE,
      target: OperationLogTarget.DEPLOY_ITEM,
      operatorName: operatorNameOf(operator),
      message: `删除 软件清单：${fmt(entity.name)}`,
    });
  }
}
