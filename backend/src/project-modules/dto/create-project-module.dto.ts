import { IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateProjectModuleDto {
  @IsInt()
  projectId!: number;

  @IsString()
  @MaxLength(128)
  moduleName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  remark?: string;
}

