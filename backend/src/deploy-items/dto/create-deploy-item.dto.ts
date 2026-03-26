import { IsString, IsOptional, IsInt, MaxLength } from 'class-validator';

export class CreateDeployItemDto {
  @IsString()
  @MaxLength(128)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  version?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  softwareType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(256)
  defaultAccess?: string;

  @IsOptional()
  selectedAt?: string; // YYYY-MM-DD

  @IsOptional()
  @IsInt()
  enabled?: number;

  @IsOptional()
  @IsString()
  remark?: string;
}
