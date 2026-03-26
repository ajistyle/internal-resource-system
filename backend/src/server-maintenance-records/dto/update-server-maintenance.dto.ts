import { IsInt, IsOptional, IsString, MaxLength, IsDateString } from 'class-validator';

export class UpdateServerMaintenanceDto {
  @IsOptional()
  @IsInt()
  projectId?: number;

  @IsOptional()
  @IsInt()
  serverId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  maintenanceType?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  operator?: string;

  @IsOptional()
  @IsDateString()
  operatedAt?: string;

  @IsOptional()
  @IsString()
  remark?: string;
}

