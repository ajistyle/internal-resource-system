import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Server } from '../entities/server.entity';
import { ServerDeployItem } from '../entities/server-deploy-item.entity';
import { CreateServerDto } from './dto/create-server.dto';
import { UpdateServerDto } from './dto/update-server.dto';
import { OperationLogsService } from '../operation-logs/operation-logs.service';
import { OperationLogTarget, OperationLogType } from '../entities/operation-log.entity';

type Operator = { username?: string; realName?: string };
const operatorNameOf = (u: Operator | undefined | null) => (u?.realName || u?.username || 'unknown');
const fmt = (v: unknown) => (v == null || v === '' ? '-' : String(v));

@Injectable()
export class ServersService {
  constructor(
    @InjectRepository(Server)
    private serverRepo: Repository<Server>,
    @InjectRepository(ServerDeployItem)
    private sdiRepo: Repository<ServerDeployItem>,
    private opLogs: OperationLogsService,
  ) {}

  async findAll(projectId?: number): Promise<Server[]> {
    const where = projectId != null ? { projectId } : {};
    return this.serverRepo.find({
      where,
      relations: ['project', 'defaultRemoteInfo', 'serverDeployItems', 'serverDeployItems.deployItem'],
      order: { id: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Server> {
    const server = await this.serverRepo.findOne({
      where: { id },
      relations: ['project', 'defaultRemoteInfo', 'serverDeployItems', 'serverDeployItems.deployItem'],
    });
    if (!server) throw new NotFoundException('服务器不存在');
    return server;
  }

  async create(dto: CreateServerDto, operator?: Operator): Promise<Server> {
    const { deployItems: di, ...rest } = dto;
    const payload = { ...rest } as Record<string, unknown>;
    if (rest.cpuCores !== undefined) payload.cpuCores = rest.cpuCores == null ? null : String(rest.cpuCores);
    if (rest.memory !== undefined) payload.memory = rest.memory == null ? null : String(rest.memory);
    if (rest.systemDisk !== undefined) payload.systemDisk = rest.systemDisk == null ? null : String(rest.systemDisk);
    if (rest.dataDisk !== undefined) payload.dataDisk = rest.dataDisk == null ? null : String(rest.dataDisk);
    if (rest.osType !== undefined) payload.osType = rest.osType ?? null;
    if (rest.eip !== undefined) payload.eip = rest.eip ?? null;
    if (rest.networkRegion !== undefined) payload.networkRegion = rest.networkRegion ?? null;
    if (rest.defaultRemoteInfoId !== undefined) payload.defaultRemoteInfoId = rest.defaultRemoteInfoId ?? null;
    if (rest.sshPort !== undefined) payload.sshPort = rest.sshPort ?? null;
    if (rest.sshUser !== undefined) {
      payload.sshUser =
        rest.sshUser != null && String(rest.sshUser).trim() !== '' ? String(rest.sshUser).trim() : null;
    }
    if (rest.sshPassword !== undefined) {
      payload.sshPassword =
        rest.sshPassword != null && String(rest.sshPassword).trim() !== ''
          ? String(rest.sshPassword).trim()
          : null;
    }
    for (const k of ['sshPort', 'sshUser', 'sshPassword'] as const) {
      if (payload[k] === undefined) delete payload[k];
    }
    const server = this.serverRepo.create(payload);
    const saved = await this.serverRepo.save(server);
    if (di?.length) {
      for (const item of di) {
        await this.sdiRepo.save(
          this.sdiRepo.create({
            serverId: saved.id,
            deployItemId: item.deployItemId,
            config: item.config ?? null,
            remark: item.remark ?? null,
          }),
        );
      }
    }
    const result = await this.findOne(saved.id);
    await this.opLogs.createLog({
      type: OperationLogType.CREATE,
      target: OperationLogTarget.SERVER,
      operatorName: operatorNameOf(operator),
      message: `新增 服务器：${fmt(result.name)}`,
    });
    return result;
  }

  async update(id: number, dto: UpdateServerDto, operator?: Operator): Promise<Server> {
    const before = await this.findOne(id);
    const { deployItems: di, ...rest } = dto;
    const updateData: Record<string, unknown> = {};
    if (rest.name !== undefined) updateData.name = rest.name;
    if (rest.ip !== undefined) updateData.ip = rest.ip;
    if (rest.eip !== undefined) updateData.eip = rest.eip ?? null;
    if (rest.hostname !== undefined) updateData.hostname = rest.hostname;
    if (rest.os !== undefined) updateData.os = rest.os;
    if (rest.osType !== undefined) updateData.osType = rest.osType ?? null;
    if (rest.cpuArch !== undefined) updateData.cpuArch = rest.cpuArch;
    if (rest.cpuModel !== undefined) updateData.cpuModel = rest.cpuModel;
    if (rest.cpuCores !== undefined) updateData.cpuCores = rest.cpuCores == null ? null : String(rest.cpuCores);
    if (rest.memory !== undefined) updateData.memory = rest.memory == null ? null : String(rest.memory);
    if (rest.systemDisk !== undefined) updateData.systemDisk = rest.systemDisk == null ? null : String(rest.systemDisk);
    if (rest.dataDisk !== undefined) updateData.dataDisk = rest.dataDisk == null ? null : String(rest.dataDisk);
    if (rest.networkRegion !== undefined) updateData.networkRegion = rest.networkRegion ?? null;
    if (rest.sshPort !== undefined) updateData.sshPort = rest.sshPort ?? null;
    if (rest.sshUser !== undefined) {
      updateData.sshUser =
        rest.sshUser != null && String(rest.sshUser).trim() !== '' ? String(rest.sshUser).trim() : null;
    }
    if (rest.sshPassword !== undefined) {
      updateData.sshPassword =
        rest.sshPassword != null && String(rest.sshPassword).trim() !== ''
          ? String(rest.sshPassword).trim()
          : null;
    }
    if (rest.remark !== undefined) updateData.remark = rest.remark;
    if (rest.defaultRemoteInfoId !== undefined) updateData.defaultRemoteInfoId = rest.defaultRemoteInfoId ?? null;
    if (Object.keys(updateData).length) {
      await this.serverRepo.update(id, updateData);
    }
    if (di !== undefined) {
      await this.sdiRepo.delete({ serverId: id });
      for (const item of di) {
        await this.sdiRepo.save(
          this.sdiRepo.create({
            serverId: id,
            deployItemId: item.deployItemId,
            config: item.config ?? null,
            remark: item.remark ?? null,
          }),
        );
      }
    }
    const after = await this.findOne(id);

    const changes: string[] = [];
    (Object.keys(updateData) as string[]).forEach((k) => {
      const b = (before as unknown as Record<string, unknown>)[k];
      const a = (after as unknown as Record<string, unknown>)[k];
      if (fmt(b) !== fmt(a)) {
        if (k === 'sshPassword') changes.push('sshPassword：已变更');
        else changes.push(`${k}：${fmt(b)} -> ${fmt(a)}`);
      }
    });
    if (di !== undefined) changes.push('deployItems：已更新');
    if (changes.length) {
      await this.opLogs.createLog({
        type: OperationLogType.UPDATE,
        target: OperationLogTarget.SERVER,
        operatorName: operatorNameOf(operator),
        message: `变更 服务器：${fmt(after.name)}；${changes.join('；')}`,
      });
    }
    return after;
  }

  async remove(id: number, operator?: Operator): Promise<void> {
    const server = await this.findOne(id);
    await this.serverRepo.remove(server);
    await this.opLogs.createLog({
      type: OperationLogType.DELETE,
      target: OperationLogTarget.SERVER,
      operatorName: operatorNameOf(operator),
      message: `删除 服务器：${fmt(server.name)}`,
    });
  }
}
