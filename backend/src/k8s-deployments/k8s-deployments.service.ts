import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { K8sDeployment } from './entities/k8s-deployment.entity';
import { K8sDeploymentDeployItem } from './entities/k8s-deployment-deploy-item.entity';
import { K8sDeploymentNode } from './entities/k8s-deployment-node.entity';
import { CreateK8sDeploymentDto } from './dto/create-k8s-deployment.dto';
import { UpdateK8sDeploymentDto } from './dto/update-k8s-deployment.dto';
import { OperationLogsService } from '../operation-logs/operation-logs.service';
import { OperationLogTarget, OperationLogType } from '../entities/operation-log.entity';

@Injectable()
export class K8sDeploymentsService {
  constructor(
    @InjectRepository(K8sDeployment)
    private readonly repo: Repository<K8sDeployment>,
    @InjectRepository(K8sDeploymentDeployItem)
    private readonly ddiRepo: Repository<K8sDeploymentDeployItem>,
    @InjectRepository(K8sDeploymentNode)
    private readonly nodeRepo: Repository<K8sDeploymentNode>,
    private readonly opLogs: OperationLogsService,
  ) {}

  async findAll(query: {
    projectId?: number;
    clusterEnv?: string;
    status?: string;
    keyword?: string;
  }): Promise<K8sDeployment[]> {
    const qb = this.repo
      .createQueryBuilder('d')
      .leftJoinAndSelect('d.project', 'p')
      .leftJoinAndSelect('d.deployItems', 'ddi')
      .leftJoinAndSelect('ddi.deployItem', 'di');

    if (query.projectId != null) qb.andWhere('d.projectId = :projectId', { projectId: query.projectId });
    if (query.clusterEnv) qb.andWhere('d.clusterEnv = :clusterEnv', { clusterEnv: query.clusterEnv });
    if (query.status) qb.andWhere('d.status = :status', { status: query.status });
    if (query.keyword) {
      const kw = `%${query.keyword}%`;
      qb.andWhere(
        '(d.clusterName LIKE :kw OR d.visualManage LIKE :kw OR d.image LIKE :kw OR di.name LIKE :kw)',
        { kw },
      );
    }

    qb.orderBy('d.id', 'DESC');
    return qb.getMany();
  }

  async findOne(id: number): Promise<K8sDeployment> {
    const row = await this.repo.findOne({
      where: { id },
      relations: ['project', 'deployItems', 'deployItems.deployItem', 'nodes', 'nodes.server'],
    });
    if (!row) throw new NotFoundException('应用集群不存在');
    return row;
  }

  async create(dto: CreateK8sDeploymentDto, operator?: { username?: string; realName?: string }) {
    const saved = await this.repo.manager.transaction(async (em) => {
      const mainRepo = em.getRepository(K8sDeployment);
      const ddiRepo = em.getRepository(K8sDeploymentDeployItem);
      const nodeRepo = em.getRepository(K8sDeploymentNode);

      const entity = mainRepo.create({
        projectId: dto.projectId,
        clusterName: dto.clusterName,
        clusterEnv: dto.clusterEnv,
        image: dto.image ?? null,
        visualManage: dto.visualManage ?? null,
        // 兼容旧字段：当前前端由 deployItems 维护
        deployService: (dto as any).deployService ?? null,
        remark: dto.remark ?? null,
        status: dto.status,
      });

      const mainSaved = await mainRepo.save(entity);

      if (dto.deployItems?.length) {
        for (const item of dto.deployItems) {
          await ddiRepo.save(
            ddiRepo.create({
              k8sDeploymentId: mainSaved.id,
              deployItemId: item.deployItemId,
              remark: item.remark ?? null,
            }),
          );
        }
      }

      if (dto.nodes?.length) {
        for (const node of dto.nodes) {
          await nodeRepo.save(
            nodeRepo.create({
              k8sDeploymentId: mainSaved.id,
              serverId: node.serverId,
              roles: node.roles as any,
              status: node.status,
            }),
          );
        }
      }

      return mainSaved;
    });

    const after = await this.findOne(saved.id);
    await this.opLogs.createLog({
      type: OperationLogType.CREATE,
      target: OperationLogTarget.K8S_DEPLOYMENT,
      operatorName: operator?.realName || operator?.username || 'unknown',
      message: `新增 应用集群：${after.clusterName}（${after.clusterEnv}）`,
    });
    return after;
  }

