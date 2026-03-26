import { IsString, MinLength, IsOptional, IsArray, IsInt, IsEmail } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @MinLength(1)
  username: string;

  @IsString()
  @MinLength(6, { message: '密码至少6位' })
  password: string;

  @IsOptional()
  @IsString()
  realName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  mobile?: string;

  @IsOptional()
  enabled?: number;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  roleIds?: number[];
}
