import { IsInt, IsOptional, IsString, MaxLength, IsDateString } from 'class-validator';

export class CreateServerMaintenanceDto {
  @IsInt()
  projectId: number;

  @IsInt()
  serverId: number;

  @IsString()
  @MaxLength(64)
  maintenanceType: string;

  @IsString()
  content: string;

  @IsString()
  @MaxLength(64)
  operator: string;

  @IsDateString()
  operatedAt: string;

  @IsOptional()
  @IsString()
  remark?: string;
}

