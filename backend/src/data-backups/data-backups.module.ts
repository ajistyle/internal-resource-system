import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataBackup } from './entities/data-backup.entity';
import { DataBackupsController } from './data-backups.controller';
import { DataBackupsService } from './data-backups.service';
import { OperationLogsModule } from '../operation-logs/operation-logs.module';

@Module({
  imports: [TypeOrmModule.forFeature([DataBackup]), OperationLogsModule],
  controllers: [DataBackupsController],
  providers: [DataBackupsService],
})
export class DataBackupsModule {}

