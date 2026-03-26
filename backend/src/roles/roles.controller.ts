import { Controller, Get, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../entities/role.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleCode } from '../entities/role.entity';


@Controller('roles')
@UseGuards(JwtAuthGuard)
export class RolesController {
  constructor(
    @InjectRepository(Role)
    private roleRepo: Repository<Role>,
  ) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles(RoleCode.ADMIN)
  findAll() {
    return this.roleRepo.find({ order: { id: 'ASC' } });
  }

  /** 所有已登录用户可拉取角色列表（用于下拉等） */
  @Get('options')
  options() {
    return this.roleRepo.find({ order: { id: 'ASC' } });
  }
}
