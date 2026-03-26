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
import { DictionariesService } from './dictionaries.service';
import { CreateDictionaryDto } from './dto/create-dictionary.dto';
import { UpdateDictionaryDto } from './dto/update-dictionary.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleCode } from '../entities/role.entity';

@Controller('dictionaries')
@UseGuards(JwtAuthGuard)
export class DictionariesController {
  constructor(private dictionariesService: DictionariesService) {}

  @Get()
  findAll(
    @Query('code') code?: string,
    @Query('name') name?: string,
    @Query('parentCode') parentCode?: string,
    @Query('status') status?: string,
  ) {
    const s = status != null && status !== '' ? parseInt(status, 10) : undefined;
    return this.dictionariesService.findAll({ code, name, parentCode, status: s });
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.dictionariesService.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(RoleCode.ADMIN, RoleCode.EDITOR)
  create(@Body() dto: CreateDictionaryDto, @Req() req: Request) {
    return this.dictionariesService.create(dto, req.user as any);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleCode.ADMIN, RoleCode.EDITOR)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDictionaryDto,
    @Req() req: Request,
  ) {
    return this.dictionariesService.update(id, dto, req.user as any);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleCode.ADMIN, RoleCode.EDITOR)
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    return this.dictionariesService.remove(id, req.user as any);
  }
}
