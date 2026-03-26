import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Stakeholder } from '../entities/stakeholder.entity';
import { OperationLogsModule } from '../operation-logs/operation-logs.module';
import { StakeholdersService } from './stakeholders.service';
import { StakeholdersController } from './stakeholders.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Stakeholder]), OperationLogsModule],
  controllers: [StakeholdersController],
  providers: [StakeholdersService],
  exports: [StakeholdersService],
})
export class StakeholdersModule {}
