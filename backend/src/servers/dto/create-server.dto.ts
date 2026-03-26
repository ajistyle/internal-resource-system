import {
  IsString,
  IsInt,
  IsOptional,
  IsArray,
  ValidateNested,
  MaxLength,
  Min,
  Max,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ServerDeployItemDto } from './server-deploy-item.dto';

export class CreateServerDto {
  @IsInt()
  projectId: number;

  @IsString()
  @MaxLength(128)
  name: string;

  @IsString()
  @MaxLength(64)
  ip: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  eip?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  hostname?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  os?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  osType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  cpuArch?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  cpuModel?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  cpuCores?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  memory?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  systemDisk?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  dataDisk?: number;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  networkRegion?: string;

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsInt()
  @Type(() => Number)
  @Min(1)
  @Max(65535)
  sshPort?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  sshUser?: string;

  @IsOptional()
  @IsString()
  @MaxLength(256)
  sshPassword?: string;

  @IsOptional()
  @IsString()
  remark?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  defaultRemoteInfoId?: number | null;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ServerDeployItemDto)
  deployItems?: ServerDeployItemDto[];
}
