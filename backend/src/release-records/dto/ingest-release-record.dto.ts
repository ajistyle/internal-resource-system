import { IsDateString, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class IngestReleaseRecordDto {
  @IsInt()
  projectId!: number;

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
  releasedAt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  releasedBy?: string;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  remark?: string;
}

