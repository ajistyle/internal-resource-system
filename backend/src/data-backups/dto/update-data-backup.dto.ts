import { IsIn, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';
import type { BackupPolicy, BackupType } from '../entities/data-backup.entity';

export class UpdateDataBackupDto {
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  projectId?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  serverId?: number;

  @IsOptional()
  @IsIn(['file', 'database'])
  backupType?: BackupType;

  @IsOptional()
  @IsIn(['incremental', 'full'])
  backupPolicy?: BackupPolicy;

  @IsOptional()
  @IsString()
  scope?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  cron?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(0)
  retentionDays?: number;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  localBackupPath?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  remoteBackupPath?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  localScriptPath?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  gitScriptPath?: string | null;

  @IsOptional()
  @IsString()
  remark?: string | null;
}

