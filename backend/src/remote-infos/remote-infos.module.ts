import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RemoteInfo } from '../entities/remote-info.entity';
import { OperationLogsModule } from '../operation-logs/operation-logs.module';
import { RemoteInfosService } from './remote-infos.service';
import { RemoteInfosController } from './remote-infos.controller';

@Module({
  imports: [TypeOrmModule.forFeature([RemoteInfo]), OperationLogsModule],
  controllers: [RemoteInfosController],
  providers: [RemoteInfosService],
  exports: [RemoteInfosService],
})
export class RemoteInfosModule {}
