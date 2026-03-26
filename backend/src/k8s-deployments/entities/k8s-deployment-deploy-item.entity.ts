import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { K8sDeployment } from './k8s-deployment.entity';
import { DeployItem } from '../../entities/deploy-item.entity';

@Entity('k8s_deployment_deploy_items')
export class K8sDeploymentDeployItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column()
  k8sDeploymentId: number;

  @ManyToOne(() => K8sDeployment, (d) => d.deployItems, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'k8sDeploymentId' })
  k8sDeployment: K8sDeployment;

  @Index()
  @Column()
  deployItemId: number;

  @ManyToOne(() => DeployItem, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'deployItemId' })
  deployItem: DeployItem;

  @Column({ type: 'text', nullable: true })
  remark: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

