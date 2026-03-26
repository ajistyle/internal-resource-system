import { IsString, IsInt, IsOptional, MaxLength } from 'class-validator';

export class CreateStakeholderDto {
  @IsInt()
  projectId: number;

  @IsString()
  @MaxLength(64)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  contact?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  role?: string;

  @IsOptional()
  @IsString()
  remark?: string;
}
