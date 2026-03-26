import { IsString, IsOptional, IsInt, MaxLength } from 'class-validator';

export class CreateDictionaryDto {
  @IsString()
  @MaxLength(64)
  code: string;

  @IsString()
  @MaxLength(128)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  parentCode?: string;

  @IsOptional()
  @IsInt()
  status?: number;
}
