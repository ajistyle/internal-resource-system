import { IsString, IsOptional, MaxLength } from 'class-validator';

export class UpdateProjectDto {
  @IsOptional()
  @IsString()
  @MaxLength(128)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  projectLeader?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  envLeader?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  province?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  city?: string;

  @IsOptional()
  @IsString()
  remark?: string;
}
