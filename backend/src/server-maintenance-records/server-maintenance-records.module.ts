import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServerMaintenanceRecord } from '../entities/server-maintenance.entity';
import { ServerMaintenanceRecordsController } from './server-maintenance-records.controller';
import { ServerMaintenanceRecordsService } from './server-maintenance-records.service';

@Module({
  imports: [TypeOrmModule.forFeature([ServerMaintenanceRecord])],
  controllers: [ServerMaintenanceRecordsController],
  providers: [ServerMaintenanceRecordsService],
})
export class ServerMaintenanceRecordsModule {}

