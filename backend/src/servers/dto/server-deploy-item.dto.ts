import { IsInt, IsOptional, IsObject, IsString } from 'class-validator';

export class ServerDeployItemDto {
  @IsInt()
  deployItemId: number;

  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  remark?: string;
}
