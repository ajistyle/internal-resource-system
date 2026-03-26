import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectModule } from '../entities';
import { ProjectModulesController } from './project-modules.controller';
import { ProjectModulesService } from './project-modules.service';

@Module({
  imports: [TypeOrmModule.forFeature([ProjectModule])],
  controllers: [ProjectModulesController],
  providers: [ProjectModulesService],
})
export class ProjectModulesModule {}

