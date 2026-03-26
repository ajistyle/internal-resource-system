import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OperationLog, OperationLogTarget, OperationLogType } from '../entities/operation-log.entity';

@Injectable()
export class OperationLogsService {
  constructor(
    @InjectRepository(OperationLog)
    private repo: Repository<OperationLog>,
  ) {}

  async createLog(params: {
    type: OperationLogType;
    target: OperationLogTarget;
    operatorName: string;
    message: string;
  }) {
    const row = this.repo.create(params);
    return this.repo.save(row);
  }

  async findAll(query: {
    startTime?: string;
    endTime?: string;
    type?: string;
    target?: string;
    message?: string;
  }) {
    const qb = this.repo.createQueryBuilder('l').orderBy('l.createdAt', 'DESC');

    if (query.startTime) qb.andWhere('l.createdAt >= :start', { start: new Date(query.startTime) });
    if (query.endTime) qb.andWhere('l.createdAt <= :end', { end: new Date(query.endTime) });
    if (query.type) qb.andWhere('l.type = :type', { type: query.type });
    if (query.target) qb.andWhere('l.target = :target', { target: query.target });
    if (query.message) qb.andWhere('l.message LIKE :msg', { msg: `%${query.message}%` });

    qb.take(500);
    return qb.getMany();
  }
}

