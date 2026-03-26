import { IsString, IsOptional, MaxLength } from 'class-validator';

export class UpdateStakeholderDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  name?: string;

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
