import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class CreateNetworkPolicyDto {
  @IsInt()
  projectId: number;

  /** 出访=源机器，入访=目标机器（已维护的计算资源） */
  @IsInt()
  serverId: number;

  @IsIn(['ingress', 'egress'])
  policyType: 'ingress' | 'egress';

  @IsString()
  @MinLength(1)
  @MaxLength(128)
  peerIp: string;

  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  purpose: string;

  @IsOptional()
  @IsIn(['TCP', 'UDP'])
  protocol?: 'TCP' | 'UDP';

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  targetPort?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  sourcePort?: number;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  mappingIp?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  mappingPort?: number;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  action?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  remark?: string;
}
