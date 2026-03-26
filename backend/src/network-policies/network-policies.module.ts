import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NetworkPolicy } from '../entities/network-policy.entity';
import { OperationLogsModule } from '../operation-logs/operation-logs.module';
import { NetworkPoliciesController } from './network-policies.controller';
import { NetworkPoliciesService } from './network-policies.service';

@Module({
  imports: [TypeOrmModule.forFeature([NetworkPolicy]), OperationLogsModule],
  controllers: [NetworkPoliciesController],
  providers: [NetworkPoliciesService],
  exports: [NetworkPoliciesService],
})
export class NetworkPoliciesModule {}

