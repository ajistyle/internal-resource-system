import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from '../entities/project.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { OperationLogsService } from '../operation-logs/operation-logs.service';
import { OperationLogTarget, OperationLogType } from '../entities/operation-log.entity';

type Operator = { username?: string; realName?: string };
const operatorNameOf = (u: Operator | undefined | null) => (u?.realName || u?.username || 'unknown');
const fmt = (v: unknown) => (v == null || v === '' ? '-' : String(v));

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private repo: Repository<Project>,
    private opLogs: OperationLogsService,
  ) {}

  async findAll(query: { province?: string; city?: string; projectLeader?: string; name?: string }): Promise<Project[]> {
    const qb = this.repo.createQueryBuilder('p');
    if (query.province) qb.andWhere('p.province = :province', { province: query.province });
    if (query.city) qb.andWhere('p.city = :city', { city: query.city });
    if (query.projectLeader) qb.andWhere('p.projectLeader LIKE :leader', { leader: `%${query.projectLeader}%` });
    if (query.name) qb.andWhere('p.name LIKE :name', { name: `%${query.name}%` });
    return qb.orderBy('p.id', 'ASC').getMany();
  }

  async findOne(id: number, withRelations = false): Promise<Project> {
    const project = await this.repo.findOne({
      where: { id },
      relations: withRelations ? ['stakeholders', 'servers', 'remoteInfos'] : [],
    });
    if (!project) throw new NotFoundException('项目不存在');
    return project;
  }

  async create(dto: CreateProjectDto, operator?: Operator): Promise<Project> {
    const project = this.repo.create(dto);
    const saved = await this.repo.save(project);
    await this.opLogs.createLog({
      type: OperationLogType.CREATE,
      target: OperationLogTarget.PROJECT,
      operatorName: operatorNameOf(operator),
      message: `新增 项目信息：${fmt(saved.name)}`,
    });
    return saved;
  }

  async update(id: number, dto: UpdateProjectDto, operator?: Operator): Promise<Project> {
    const before = await this.findOne(id);
    const updateData: Record<string, unknown> = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.projectLeader !== undefined) updateData.projectLeader = dto.projectLeader;
    if (dto.envLeader !== undefined) updateData.envLeader = dto.envLeader;
    if (dto.province !== undefined) updateData.province = dto.province;
    if (dto.city !== undefined) updateData.city = dto.city;
    if (dto.remark !== undefined) updateData.remark = dto.remark;
    if (Object.keys(updateData).length) await this.repo.update(id, updateData);
    const after = await this.findOne(id);

    const changes: string[] = [];
    (Object.keys(updateData) as (keyof Project)[]).forEach((k) => {
      const b = (before as unknown as Record<string, unknown>)[k as string];
      const a = (after as unknown as Record<string, unknown>)[k as string];
      if (fmt(b) !== fmt(a)) changes.push(`${String(k)}：${fmt(b)} -> ${fmt(a)}`);
    });
    if (changes.length) {
      await this.opLogs.createLog({
        type: OperationLogType.UPDATE,
        target: OperationLogTarget.PROJECT,
        operatorName: operatorNameOf(operator),
        message: `变更 项目信息：${fmt(after.name)}；${changes.join('；')}`,
      });
    }
    return after;
  }

  async remove(id: number, operator?: Operator): Promise<void> {
    const project = await this.findOne(id);
    await this.repo.remove(project);
    await this.opLogs.createLog({
      type: OperationLogType.DELETE,
      target: OperationLogTarget.PROJECT,
      operatorName: operatorNameOf(operator),
      message: `删除 项目信息：${fmt(project.name)}`,
    });
  }
}
