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

class UpdateK8sDeploymentDeployItemDto {
  @IsInt()
  deployItemId: number;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  remark?: string | null;
}

class UpdateK8sDeploymentNodeDto {
  @IsInt()
  serverId: number;

  @IsArray()
  @ArrayMinSize(1)
  @IsIn(['master', 'node', 'etcd'], { each: true })
  roles: Array<'master' | 'node' | 'etcd'>;

  @IsIn(['enabled', 'disabled'])
  status: 'enabled' | 'disabled';
}

export class UpdateK8sDeploymentDto {
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  projectId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  clusterName?: string;

  @IsOptional()
  @IsIn(['prod', 'test', 'dev'])
  clusterEnv?: K8sClusterEnv;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  image?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  visualManage?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  deployService?: string | null;

  @IsOptional()
  @IsString()
  remark?: string | null;

  @IsOptional()
  @IsString()
  @IsIn(['enabled', 'disabled'])
  status?: 'enabled' | 'disabled';

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateK8sDeploymentDeployItemDto)
  deployItems?: UpdateK8sDeploymentDeployItemDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateK8sDeploymentNodeDto)
  nodes?: UpdateK8sDeploymentNodeDto[];
}

