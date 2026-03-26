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
import { StakeholdersService } from './stakeholders.service';
import { CreateStakeholderDto } from './dto/create-stakeholder.dto';
import { UpdateStakeholderDto } from './dto/update-stakeholder.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleCode } from '../entities/role.entity';

@Controller('stakeholders')
@UseGuards(JwtAuthGuard)
export class StakeholdersController {
  constructor(private stakeholdersService: StakeholdersService) {}

  @Get()
  findAll(@Query('projectId') projectId?: string, @Query('name') name?: string) {
    const pid = projectId != null && projectId !== '' ? parseInt(projectId, 10) : undefined;
    return this.stakeholdersService.findAll({ projectId: pid, name });
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.stakeholdersService.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(RoleCode.ADMIN, RoleCode.EDITOR)
  create(@Body() dto: CreateStakeholderDto, @Req() req: Request) {
    return this.stakeholdersService.create(dto, req.user as any);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleCode.ADMIN, RoleCode.EDITOR)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStakeholderDto,
    @Req() req: Request,
  ) {
    return this.stakeholdersService.update(id, dto, req.user as any);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleCode.ADMIN, RoleCode.EDITOR)
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    return this.stakeholdersService.remove(id, req.user as any);
  }
}
