import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DatabasesService } from './databases.service';

@Controller('databases')
@UseGuards(JwtAuthGuard)
export class DatabasesController {
  constructor(private service: DatabasesService) {}

  @Get()
  findAll(@Query('projectId') projectId?: string) {
    const pid = projectId != null && projectId !== '' ? parseInt(projectId, 10) : undefined;
    return this.service.findAll(pid);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }
}

