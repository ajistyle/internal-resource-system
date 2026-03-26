import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { K8sDeployment } from './entities/k8s-deployment.entity';
import { K8sDeploymentDeployItem } from './entities/k8s-deployment-deploy-item.entity';
import { K8sDeploymentNode } from './entities/k8s-deployment-node.entity';
import { K8sDeploymentsController } from './k8s-deployments.controller';
import { K8sDeploymentsService } from './k8s-deployments.service';
import { OperationLogsModule } from '../operation-logs/operation-logs.module';

@Module({
  imports: [TypeOrmModule.forFeature([K8sDeployment, K8sDeploymentDeployItem, K8sDeploymentNode]), OperationLogsModule],
  controllers: [K8sDeploymentsController],
  providers: [K8sDeploymentsService],
})
export class K8sDeploymentsModule {}

