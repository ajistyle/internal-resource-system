import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeployItem } from '../entities/deploy-item.entity';
import { OperationLogsModule } from '../operation-logs/operation-logs.module';
import { DeployItemsService } from './deploy-items.service';
import { DeployItemsController } from './deploy-items.controller';

@Module({
  imports: [TypeOrmModule.forFeature([DeployItem]), OperationLogsModule],
  controllers: [DeployItemsController],
  providers: [DeployItemsService],
  exports: [DeployItemsService],
})
export class DeployItemsModule {}
