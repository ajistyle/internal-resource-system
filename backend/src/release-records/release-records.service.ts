import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IngestReleaseRecordDto } from './dto/ingest-release-record.dto';
import { ReleaseRecord } from '../entities';
import { ListReleaseRecordsQueryDto } from './dto/list-release-records-query.dto';

@Injectable()
export class ReleaseRecordsService {
  constructor(
    @InjectRepository(ReleaseRecord)
    private readonly repo: Repository<ReleaseRecord>,
  ) {}

  async ingest(dto: IngestReleaseRecordDto) {
    const releasedAt = dto.releasedAt ? new Date(dto.releasedAt) : null;
    if (releasedAt && Number.isNaN(releasedAt.getTime())) {
      throw new BadRequestException('releasedAt 时间格式不正确');
    }

    const entity = this.repo.create({
      projectId: dto.projectId,
      environment: dto.environment ?? null,
      versionTag: dto.versionTag ?? null,
      releasedAt,
      releasedBy: dto.releasedBy ?? null,
      remark: dto.remark ?? null,
    });

    const saved = await this.repo.save(entity);
    return { id: saved.id };
  }

  async list(query: ListReleaseRecordsQueryDto) {
    const qb = this.repo.createQueryBuilder('r').orderBy('r.releasedAt', 'DESC');

    if (query.projectId != null) qb.andWhere('r.projectId = :projectId', { projectId: query.projectId });
    if (query.environment) qb.andWhere('r.environment = :environment', { environment: query.environment });
    if (query.versionTag) qb.andWhere('r.versionTag LIKE :versionTag', { versionTag: `%${query.versionTag}%` });
    if (query.startAt) qb.andWhere('r.releasedAt >= :startAt', { startAt: new Date(query.startAt) });
    if (query.endAt) qb.andWhere('r.releasedAt <= :endAt', { endAt: new Date(query.endAt) });
    if (query.keyword) {
      qb.andWhere('(r.releasedBy LIKE :kw OR r.remark LIKE :kw)', { kw: `%${query.keyword}%` });
    }

    const data = await qb.getMany();
    return data;
  }
}

