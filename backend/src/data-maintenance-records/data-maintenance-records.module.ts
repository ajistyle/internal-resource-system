import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataMaintenanceRecord } from '../entities/data-maintenance.entity';
import { DataMaintenanceRecordsController } from './data-maintenance-records.controller';
import { DataMaintenanceRecordsService } from './data-maintenance-records.service';

@Module({
  imports: [TypeOrmModule.forFeature([DataMaintenanceRecord])],
  controllers: [DataMaintenanceRecordsController],
  providers: [DataMaintenanceRecordsService],
})
export class DataMaintenanceRecordsModule {}

