import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Server } from '../entities/server.entity';
import { NetworkPolicy } from '../entities/network-policy.entity';
import { ServerMaintenanceRecord } from '../entities/server-maintenance.entity';
import { OperationLog } from '../entities/operation-log.entity';
import { DataBackup } from '../data-backups/entities/data-backup.entity';

@Injectable()
export class AssetsService {
  constructor(
    @InjectRepository(Server) private serverRepo: Repository<Server>,
    @InjectRepository(NetworkPolicy) private policyRepo: Repository<NetworkPolicy>,
    @InjectRepository(ServerMaintenanceRecord) private serverOpsRepo: Repository<ServerMaintenanceRecord>,
    @InjectRepository(OperationLog) private opLogRepo: Repository<OperationLog>,
    @InjectRepository(DataBackup) private dataBackupRepo: Repository<DataBackup>,
  ) {}

  async overview(projectId?: number) {
    const serverWhere = projectId != null ? { projectId } : {};
    const policyWhere = projectId != null ? { projectId } : {};
    const dataBackupWhere = projectId != null ? { projectId } : {};
    const [servers, dataBackups, policies] = await Promise.all([
      this.serverRepo.find({
        where: serverWhere,
        relations: ['project', 'serverDeployItems', 'serverDeployItems.deployItem'],
        order: { id: 'DESC' },
      }),
      this.dataBackupRepo.find({ where: dataBackupWhere, relations: ['project', 'server'], order: { id: 'DESC' } }),
      this.policyRepo.find({ where: policyWhere, relations: ['project', 'server'], order: { id: 'DESC' } }),
    ]);
    return { servers, dataBackups, policies };
  }

  async detail(type: 'server' | 'data-backup', id: number) {
    if (type === 'server') {
      const server = await this.serverRepo.findOne({
        where: { id },
        relations: ['project', 'defaultRemoteInfo', 'serverDeployItems', 'serverDeployItems.deployItem'],
      });
      const [policies, recentServerOps] = await Promise.all([
        this.policyRepo.find({ where: { serverId: id }, order: { id: 'DESC' }, take: 20 }),
        this.serverOpsRepo.find({ where: { serverId: id }, relations: ['project', 'server'], order: { id: 'DESC' }, take: 20 }),
      ]);
      const recentLogs = await this.opLogRepo.find({ order: { id: 'DESC' }, take: 30 });
      return { type, asset: server, policies, recentServerOps, recentLogs };
    }

    const dataBackup = await this.dataBackupRepo.findOne({ where: { id }, relations: ['project', 'server'] });
    const recentLogs = await this.opLogRepo.find({ order: { id: 'DESC' }, take: 30 });
    return { type, asset: dataBackup, recentLogs };
  }
}

