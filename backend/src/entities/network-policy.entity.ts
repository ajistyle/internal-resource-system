import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Project } from './project.entity';
import { Server } from './server.entity';

export type NetworkPolicyType = 'ingress' | 'egress' | 'crossnet';

@Entity('network_policies')
export class NetworkPolicy {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  projectId: number;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @Column({ nullable: true })
  serverId: number | null;

  @ManyToOne(() => Server, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'serverId' })
  server: Server | null;

  @Column({ type: 'varchar', length: 16 })
  policyType: NetworkPolicyType;

  /** 对端 IP：出访=目标 IP，入访=源 IP */
  @Column({ type: 'varchar', length: 128, nullable: true })
  peerIp: string | null;

  /** 策略作用说明 */
  @Column({ type: 'text', nullable: true })
  purpose: string | null;

  /** 旧版字段（历史数据），新策略可为空 */
  @Column({ type: 'varchar', length: 128, nullable: true })
  sourceZone: string | null;

  @Column({ type: 'varchar', length: 128, nullable: true })
  targetZone: string | null;

  @Column({ type: 'varchar', length: 16, nullable: true, default: 'TCP' })
  protocol: string | null;

  /** 入访时使用的目标端口 */
  @Column({ type: 'int', nullable: true })
  targetPort: number | null;

  /** 出访时使用的源端口 */
  @Column({ type: 'int', nullable: true })
  sourcePort: number | null;

  /** 入访映射 IP */
  @Column({ type: 'varchar', length: 128, nullable: true })
  mappingIp: string | null;

  /** 入访映射端口 */
  @Column({ type: 'int', nullable: true })
  mappingPort: number | null;

  @Column({ type: 'int', nullable: true })
  portStart: number | null;

  @Column({ type: 'int', nullable: true })
  portEnd: number | null;

  @Column({ type: 'varchar', length: 16, default: 'allow' })
  action: string;

  @Column({ type: 'varchar', length: 16, default: 'enabled' })
  status: string;

  @Column({ type: 'text', nullable: true })
  remark: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

