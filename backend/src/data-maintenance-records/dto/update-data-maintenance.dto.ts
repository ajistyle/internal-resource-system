import { IsInt, IsOptional, IsString, MaxLength, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateDataMaintenanceDto {
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  projectId?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  databaseId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  requestSource?: string;

  @IsOptional()
  @IsString()
  @MaxLength(256)
  complianceNote?: string;

  @IsOptional()
  @IsString()
  handlingMeasure?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  handlingCount?: number;

  @IsOptional()
  @IsDateString()
  handledAt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  handler?: string;

  @IsOptional()
  @IsString()
  remark?: string;
}

