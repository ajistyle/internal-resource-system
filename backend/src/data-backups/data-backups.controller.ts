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
import { DataBackupsService } from './data-backups.service';
import { CreateDataBackupDto } from './dto/create-data-backup.dto';
import { UpdateDataBackupDto } from './dto/update-data-backup.dto';

@Controller('data-backups')
@UseGuards(JwtAuthGuard)
export class DataBackupsController {
  constructor(private service: DataBackupsService) {}

  @Get()
  findAll(
    @Query('projectId') projectId?: string,
    @Query('serverId') serverId?: string,
    @Query('backupType') backupType?: string,
    @Query('backupPolicy') backupPolicy?: string,
  ) {
    const pid = projectId != null && projectId !== '' ? parseInt(projectId, 10) : undefined;
    const sid = serverId != null && serverId !== '' ? parseInt(serverId, 10) : undefined;
    return this.service.findAll({ projectId: pid, serverId: sid, backupType, backupPolicy });
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(RoleCode.ADMIN, RoleCode.EDITOR)
  create(@Body() dto: CreateDataBackupDto, @Req() req: Request) {
    return this.service.create(dto, req.user as any);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleCode.ADMIN, RoleCode.EDITOR)
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateDataBackupDto, @Req() req: Request) {
    return this.service.update(id, dto, req.user as any);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleCode.ADMIN, RoleCode.EDITOR)
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    return this.service.remove(id, req.user as any);
  }
}

