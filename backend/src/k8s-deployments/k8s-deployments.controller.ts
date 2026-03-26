import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleCode } from '../entities/role.entity';
import { K8sDeploymentsService } from './k8s-deployments.service';
import { CreateK8sDeploymentDto } from './dto/create-k8s-deployment.dto';
import { UpdateK8sDeploymentDto } from './dto/update-k8s-deployment.dto';

@Controller('k8s-deployments')
@UseGuards(JwtAuthGuard)
export class K8sDeploymentsController {
  constructor(private readonly service: K8sDeploymentsService) {}

  @Get()
  findAll(
    @Query('projectId') projectId?: string,
    @Query('clusterEnv') clusterEnv?: string,
    @Query('status') status?: string,
    @Query('keyword') keyword?: string,
  ) {
    const pid = projectId != null && projectId !== '' ? parseInt(projectId, 10) : undefined;
    return this.service.findAll({ projectId: pid, clusterEnv, status, keyword });
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(RoleCode.ADMIN, RoleCode.EDITOR)
  create(@Body() dto: CreateK8sDeploymentDto, @Req() req: Request) {
    return this.service.create(dto, req.user as any);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleCode.ADMIN, RoleCode.EDITOR)
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateK8sDeploymentDto, @Req() req: Request) {
    return this.service.update(id, dto, req.user as any);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleCode.ADMIN, RoleCode.EDITOR)
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    return this.service.remove(id, req.user as any);
  }
}

