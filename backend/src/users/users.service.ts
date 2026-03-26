import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../entities/user.entity';
import { Role, RoleCode } from '../entities/role.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { OperationLogsService } from '../operation-logs/operation-logs.service';
import { OperationLogTarget, OperationLogType } from '../entities/operation-log.entity';

type Operator = { username?: string; realName?: string };
const operatorNameOf = (u: Operator | undefined | null) => (u?.realName || u?.username || 'unknown');
const fmt = (v: unknown) => (v == null || v === '' ? '-' : String(v));

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Role)
    private roleRepo: Repository<Role>,
    private opLogs: OperationLogsService,
  ) {}

  async findAll(): Promise<Partial<User>[]> {
    const users = await this.userRepo.find({
      relations: ['roles'],
      order: { id: 'ASC' },
    });
    return users.map((u) => this.omitPassword(u));
  }

  async findOne(id: number): Promise<User> {
    const user = await this.userRepo.findOne({
      where: { id },
      relations: ['roles'],
    });
    if (!user) throw new NotFoundException('用户不存在');
    return user;
  }

  private omitPassword(user: User): Partial<User> {
    const { passwordHash: _, ...rest } = user;
    return rest;
  }

  async create(dto: CreateUserDto, operator?: Operator): Promise<Partial<User>> {
    const exists = await this.userRepo.findOne({ where: { username: dto.username } });
    if (exists) throw new ConflictException('用户名已存在');
    const roles = await this.roleRepo.findBy({ id: In(dto.roleIds ?? []) });
    const hash = await bcrypt.hash(dto.password, 10);
    const user = this.userRepo.create({
      username: dto.username,
      passwordHash: hash,
      realName: dto.realName ?? null,
      email: dto.email ?? null,
      mobile: dto.mobile ?? null,
      enabled: dto.enabled ?? 1,
      roles,
    });
    const saved = await this.userRepo.save(user);
    await this.opLogs.createLog({
      type: OperationLogType.CREATE,
      target: OperationLogTarget.USER,
      operatorName: operatorNameOf(operator),
      message: `新增 用户：${fmt(saved.realName || saved.username)}`,
    });
    return this.omitPassword(saved);
  }

  async update(id: number, dto: UpdateUserDto, operator?: Operator): Promise<Partial<User>> {
    const user = await this.findOne(id);
    const before = { ...user, roles: (user.roles ?? []).map((r) => r.id).sort((a, b) => a - b).join(',') };
    if (dto.username !== undefined && dto.username !== user.username) {
      const exists = await this.userRepo.findOne({ where: { username: dto.username } });
      if (exists) throw new ConflictException('用户名已存在');
      user.username = dto.username;
    }
    if (dto.password != null && dto.password !== '') {
      user.passwordHash = await bcrypt.hash(dto.password, 10);
    }
    if (dto.realName !== undefined) user.realName = dto.realName;
    if (dto.email !== undefined) user.email = dto.email;
    if (dto.mobile !== undefined) user.mobile = dto.mobile;
    if (dto.enabled !== undefined) user.enabled = dto.enabled;
    if (dto.roleIds !== undefined) {
      user.roles = await this.roleRepo.findBy({ id: In(dto.roleIds) });
    }
    const saved = await this.userRepo.save(user);

    const afterUser = await this.findOne(id);
    const after = { ...afterUser, roles: (afterUser.roles ?? []).map((r) => r.id).sort((a, b) => a - b).join(',') };

    const changes: string[] = [];
    const check = (k: string, b: unknown, a: unknown) => { if (fmt(b) !== fmt(a)) changes.push(`${k}：${fmt(b)} -> ${fmt(a)}`); };
    if (dto.username !== undefined) check('username', (before as any).username, (after as any).username);
    if (dto.realName !== undefined) check('realName', (before as any).realName, (after as any).realName);
    if (dto.email !== undefined) check('email', (before as any).email, (after as any).email);
    if (dto.mobile !== undefined) check('mobile', (before as any).mobile, (after as any).mobile);
    if (dto.enabled !== undefined) check('enabled', (before as any).enabled, (after as any).enabled);
    if (dto.roleIds !== undefined) check('roleIds', (before as any).roles, (after as any).roles);
    if (dto.password != null && dto.password !== '') changes.push('password：已更新');

    if (changes.length) {
      await this.opLogs.createLog({
        type: OperationLogType.UPDATE,
        target: OperationLogTarget.USER,
        operatorName: operatorNameOf(operator),
        message: `变更 用户：${fmt(afterUser.realName || afterUser.username)}；${changes.join('；')}`,
      });
    }

    return this.omitPassword(saved);
  }

  async remove(id: number, operator?: Operator): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepo.remove(user);
    await this.opLogs.createLog({
      type: OperationLogType.DELETE,
      target: OperationLogTarget.USER,
      operatorName: operatorNameOf(operator),
      message: `删除 用户：${fmt(user.realName || user.username)}`,
    });
  }
}
