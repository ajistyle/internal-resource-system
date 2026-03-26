import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetsController } from './assets.controller';
import { AssetsService } from './assets.service';
import { Server } from '../entities/server.entity';
import { NetworkPolicy } from '../entities/network-policy.entity';
import { ServerMaintenanceRecord } from '../entities/server-maintenance.entity';
import { OperationLog } from '../entities/operation-log.entity';
import { DataBackup } from '../data-backups/entities/data-backup.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Server,
      NetworkPolicy,
      ServerMaintenanceRecord,
      OperationLog,
      DataBackup,
    ]),
  ],
  controllers: [AssetsController],
  providers: [AssetsService],
})
export class AssetsModule {}

