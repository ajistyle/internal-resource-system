import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OperationLogsService } from './operation-logs.service';

@Controller('operation-logs')
@UseGuards(JwtAuthGuard)
export class OperationLogsController {
  constructor(private service: OperationLogsService) {}

  @Get()
  findAll(
    @Query('startTime') startTime?: string,
    @Query('endTime') endTime?: string,
    @Query('type') type?: string,
    @Query('target') target?: string,
    @Query('message') message?: string,
  ) {
    return this.service.findAll({ startTime, endTime, type, target, message });
  }
}

