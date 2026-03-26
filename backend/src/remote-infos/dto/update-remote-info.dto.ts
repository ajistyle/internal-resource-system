import { IsString, IsOptional } from 'class-validator';

export class UpdateRemoteInfoDto {
  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  remark?: string;
}
