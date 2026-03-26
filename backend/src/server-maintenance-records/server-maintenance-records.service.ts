import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServerMaintenanceRecord } from '../entities/server-maintenance.entity';
import { CreateServerMaintenanceDto } from './dto/create-server-maintenance.dto';
import { UpdateServerMaintenanceDto } from './dto/update-server-maintenance.dto';

@Injectable()
export class ServerMaintenanceRecordsService {
  constructor(
    @InjectRepository(ServerMaintenanceRecord)
    private repo: Repository<ServerMaintenanceRecord>,
  ) {}

  async findAll(query: { projectId?: number; serverId?: number }): Promise<ServerMaintenanceRecord[]> {
    const where: Record<string, unknown> = {};
    if (query.projectId != null) where.projectId = query.projectId;
    if (query.serverId != null) where.serverId = query.serverId;
    return this.repo.find({
      where,
      relations: ['project', 'server'],
      order: { id: 'DESC' },
    });
  }

  async findOne(id: number): Promise<ServerMaintenanceRecord> {
    const one = await this.repo.findOne({ where: { id }, relations: ['project', 'server'] });
    if (!one) throw new NotFoundException('服务器维护记录不存在');
    return one;
  }

  async create(dto: CreateServerMaintenanceDto): Promise<ServerMaintenanceRecord> {
    const entity = this.repo.create({
      projectId: dto.projectId,
      serverId: dto.serverId,
      maintenanceType: dto.maintenanceType,
      content: dto.content,
      operator: dto.operator,
      operatedAt: new Date(dto.operatedAt),
      remark: dto.remark ?? null,
    });
    const saved = await this.repo.save(entity);
    return this.findOne(saved.id);
  }

  async update(id: number, dto: UpdateServerMaintenanceDto): Promise<ServerMaintenanceRecord> {
    await this.findOne(id);
    const updateData: Record<string, unknown> = {};
    if (dto.projectId !== undefined) updateData.projectId = dto.projectId;
    if (dto.serverId !== undefined) updateData.serverId = dto.serverId;
    if (dto.maintenanceType !== undefined) updateData.maintenanceType = dto.maintenanceType;
    if (dto.content !== undefined) updateData.content = dto.content;
    if (dto.operator !== undefined) updateData.operator = dto.operator;
    if (dto.operatedAt !== undefined) updateData.operatedAt = new Date(dto.operatedAt);
    if (dto.remark !== undefined) updateData.remark = dto.remark ?? null;
    if (Object.keys(updateData).length) await this.repo.update(id, updateData);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const entity = await this.findOne(id);
    await this.repo.remove(entity);
  }
}

