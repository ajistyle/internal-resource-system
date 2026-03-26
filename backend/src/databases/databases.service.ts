import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Database } from '../entities/database.entity';

@Injectable()
export class DatabasesService {
  constructor(
    @InjectRepository(Database)
    private repo: Repository<Database>,
  ) {}

  async findAll(projectId?: number): Promise<Database[]> {
    const where = projectId != null ? { projectId } : {};
    return this.repo.find({
      where,
      relations: ['project'],
      order: { id: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Database> {
    const one = await this.repo.findOne({ where: { id }, relations: ['project'] });
    if (!one) throw new NotFoundException('数据库记录不存在');
    return one;
  }
}

