import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateProjectModuleDto {
  @IsOptional()
  @IsString()
  @MaxLength(128)
  moduleName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  remark?: string | null;
}

