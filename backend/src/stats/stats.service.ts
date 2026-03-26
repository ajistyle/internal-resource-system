import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from '../entities/project.entity';
import { Stakeholder } from '../entities/stakeholder.entity';
import { Server } from '../entities/server.entity';

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(Project) private projectRepo: Repository<Project>,
    @InjectRepository(Stakeholder) private stakeholderRepo: Repository<Stakeholder>,
    @InjectRepository(Server) private serverRepo: Repository<Server>,
  ) {}

  async overview() {
    const [projectCount, stakeholderCount, serverCount] = await Promise.all([
      this.projectRepo.count(),
      this.stakeholderRepo.count(),
      this.serverRepo.count(),
    ]);
    return { projectCount, stakeholderCount, serverCount };
  }
}

