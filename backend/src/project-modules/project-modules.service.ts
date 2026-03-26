import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectModule } from '../entities';
import { CreateProjectModuleDto } from './dto/create-project-module.dto';
import { UpdateProjectModuleDto } from './dto/update-project-module.dto';

@Injectable()
export class ProjectModulesService {
  constructor(@InjectRepository(ProjectModule) private repo: Repository<ProjectModule>) {}

  async listByProjectId(projectId: number) {
    return this.repo.find({ where: { projectId }, order: { id: 'DESC' } });
  }

  async create(dto: CreateProjectModuleDto) {
    if (!dto.projectId) throw new BadRequestException('projectId不能为空');
    const entity = this.repo.create({
      projectId: dto.projectId,
      moduleName: dto.moduleName,
      remark: dto.remark ?? null,
    });
    const saved = await this.repo.save(entity);
    return saved;
  }

  async update(id: number, dto: UpdateProjectModuleDto) {
    const before = await this.repo.findOne({ where: { id } });
    if (!before) throw new NotFoundException('项目模块不存在');

    const updateData: Partial<ProjectModule> = {};
    if (dto.moduleName !== undefined) updateData.moduleName = dto.moduleName;
    if (dto.remark !== undefined) updateData.remark = dto.remark;

    await this.repo.update(id, updateData);
    const after = await this.repo.findOne({ where: { id } });
    if (!after) throw new NotFoundException('项目模块不存在');
    return after;
  }

  async remove(id: number) {
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('项目模块不存在');
    await this.repo.remove(entity);
  }
}

