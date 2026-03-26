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
import { DataMaintenanceRecordsService } from './data-maintenance-records.service';
import { CreateDataMaintenanceDto } from './dto/create-data-maintenance.dto';
import { UpdateDataMaintenanceDto } from './dto/update-data-maintenance.dto';

@Controller('data-maintenance-records')
@UseGuards(JwtAuthGuard)
export class DataMaintenanceRecordsController {
  constructor(private service: DataMaintenanceRecordsService) {}

  @Get()
  findAll(@Query('projectId') projectId?: string, @Query('databaseId') databaseId?: string) {
    const pid = projectId != null && projectId !== '' ? parseInt(projectId, 10) : undefined;
    const did = databaseId != null && databaseId !== '' ? parseInt(databaseId, 10) : undefined;
    return this.service.findAll({ projectId: pid, databaseId: did });
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(RoleCode.ADMIN, RoleCode.EDITOR)
  create(@Body() dto: CreateDataMaintenanceDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleCode.ADMIN, RoleCode.EDITOR)
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateDataMaintenanceDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleCode.ADMIN, RoleCode.EDITOR)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}

