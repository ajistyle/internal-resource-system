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
import { Server } from '../../entities/server.entity';

export type K8sNodeRole = 'master' | 'node' | 'etcd';

@Entity('k8s_deployment_nodes')
export class K8sDeploymentNode {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column()
  k8sDeploymentId: number;

  @ManyToOne(() => K8sDeployment, (d) => d.nodes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'k8sDeploymentId' })
  k8sDeployment: K8sDeployment;

  @Index()
  @Column()
  serverId: number;

  @ManyToOne(() => Server, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'serverId' })
  server: Server;

  @Column({ type: 'simple-json' })
  roles: K8sNodeRole[];

  @Column({ type: 'varchar', length: 16 })
  status: 'enabled' | 'disabled';

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

