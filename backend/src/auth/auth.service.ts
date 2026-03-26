import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../entities/user.entity';
import { Role, RoleCode } from '../entities/role.entity';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Role)
    private roleRepo: Repository<Role>,
    private jwtService: JwtService,
  ) {}

  async onModuleInit() {
    await this.seedRolesAndAdmin();
  }

  private async seedRolesAndAdmin() {
    const count = await this.roleRepo.count();
    if (count > 0) return;

    await this.roleRepo.save([
      { code: RoleCode.ADMIN, name: '管理员' },
      { code: RoleCode.EDITOR, name: '编辑者' },
      { code: RoleCode.VIEWER, name: '查看者' },
    ]);

    const adminRole = await this.roleRepo.findOne({ where: { code: RoleCode.ADMIN } });
    const exists = await this.userRepo.findOne({ where: { username: 'admin' } });
    if (!exists && adminRole) {
      const hash = await bcrypt.hash('admin123', 10);
      await this.userRepo.save({
        username: 'admin',
        passwordHash: hash,
        realName: '管理员',
        enabled: 1,
        roles: [adminRole],
      });
    }
  }

  async validateUser(username: string, password: string): Promise<User | null> {
    const user = await this.userRepo.findOne({
      where: { username },
      relations: ['roles'],
    });
    if (!user || user.enabled !== 1) return null;
    const ok = await bcrypt.compare(password, user.passwordHash);
    return ok ? user : null;
  }

  async login(dto: LoginDto): Promise<{ access_token: string; user: { id: number; username: string; realName: string | null; roles: RoleCode[] } }> {
    const user = await this.validateUser(dto.username, dto.password);
    if (!user) throw new UnauthorizedException('用户名或密码错误');
    const payload = { sub: user.id, username: user.username };
    const access_token = this.jwtService.sign(payload);
    return {
      access_token,
      user: {
        id: user.id,
        username: user.username,
        realName: user.realName,
        roles: user.roles.map((r) => r.code),
      },
    };
  }
}
