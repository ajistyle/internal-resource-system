import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Dictionary } from '../entities/dictionary.entity';
import { CreateDictionaryDto } from './dto/create-dictionary.dto';
import { UpdateDictionaryDto } from './dto/update-dictionary.dto';
import { OperationLogsService } from '../operation-logs/operation-logs.service';
import { OperationLogTarget, OperationLogType } from '../entities/operation-log.entity';

type Operator = { username?: string; realName?: string };
const operatorNameOf = (u: Operator | undefined | null) => (u?.realName || u?.username || 'unknown');
const fmt = (v: unknown) => (v == null || v === '' ? '-' : String(v));

@Injectable()
export class DictionariesService {
  constructor(
    @InjectRepository(Dictionary)
    private repo: Repository<Dictionary>,
    private opLogs: OperationLogsService,
  ) {}

  async findAll(query: { code?: string; name?: string; parentCode?: string; status?: number }): Promise<Dictionary[]> {
    const qb = this.repo.createQueryBuilder('d');
    if (query.code != null && query.code !== '') {
      qb.andWhere('d.code LIKE :code', { code: `%${query.code}%` });
    }
    if (query.name != null && query.name !== '') {
      qb.andWhere('d.name LIKE :name', { name: `%${query.name}%` });
    }
    if (query.parentCode != null && query.parentCode !== '') {
      qb.andWhere('d.parentCode = :parentCode', { parentCode: query.parentCode });
    }
    if (query.status != null) {
      qb.andWhere('d.status = :status', { status: query.status });
    }
    return qb.orderBy('d.code', 'ASC').getMany();
  }

  async findOne(id: number): Promise<Dictionary> {
    const one = await this.repo.findOne({ where: { id } });
    if (!one) throw new NotFoundException('字典不存在');
    return one;
  }

  async findByCode(code: string): Promise<Dictionary | null> {
    return this.repo.findOne({ where: { code } });
  }

  async create(dto: CreateDictionaryDto, operator?: Operator): Promise<Dictionary> {
    const exists = await this.repo.findOne({ where: { code: dto.code } });
    if (exists) throw new ConflictException('字典代码已存在');
    const entity = this.repo.create({
      ...dto,
      parentCode: dto.parentCode?.trim() || null,
      status: dto.status ?? 1,
    });
    const saved = await this.repo.save(entity);
    await this.opLogs.createLog({
      type: OperationLogType.CREATE,
      target: OperationLogTarget.DICTIONARY,
      operatorName: operatorNameOf(operator),
      message: `新增 字典：${fmt(saved.name)}（${fmt(saved.code)}）`,
    });
    return saved;
  }

  async update(id: number, dto: UpdateDictionaryDto, operator?: Operator): Promise<Dictionary> {
    const current = await this.findOne(id);
    const code = dto.code !== undefined ? dto.code : current.code;
    if (dto.code !== undefined) {
      const exists = await this.repo.findOne({ where: { code } });
      if (exists && exists.id !== id) throw new ConflictException('字典代码已存在');
    }
    const updateData: Record<string, unknown> = {};
    if (dto.code !== undefined) updateData.code = dto.code;
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.parentCode !== undefined) updateData.parentCode = dto.parentCode || null;
    if (dto.status !== undefined) updateData.status = dto.status;
    if (Object.keys(updateData).length) await this.repo.update(id, updateData);
    const after = await this.findOne(id);

    const changes: string[] = [];
    (Object.keys(updateData) as string[]).forEach((k) => {
      const b = (current as unknown as Record<string, unknown>)[k];
      const a = (after as unknown as Record<string, unknown>)[k];
      if (fmt(b) !== fmt(a)) changes.push(`${k}：${fmt(b)} -> ${fmt(a)}`);
    });
    if (changes.length) {
      await this.opLogs.createLog({
        type: OperationLogType.UPDATE,
        target: OperationLogTarget.DICTIONARY,
        operatorName: operatorNameOf(operator),
        message: `变更 字典：${fmt(after.name)}（${fmt(after.code)}）；${changes.join('；')}`,
      });
    }
    return after;
  }

  async remove(id: number, operator?: Operator): Promise<void> {
    const entity = await this.findOne(id);
    await this.repo.remove(entity);
    await this.opLogs.createLog({
      type: OperationLogType.DELETE,
      target: OperationLogTarget.DICTIONARY,
      operatorName: operatorNameOf(operator),
      message: `删除 字典：${fmt(entity.name)}（${fmt(entity.code)}）`,
    });
  }
}
