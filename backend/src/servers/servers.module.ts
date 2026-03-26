import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Server } from '../entities/server.entity';
import { ServerDeployItem } from '../entities/server-deploy-item.entity';
import { OperationLogsModule } from '../operation-logs/operation-logs.module';
import { ServersService } from './servers.service';
import { ServersController } from './servers.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Server, ServerDeployItem]),
    OperationLogsModule,
  ],
  controllers: [ServersController],
  providers: [ServersService],
  exports: [ServersService],
})
export class ServersModule {}
