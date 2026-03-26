import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DataMaintenanceRecord } from '../entities/data-maintenance.entity';
import { CreateDataMaintenanceDto } from './dto/create-data-maintenance.dto';
import { UpdateDataMaintenanceDto } from './dto/update-data-maintenance.dto';

@Injectable()
export class DataMaintenanceRecordsService {
  constructor(
    @InjectRepository(DataMaintenanceRecord)
    private repo: Repository<DataMaintenanceRecord>,
  ) {}

  async findAll(query: { projectId?: number; databaseId?: number }): Promise<DataMaintenanceRecord[]> {
    const where: Record<string, unknown> = {};
    if (query.projectId != null) where.projectId = query.projectId;
    if (query.databaseId != null) where.databaseId = query.databaseId;
    return this.repo.find({
      where,
      relations: ['project', 'database', 'database.project'],
      order: { id: 'DESC' },
    });
  }

  async findOne(id: number): Promise<DataMaintenanceRecord> {
    const one = await this.repo.findOne({ where: { id }, relations: ['project', 'database', 'database.project'] });
    if (!one) throw new NotFoundException('数据维护记录不存在');
    return one;
  }

  async create(dto: CreateDataMaintenanceDto): Promise<DataMaintenanceRecord> {
    const entity = this.repo.create({
      projectId: dto.projectId,
      databaseId: dto.databaseId,
      requestSource: dto.requestSource,
      complianceNote: dto.complianceNote ?? null,
      handlingMeasure: dto.handlingMeasure ?? null,
      handlingCount: dto.handlingCount == null ? null : dto.handlingCount,
      handledAt: new Date(dto.handledAt),
      handler: dto.handler,
      remark: dto.remark ?? null,
    });
    const saved = await this.repo.save(entity);
    return this.findOne(saved.id);
  }

  async update(id: number, dto: UpdateDataMaintenanceDto): Promise<DataMaintenanceRecord> {
    await this.findOne(id);
    const updateData: Record<string, unknown> = {};
    if (dto.projectId !== undefined) updateData.projectId = dto.projectId;
    if (dto.databaseId !== undefined) updateData.databaseId = dto.databaseId;
    if (dto.requestSource !== undefined) updateData.requestSource = dto.requestSource;
    if (dto.complianceNote !== undefined) updateData.complianceNote = dto.complianceNote ?? null;
    if (dto.handlingMeasure !== undefined) updateData.handlingMeasure = dto.handlingMeasure ?? null;
    if (dto.handlingCount !== undefined) updateData.handlingCount = dto.handlingCount == null ? null : dto.handlingCount;
    if (dto.handledAt !== undefined) updateData.handledAt = new Date(dto.handledAt);
    if (dto.handler !== undefined) updateData.handler = dto.handler;
    if (dto.remark !== undefined) updateData.remark = dto.remark ?? null;
    if (Object.keys(updateData).length) await this.repo.update(id, updateData);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const entity = await this.findOne(id);
    await this.repo.remove(entity);
  }
}

