import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectAttachment } from '../entities/project-attachment.entity';
import { Project } from '../entities/project.entity';
import { OperationLog } from '../entities/operation-log.entity';
import { ProjectAttachmentsService } from './project-attachments.service';
import { ProjectAttachmentsController } from './project-attachments.controller';
import { OperationLogsModule } from '../operation-logs/operation-logs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProjectAttachment, Project]),
    OperationLogsModule,
  ],
  controllers: [ProjectAttachmentsController],
  providers: [ProjectAttachmentsService],
  exports: [ProjectAttachmentsService],
})
export class ProjectAttachmentsModule {}
