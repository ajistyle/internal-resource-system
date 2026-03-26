import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import {
  Role,
  User,
  Project,
  Stakeholder,
  RemoteInfo,
  DeployItem,
  Server,
  ServerDeployItem,
  Dictionary,
  OperationLog,
  Database,
  ServerMaintenanceRecord,
  DataMaintenanceRecord,
  ReleaseRecord,
  ProjectModule,
  NetworkPolicy,
  ProjectAttachment,
  K8sDeployment,
  DataBackup,
} from './entities';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { ProjectsModule } from './projects/projects.module';
import { StakeholdersModule } from './stakeholders/stakeholders.module';
import { RemoteInfosModule } from './remote-infos/remote-infos.module';
import { DeployItemsModule } from './deploy-items/deploy-items.module';
import { ServersModule } from './servers/servers.module';
import { DictionariesModule } from './dictionaries/dictionaries.module';
import { OperationLogsModule } from './operation-logs/operation-logs.module';
import { StatsModule } from './stats/stats.module';
import { DatabasesModule } from './databases/databases.module';
import { ServerMaintenanceRecordsModule } from './server-maintenance-records/server-maintenance-records.module';
import { DataMaintenanceRecordsModule } from './data-maintenance-records/data-maintenance-records.module';
import { ReleaseRecordsModule } from './release-records/release-records.module';
import { ProjectModulesModule } from './project-modules/project-modules.module';
import { NetworkPoliciesModule } from './network-policies/network-policies.module';
import { AssetsModule } from './assets/assets.module';
import { StorageModule } from './storage/storage.module';
import { ProjectAttachmentsModule } from './project-attachments/project-attachments.module';
import { K8sDeploymentsModule } from './k8s-deployments/k8s-deployments.module';
import { K8sDeploymentDeployItem } from './k8s-deployments/entities/k8s-deployment-deploy-item.entity';
import { K8sDeploymentNode } from './k8s-deployments/entities/k8s-deployment-node.entity';
import { DataBackupsModule } from './data-backups/data-backups.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST ?? 'localhost',
      port: parseInt(process.env.DB_PORT ?? '3307', 10),
      username: process.env.DB_USERNAME ?? 'root',
      password: process.env.DB_PASSWORD ?? '123456',
      database: process.env.DB_DATABASE ?? 'internal_resource_db',
      entities: [
        Role,
        User,
        Project,
        Stakeholder,
        RemoteInfo,
        DeployItem,
        Server,
        ServerDeployItem,
        Dictionary,
        OperationLog,
        Database,
        ServerMaintenanceRecord,
        DataMaintenanceRecord,
        ReleaseRecord,
        ProjectModule,
        NetworkPolicy,
        ProjectAttachment,
        K8sDeployment,
        K8sDeploymentDeployItem,
        K8sDeploymentNode,
        DataBackup,
      ],
      synchronize: true,
    }),
    AuthModule,
    UsersModule,
    RolesModule,
    ProjectsModule,
    StakeholdersModule,
    RemoteInfosModule,
    DeployItemsModule,
    ServersModule,
    DictionariesModule,
    OperationLogsModule,
    StatsModule,
    DatabasesModule,
    ServerMaintenanceRecordsModule,
    DataMaintenanceRecordsModule,
    ReleaseRecordsModule,
    ProjectModulesModule,
    NetworkPoliciesModule,
    AssetsModule,
    StorageModule,
    ProjectAttachmentsModule,
    K8sDeploymentsModule,
    DataBackupsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
