import { IsString, IsInt, IsOptional } from 'class-validator';

export class CreateRemoteInfoDto {
  @IsInt()
  projectId: number;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  remark?: string;
}
