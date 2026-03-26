import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseIntPipe,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { DeployItemsService } from './deploy-items.service';
import { CreateDeployItemDto } from './dto/create-deploy-item.dto';
import { UpdateDeployItemDto } from './dto/update-deploy-item.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleCode } from '../entities/role.entity';

@Controller('deploy-items')
@UseGuards(JwtAuthGuard)
export class DeployItemsController {
  constructor(private deployItemsService: DeployItemsService) {}

  @Get()
  findAll(
    @Query('enabled') enabled?: string,
    @Query('softwareType') softwareType?: string,
    @Query('name') name?: string,
  ) {
    const en = enabled != null && enabled !== '' ? parseInt(enabled, 10) : undefined;
    return this.deployItemsService.findAll(en, softwareType, name);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.deployItemsService.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(RoleCode.ADMIN, RoleCode.EDITOR)
  create(@Body() dto: CreateDeployItemDto, @Req() req: Request) {
    return this.deployItemsService.create(dto, req.user as any);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleCode.ADMIN, RoleCode.EDITOR)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDeployItemDto,
    @Req() req: Request,
  ) {
    return this.deployItemsService.update(id, dto, req.user as any);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleCode.ADMIN, RoleCode.EDITOR)
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    return this.deployItemsService.remove(id, req.user as any);
  }
}
