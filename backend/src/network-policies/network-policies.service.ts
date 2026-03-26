import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NetworkPolicy } from '../entities/network-policy.entity';
import { CreateNetworkPolicyDto } from './dto/create-network-policy.dto';
import { UpdateNetworkPolicyDto } from './dto/update-network-policy.dto';
import { OperationLogsService } from '../operation-logs/operation-logs.service';
import { OperationLogTarget, OperationLogType } from '../entities/operation-log.entity';

type Operator = { username?: string; realName?: string };
const operatorNameOf = (u: Operator | undefined | null) => (u?.realName || u?.username || 'unknown');
const fmt = (v: unknown) => (v == null || v === '' ? '-' : String(v));
const normalizeProtocol = (v: unknown): 'TCP' | 'UDP' => (String(v || 'TCP').toUpperCase() === 'UDP' ? 'UDP' : 'TCP');

@Injectable()
export class NetworkPoliciesService {
  constructor(
    @InjectRepository(NetworkPolicy)
    private repo: Repository<NetworkPolicy>,
    private opLogs: OperationLogsService,
  ) {}

  async findAll(query: {
    projectId?: number;
    serverId?: number;
    policyType?: string;
    status?: string;
    protocol?: string;
    keyword?: string;
    /** 本端：关联服务器的 IP，模糊匹配 */
    localIp?: string;
    /** 对端：peerIp 或旧版区域字段，模糊匹配 */
    peerIp?: string;
  }): Promise<NetworkPolicy[]> {
    const qb = this.repo
      .createQueryBuilder('np')
      .leftJoinAndSelect('np.project', 'project')
      .leftJoinAndSelect('np.server', 'server')
      .orderBy('np.id', 'DESC');

    if (query.projectId != null) qb.andWhere('np.projectId = :projectId', { projectId: query.projectId });
    if (query.serverId != null) qb.andWhere('np.serverId = :serverId', { serverId: query.serverId });
    if (query.policyType) qb.andWhere('np.policyType = :policyType', { policyType: query.policyType });
    if (query.status) qb.andWhere('np.status = :status', { status: query.status });

    const proto = query.protocol?.trim().toUpperCase();
    if (proto === 'TCP') {
      qb.andWhere('(np.protocol = :tcp OR np.protocol IS NULL OR np.protocol = :empty)', {
        tcp: 'TCP',
        empty: '',
      });
    } else if (proto === 'UDP') {
      qb.andWhere('np.protocol = :udp', { udp: 'UDP' });
    }

    const kw = query.keyword?.trim();
    if (kw) {
      const like = `%${kw}%`;
      qb.andWhere(
        '(np.peerIp LIKE :like OR np.purpose LIKE :like OR np.mappingIp LIKE :like OR np.remark LIKE :like OR np.sourceZone LIKE :like OR np.targetZone LIKE :like)',
        { like },
      );
    }

    const localIp = query.localIp?.trim();
    if (localIp) {
      qb.andWhere('server.ip LIKE :localIpLike', { localIpLike: `%${localIp}%` });
    }

    const peerIpQ = query.peerIp?.trim();
    if (peerIpQ) {
      const pl = `%${peerIpQ}%`;
      qb.andWhere('(np.peerIp LIKE :peerIpLike OR np.sourceZone LIKE :peerIpLike OR np.targetZone LIKE :peerIpLike)', {
        peerIpLike: pl,
      });
    }

    const items = await qb.getMany();
    // 兼容历史数据：协议为空时按 TCP 处理并回填
    const missingProtocolIds = items.filter((x) => !x.protocol).map((x) => x.id);
    if (missingProtocolIds.length) {
      await this.repo
        .createQueryBuilder()
        .update(NetworkPolicy)
        .set({ protocol: 'TCP' })
        .where('id IN (:...ids)', { ids: missingProtocolIds })
        .execute();
      items.forEach((x) => {
        if (!x.protocol) x.protocol = 'TCP';
      });
    }
    return items;
  }

  async findOne(id: number): Promise<NetworkPolicy> {
    const one = await this.repo.findOne({ where: { id }, relations: ['project', 'server'] });
    if (!one) throw new NotFoundException('网络策略不存在');
    if (!one.protocol) {
      one.protocol = 'TCP';
      await this.repo.update(one.id, { protocol: 'TCP' });
    }
    return one;
  }

  async create(dto: CreateNetworkPolicyDto, operator?: Operator): Promise<NetworkPolicy> {
    if (dto.policyType === 'egress' && (dto.targetPort == null || Number.isNaN(dto.targetPort))) {
      throw new NotFoundException('出访策略必须填写目标端口');
    }
    if (dto.policyType === 'ingress' && (dto.targetPort == null || Number.isNaN(dto.targetPort))) {
      throw new NotFoundException('入访策略必须填写目标端口');
    }
    if (dto.policyType === 'ingress' && !dto.mappingIp?.trim()) {
      throw new NotFoundException('入访策略必须填写映射IP');
    }
    if (dto.policyType === 'ingress' && (dto.mappingPort == null || Number.isNaN(dto.mappingPort))) {
      throw new NotFoundException('入访策略必须填写映射端口');
    }
    const entity = this.repo.create({
      projectId: dto.projectId,
      policyType: dto.policyType,
      serverId: dto.serverId,
      peerIp: dto.peerIp.trim(),
      purpose: dto.purpose.trim(),
      sourceZone: null,
      targetZone: null,
      protocol: normalizeProtocol(dto.protocol),
      targetPort: dto.targetPort ?? null,
      sourcePort: dto.policyType === 'egress' ? dto.sourcePort ?? null : null,
      mappingIp: dto.policyType === 'ingress' ? (dto.mappingIp?.trim() || null) : null,
      mappingPort: dto.policyType === 'ingress' ? dto.mappingPort ?? null : null,
      portStart: null,
      portEnd: null,
      action: dto.action ?? 'allow',
      status: dto.status ?? 'enabled',
      remark:
        dto.remark != null && String(dto.remark).trim() !== '' ? String(dto.remark).trim() : null,
    });
    const saved = await this.repo.save(entity);
    await this.opLogs.createLog({
      type: OperationLogType.CREATE,
      target: OperationLogTarget.NETWORK_POLICY,
      operatorName: operatorNameOf(operator),
      message: `新增 网络策略：${fmt(saved.policyType)} ${fmt(saved.protocol)} 对端 ${fmt(saved.peerIp)} 源端口 ${fmt(saved.sourcePort)} 目标端口 ${fmt(saved.targetPort)} 映射 ${fmt(saved.mappingIp)}:${fmt(saved.mappingPort)} 作用 ${fmt(saved.purpose)}`,
    });
    return this.findOne(saved.id);
  }

