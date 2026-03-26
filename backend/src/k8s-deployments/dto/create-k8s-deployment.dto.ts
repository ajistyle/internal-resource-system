import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import type { K8sClusterEnv } from '../entities/k8s-deployment.entity';

class CreateK8sDeploymentDeployItemDto {
  @IsInt()
  deployItemId: number;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  remark?: string;
}

class CreateK8sDeploymentNodeDto {
  @IsInt()
  serverId: number;

  @IsArray()
  @ArrayMinSize(1)
  @IsIn(['master', 'node', 'etcd'], { each: true })
  roles: Array<'master' | 'node' | 'etcd'>;

  @IsIn(['enabled', 'disabled'])
  status: 'enabled' | 'disabled';
}

export class CreateK8sDeploymentDto {
  @IsInt()
  @Type(() => Number)
  projectId: number;

  @IsString()
  @MaxLength(128)
  clusterName: string;

  @IsIn(['prod', 'test', 'dev'])
  clusterEnv: K8sClusterEnv;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  image?: string;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  visualManage?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  // 兼容旧字段；当前由 deployItems 维护
  deployService?: string;

  @IsOptional()
  @IsString()
  remark?: string;

  @IsString()
  @IsIn(['enabled', 'disabled'])
  status: 'enabled' | 'disabled';

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateK8sDeploymentDeployItemDto)
  deployItems?: CreateK8sDeploymentDeployItemDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateK8sDeploymentNodeDto)
  nodes?: CreateK8sDeploymentNodeDto[];
}

