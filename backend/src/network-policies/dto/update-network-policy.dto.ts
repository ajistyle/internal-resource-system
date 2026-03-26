import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class UpdateNetworkPolicyDto {
  @IsOptional()
  @IsInt()
  projectId?: number;

  @IsOptional()
  @IsInt()
  serverId?: number | null;

  @IsOptional()
  @IsIn(['ingress', 'egress', 'crossnet'])
  policyType?: 'ingress' | 'egress' | 'crossnet';

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  peerIp?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  purpose?: string;

  @IsOptional()
  @IsString()
  sourceZone?: string;

  @IsOptional()
  @IsString()
  targetZone?: string;

  @IsOptional()
  @IsString()
  protocol?: string;

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
  @IsInt()
  portStart?: number;

  @IsOptional()
  @IsInt()
  portEnd?: number;

  @IsOptional()
  @IsString()
  action?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  remark?: string;
}
