import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AssetsService } from './assets.service';

@Controller('assets')
@UseGuards(JwtAuthGuard)
export class AssetsController {
  constructor(private service: AssetsService) {}

  @Get('overview')
  overview(@Query('projectId') projectId?: string) {
    const pid = projectId != null && projectId !== '' ? parseInt(projectId, 10) : undefined;
    return this.service.overview(pid);
  }

  @Get(':type/:id/detail')
  detail(
    @Param('type') type: 'server' | 'data-backup',
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.detail(type, id);
  }
}

