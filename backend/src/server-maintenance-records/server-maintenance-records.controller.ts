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
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleCode } from '../entities/role.entity';
import { ServerMaintenanceRecordsService } from './server-maintenance-records.service';
import { CreateServerMaintenanceDto } from './dto/create-server-maintenance.dto';
import { UpdateServerMaintenanceDto } from './dto/update-server-maintenance.dto';

@Controller('server-maintenance-records')
@UseGuards(JwtAuthGuard)
export class ServerMaintenanceRecordsController {
  constructor(private service: ServerMaintenanceRecordsService) {}

  @Get()
  findAll(@Query('projectId') projectId?: string, @Query('serverId') serverId?: string) {
    const pid = projectId != null && projectId !== '' ? parseInt(projectId, 10) : undefined;
    const sid = serverId != null && serverId !== '' ? parseInt(serverId, 10) : undefined;
    return this.service.findAll({ projectId: pid, serverId: sid });
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(RoleCode.ADMIN, RoleCode.EDITOR)
  create(@Body() dto: CreateServerMaintenanceDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleCode.ADMIN, RoleCode.EDITOR)
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateServerMaintenanceDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleCode.ADMIN, RoleCode.EDITOR)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}

