import { IsInt, IsOptional, IsString, MaxLength, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDataMaintenanceDto {
  @IsInt()
  @Type(() => Number)
  projectId: number;

  @IsInt()
  @Type(() => Number)
  databaseId: number;

  @IsString()
  @MaxLength(64)
  requestSource: string;

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

  @IsDateString()
  handledAt: string;

  @IsString()
  @MaxLength(64)
  handler: string;

  @IsOptional()
  @IsString()
  remark?: string;
}