  async update(id: number, dto: UpdateK8sDeploymentDto, operator?: { username?: string; realName?: string }) {
    const before = await this.findOne(id);

    const savedAfter = await this.repo.manager.transaction(async (em) => {
      const mainRepo = em.getRepository(K8sDeployment);
      const ddiRepo = em.getRepository(K8sDeploymentDeployItem);
      const nodeRepo = em.getRepository(K8sDeploymentNode);

      const updateData: Record<string, unknown> = {};
      if (dto.projectId !== undefined) updateData.projectId = dto.projectId as any;
      if (dto.clusterName !== undefined) updateData.clusterName = dto.clusterName;
      if (dto.clusterEnv !== undefined) updateData.clusterEnv = dto.clusterEnv;
      if (dto.image !== undefined) updateData.image = dto.image ?? null;
      if (dto.visualManage !== undefined) updateData.visualManage = dto.visualManage ?? null;
      // 兼容旧字段
      if (dto.deployService !== undefined) updateData.deployService = dto.deployService ?? null;
      if (dto.remark !== undefined) updateData.remark = dto.remark ?? null;
      if (dto.status !== undefined) updateData.status = dto.status;

      if (Object.keys(updateData).length) await mainRepo.update(id, updateData);

      if (dto.deployItems !== undefined) {
        await ddiRepo.delete({ k8sDeploymentId: id });
        if (dto.deployItems?.length) {
          for (const item of dto.deployItems) {
            await ddiRepo.save(
              ddiRepo.create({
                k8sDeploymentId: id,
                deployItemId: item.deployItemId,
                remark: item.remark ?? null,
              }),
            );
          }
        }
      }

      if (dto.nodes !== undefined) {
        await nodeRepo.delete({ k8sDeploymentId: id });
        if (dto.nodes?.length) {
          for (const node of dto.nodes) {
            await nodeRepo.save(
              nodeRepo.create({
                k8sDeploymentId: id,
                serverId: node.serverId,
                roles: node.roles as any,
                status: node.status,
              }),
            );
          }
        }
      }

      return mainRepo.findOneOrFail({
        where: { id },
        relations: ['project', 'deployItems', 'deployItems.deployItem', 'nodes', 'nodes.server'],
      });
    });

    const after = savedAfter;
    const changes: string[] = [];

    const pushChange = (k: keyof K8sDeployment) => {
      const b = (before as any)[k];
      const a = (after as any)[k];
      if (b !== a) changes.push(`${String(k)}：${b ?? '-'} -> ${a ?? '-'}`);
    };

    if (dto.projectId !== undefined) pushChange('projectId');
    if (dto.clusterName !== undefined) pushChange('clusterName');
    if (dto.clusterEnv !== undefined) pushChange('clusterEnv');
    if (dto.image !== undefined) pushChange('image');
    if (dto.visualManage !== undefined) pushChange('visualManage');
    if (dto.remark !== undefined) pushChange('remark');
    if (dto.status !== undefined) pushChange('status');
    if (dto.deployItems !== undefined) changes.push('deployItems：已更新');
    if (dto.nodes !== undefined) changes.push('nodes：已更新');

    if (changes.length) {
      await this.opLogs.createLog({
        type: OperationLogType.UPDATE,
        target: OperationLogTarget.K8S_DEPLOYMENT,
        operatorName: operator?.realName || operator?.username || 'unknown',
        message: `变更 应用集群：${after.clusterName}；${changes.join('；')}`,
      });
    }

    return after;
  }

  async remove(id: number, operator?: { username?: string; realName?: string }) {
    const row = await this.findOne(id);
    await this.repo.manager.transaction(async (em) => {
      const mainRepo = em.getRepository(K8sDeployment);
      const ddiRepo = em.getRepository(K8sDeploymentDeployItem);
      const nodeRepo = em.getRepository(K8sDeploymentNode);
      await ddiRepo.delete({ k8sDeploymentId: id });
      await nodeRepo.delete({ k8sDeploymentId: id });
      await mainRepo.remove(row);
    });

    await this.opLogs.createLog({
      type: OperationLogType.DELETE,
      target: OperationLogTarget.K8S_DEPLOYMENT,
      operatorName: operator?.realName || operator?.username || 'unknown',
      message: `删除 应用集群：${row.clusterName}（${row.clusterEnv}）`,
    });
  }
}

