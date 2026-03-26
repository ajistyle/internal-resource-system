import { IsString, IsOptional, IsInt, MaxLength } from 'class-validator';

export class UpdateDeployItemDto {
  @IsOptional()
  @IsString()
  @MaxLength(128)
  name?: string;

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
  selectedAt?: string;

  @IsOptional()
  @IsInt()
  enabled?: number;

  @IsOptional()
  @IsString()
  remark?: string;
}
