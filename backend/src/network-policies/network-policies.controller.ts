import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleCode } from '../entities/role.entity';
import { CreateNetworkPolicyDto } from './dto/create-network-policy.dto';
import { UpdateNetworkPolicyDto } from './dto/update-network-policy.dto';
import { NetworkPoliciesService } from './network-policies.service';

@Controller('network-policies')
@UseGuards(JwtAuthGuard)
export class NetworkPoliciesController {
  constructor(private service: NetworkPoliciesService) {}

  @Get()
  findAll(
    @Query('projectId') projectId?: string,
    @Query('serverId') serverId?: string,
    @Query('policyType') policyType?: string,
    @Query('status') status?: string,
    @Query('protocol') protocol?: string,
    @Query('keyword') keyword?: string,
    @Query('localIp') localIp?: string,
    @Query('peerIp') peerIp?: string,
  ) {
    const pid = projectId != null && projectId !== '' ? parseInt(projectId, 10) : undefined;
    const sid = serverId != null && serverId !== '' ? parseInt(serverId, 10) : undefined;
    return this.service.findAll({
      projectId: pid,
      serverId: sid,
      policyType: policyType || undefined,
      status: status || undefined,
      protocol: protocol || undefined,
      keyword: keyword || undefined,
      localIp: localIp || undefined,
      peerIp: peerIp || undefined,
    });
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(RoleCode.ADMIN, RoleCode.EDITOR)
  create(@Body() dto: CreateNetworkPolicyDto, @Req() req: Request) {
    return this.service.create(dto, req.user as any);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleCode.ADMIN, RoleCode.EDITOR)
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateNetworkPolicyDto, @Req() req: Request) {
    return this.service.update(id, dto, req.user as any);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleCode.ADMIN, RoleCode.EDITOR)
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    return this.service.remove(id, req.user as any);
  }
}

