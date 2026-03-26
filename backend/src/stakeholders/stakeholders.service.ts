import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Stakeholder } from '../entities/stakeholder.entity';
import { CreateStakeholderDto } from './dto/create-stakeholder.dto';
import { UpdateStakeholderDto } from './dto/update-stakeholder.dto';
import { OperationLogsService } from '../operation-logs/operation-logs.service';
import { OperationLogTarget, OperationLogType } from '../entities/operation-log.entity';

type Operator = { username?: string; realName?: string };
const operatorNameOf = (u: Operator | undefined | null) => (u?.realName || u?.username || 'unknown');
const fmt = (v: unknown) => (v == null || v === '' ? '-' : String(v));

@Injectable()
export class StakeholdersService {
  constructor(
    @InjectRepository(Stakeholder)
    private repo: Repository<Stakeholder>,
    private opLogs: OperationLogsService,
  ) {}

  async findAll(query: { projectId?: number; name?: string }): Promise<Stakeholder[]> {
    const qb = this.repo.createQueryBuilder('s').leftJoinAndSelect('s.project', 'project');
    if (query.projectId != null) {
      qb.andWhere('s.projectId = :projectId', { projectId: query.projectId });
    }
    if (query.name != null && query.name !== '') {
      qb.andWhere('s.name LIKE :name', { name: `%${query.name}%` });
    }
    return qb.orderBy('s.id', 'ASC').getMany();
  }

  async findOne(id: number): Promise<Stakeholder> {
    const one = await this.repo.findOne({
      where: { id },
      relations: ['project'],
    });
    if (!one) throw new NotFoundException('干系人不存在');
    return one;
  }

  async create(dto: CreateStakeholderDto, operator?: Operator): Promise<Stakeholder> {
    const entity = this.repo.create(dto);
    const saved = await this.repo.save(entity);
    await this.opLogs.createLog({
      type: OperationLogType.CREATE,
      target: OperationLogTarget.STAKEHOLDER,
      operatorName: operatorNameOf(operator),
      message: `新增 干系人信息：${fmt(saved.name)}`,
    });
    return saved;
  }

  async update(id: number, dto: UpdateStakeholderDto, operator?: Operator): Promise<Stakeholder> {
    const before = await this.findOne(id);
    const updateData: Record<string, unknown> = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.contact !== undefined) updateData.contact = dto.contact;
    if (dto.role !== undefined) updateData.role = dto.role;
    if (dto.remark !== undefined) updateData.remark = dto.remark;
    if (Object.keys(updateData).length) await this.repo.update(id, updateData);
    const after = await this.findOne(id);

    const changes: string[] = [];
    (Object.keys(updateData) as (keyof Stakeholder)[]).forEach((k) => {
      const b = (before as unknown as Record<string, unknown>)[k as string];
      const a = (after as unknown as Record<string, unknown>)[k as string];
      if (fmt(b) !== fmt(a)) changes.push(`${String(k)}：${fmt(b)} -> ${fmt(a)}`);
    });
    if (changes.length) {
      await this.opLogs.createLog({
        type: OperationLogType.UPDATE,
        target: OperationLogTarget.STAKEHOLDER,
        operatorName: operatorNameOf(operator),
        message: `变更 干系人信息：${fmt(after.name)}；${changes.join('；')}`,
      });
    }
    return after;
  }

  async remove(id: number, operator?: Operator): Promise<void> {
    const entity = await this.findOne(id);
    await this.repo.remove(entity);
    await this.opLogs.createLog({
      type: OperationLogType.DELETE,
      target: OperationLogTarget.STAKEHOLDER,
      operatorName: operatorNameOf(operator),
      message: `删除 干系人信息：${fmt(entity.name)}`,
    });
  }
}
