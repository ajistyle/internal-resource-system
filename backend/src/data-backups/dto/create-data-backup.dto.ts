import { IsIn, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';
import type { BackupPolicy, BackupType } from '../entities/data-backup.entity';

export class CreateDataBackupDto {
  @IsInt()
  @Type(() => Number)
  projectId: number;

  @IsInt()
  @Type(() => Number)
  serverId: number;

  @IsIn(['file', 'database'])
  backupType: BackupType;

  @IsIn(['incremental', 'full'])
  backupPolicy: BackupPolicy;

  @IsString()
  scope: string;

  @IsString()
  @MaxLength(64)
  cron: string;

  @IsInt()
  @Type(() => Number)
  @Min(0)
  retentionDays: number;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  localBackupPath?: string;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  remoteBackupPath?: string;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  localScriptPath?: string;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  gitScriptPath?: string;

  @IsOptional()
  @IsString()
  remark?: string;
}