  async update(id: number, dto: UpdateNetworkPolicyDto, operator?: Operator): Promise<NetworkPolicy> {
    const before = await this.findOne(id);
    const updateData: Record<string, unknown> = {};
    if (dto.projectId !== undefined) updateData.projectId = dto.projectId;
    if (dto.serverId !== undefined) updateData.serverId = dto.serverId ?? null;
    if (dto.policyType !== undefined) updateData.policyType = dto.policyType;
    if (dto.peerIp !== undefined) updateData.peerIp = dto.peerIp.trim();
    if (dto.purpose !== undefined) updateData.purpose = dto.purpose.trim();
    if (dto.sourceZone !== undefined) updateData.sourceZone = dto.sourceZone;
    if (dto.targetZone !== undefined) updateData.targetZone = dto.targetZone;
    if (dto.protocol !== undefined) updateData.protocol = normalizeProtocol(dto.protocol);
    if (dto.targetPort !== undefined) updateData.targetPort = dto.targetPort;
    if (dto.sourcePort !== undefined) updateData.sourcePort = dto.sourcePort;
    if (dto.mappingIp !== undefined) updateData.mappingIp = dto.mappingIp.trim();
    if (dto.mappingPort !== undefined) updateData.mappingPort = dto.mappingPort;
    if (dto.portStart !== undefined) updateData.portStart = dto.portStart;
    if (dto.portEnd !== undefined) updateData.portEnd = dto.portEnd;
    if (dto.action !== undefined) updateData.action = dto.action;
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.remark !== undefined) {
      updateData.remark =
        dto.remark != null && String(dto.remark).trim() !== '' ? String(dto.remark).trim() : null;
    }
    const nextType = (updateData.policyType as string | undefined) ?? before.policyType;
    const nextTargetPort = (updateData.targetPort as number | undefined) ?? before.targetPort;
    const nextSourcePort = (updateData.sourcePort as number | undefined) ?? before.sourcePort;
    if (nextType === 'egress' && (nextTargetPort == null || Number.isNaN(nextTargetPort))) {
      throw new NotFoundException('出访策略必须填写目标端口');
    }
    if (nextType === 'ingress' && (nextTargetPort == null || Number.isNaN(nextTargetPort))) {
      throw new NotFoundException('入访策略必须填写目标端口');
    }
    const nextMappingIp = (updateData.mappingIp as string | undefined) ?? before.mappingIp;
    const nextMappingPort = (updateData.mappingPort as number | undefined) ?? before.mappingPort;
    if (nextType === 'ingress' && (nextMappingIp == null || String(nextMappingIp).trim() === '')) {
      throw new NotFoundException('入访策略必须填写映射IP');
    }
    if (nextType === 'ingress' && (nextMappingPort == null || Number.isNaN(nextMappingPort))) {
      throw new NotFoundException('入访策略必须填写映射端口');
    }
    if (nextType !== 'ingress') {
      updateData.mappingIp = null;
      updateData.mappingPort = null;
    }
    if (nextType !== 'egress') {
      updateData.sourcePort = null;
    }
    const nextStart = (updateData.portStart as number | null | undefined) ?? before.portStart;
    const nextEnd = (updateData.portEnd as number | null | undefined) ?? before.portEnd;
    if (nextStart != null && nextEnd != null && nextEnd < nextStart) throw new NotFoundException('端口范围不合法');
    if (Object.keys(updateData).length) await this.repo.update(id, updateData);
    const after = await this.findOne(id);
    const changes: string[] = [];
    Object.keys(updateData).forEach((k) => {
      const b = (before as unknown as Record<string, unknown>)[k];
      const a = (after as unknown as Record<string, unknown>)[k];
      if (fmt(b) !== fmt(a)) changes.push(`${k}：${fmt(b)} -> ${fmt(a)}`);
    });
    if (changes.length) {
      await this.opLogs.createLog({
        type: OperationLogType.UPDATE,
        target: OperationLogTarget.NETWORK_POLICY,
        operatorName: operatorNameOf(operator),
        message: `变更 网络策略 #${after.id}；${changes.join('；')}`,
      });
    }
    return after;
  }

  async remove(id: number, operator?: Operator): Promise<void> {
    const entity = await this.findOne(id);
    await this.repo.remove(entity);
    await this.opLogs.createLog({
      type: OperationLogType.DELETE,
      target: OperationLogTarget.NETWORK_POLICY,
      operatorName: operatorNameOf(operator),
      message: `删除 网络策略 #${entity.id}`,
    });
  }
}

