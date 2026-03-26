import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { IngestReleaseRecordDto } from './dto/ingest-release-record.dto';
import { ListReleaseRecordsQueryDto } from './dto/list-release-records-query.dto';
import { ReleaseRecordsService } from './release-records.service';

@Controller('release-records')
export class ReleaseRecordsController {
  constructor(private readonly service: ReleaseRecordsService) {}

  // Jenkins 发布成功后调用
  @Post('ingest')
  async ingest(@Body() dto: IngestReleaseRecordDto) {
    return this.service.ingest(dto);
  }

  @Get()
  async list(@Query() query: ListReleaseRecordsQueryDto) {
    return this.service.list(query);
  }
}

