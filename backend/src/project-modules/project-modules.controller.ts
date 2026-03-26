import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { CreateProjectModuleDto } from './dto/create-project-module.dto';
import { UpdateProjectModuleDto } from './dto/update-project-module.dto';
import { ProjectModulesService } from './project-modules.service';

@Controller('project-modules')
export class ProjectModulesController {
  constructor(private readonly service: ProjectModulesService) {}

  @Get()
  list(@Query('projectId', ParseIntPipe) projectId: number) {
    return this.service.listByProjectId(projectId);
  }

  @Post()
  create(@Body() dto: CreateProjectModuleDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProjectModuleDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}

