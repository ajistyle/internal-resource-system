import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from '../entities/project.entity';
import { Stakeholder } from '../entities/stakeholder.entity';
import { Server } from '../entities/server.entity';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';

@Module({
  imports: [TypeOrmModule.forFeature([Project, Stakeholder, Server])],
  controllers: [StatsController],
  providers: [StatsService],
})
export class StatsModule {}

