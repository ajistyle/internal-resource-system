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
import { RemoteInfosService } from './remote-infos.service';
import { CreateRemoteInfoDto } from './dto/create-remote-info.dto';
import { UpdateRemoteInfoDto } from './dto/update-remote-info.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleCode } from '../entities/role.entity';

@Controller('remote-infos')
@UseGuards(JwtAuthGuard)
export class RemoteInfosController {
  constructor(private remoteInfosService: RemoteInfosService) {}

  @Get()
  findAll(@Query('projectId') projectId?: string) {
    const pid = projectId != null && projectId !== '' ? parseInt(projectId, 10) : undefined;
    return this.remoteInfosService.findAll(pid);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.remoteInfosService.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(RoleCode.ADMIN, RoleCode.EDITOR)
  create(@Body() dto: CreateRemoteInfoDto, @Req() req: Request) {
    return this.remoteInfosService.create(dto, req.user as any);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleCode.ADMIN, RoleCode.EDITOR)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRemoteInfoDto,
    @Req() req: Request,
  ) {
    return this.remoteInfosService.update(id, dto, req.user as any);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleCode.ADMIN, RoleCode.EDITOR)
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    return this.remoteInfosService.remove(id, req.user as any);
  }
}
