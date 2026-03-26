import { IsDateString, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class ListReleaseRecordsQueryDto {
  @IsOptional()
  @IsInt()
  projectId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  environment?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  versionTag?: string;

  @IsOptional()
  @IsDateString()
  startAt?: string;

  @IsOptional()
  @IsDateString()
  endAt?: string;

  // 简单关键词过滤（用于 releasedBy 或 remark）
  @IsOptional()
  @IsString()
  @MaxLength(128)
  keyword?: string;
}

