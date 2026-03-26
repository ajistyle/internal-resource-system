import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Project } from '../../entities/project.entity';
import { K8sDeploymentDeployItem } from './k8s-deployment-deploy-item.entity';
import { K8sDeploymentNode } from './k8s-deployment-node.entity';

export type K8sClusterEnv = 'prod' | 'test' | 'dev';

@Entity('k8s_deployments')
export class K8sDeployment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  projectId: number;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @Column({ type: 'varchar', length: 128 })
  clusterName: string;

  @Column({ type: 'varchar', length: 16 })
  clusterEnv: K8sClusterEnv;

  @Column({ type: 'varchar', length: 512, nullable: true })
  image: string | null;

  @Column({ type: 'varchar', length: 512, nullable: true })
  visualManage: string | null;

  @Column({ type: 'varchar', length: 128, nullable: true })
  deployService: string | null;

  @Column({ type: 'text', nullable: true })
  remark: string | null;

  @Column({ type: 'varchar', length: 16 })
  status: 'enabled' | 'disabled';

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => K8sDeploymentDeployItem, (ddi) => ddi.k8sDeployment)
  deployItems: K8sDeploymentDeployItem[];

  @OneToMany(() => K8sDeploymentNode, (n) => n.k8sDeployment)
  nodes: K8sDeploymentNode[];
}

