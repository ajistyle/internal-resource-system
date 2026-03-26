import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Server } from './server.entity';
import { DeployItem } from './deploy-item.entity';

@Entity('server_deploy_items')
export class ServerDeployItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  serverId: number;

  @Column()
  deployItemId: number;

  @ManyToOne(() => Server, (s) => s.serverDeployItems, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'serverId' })
  server: Server;

  @ManyToOne(() => DeployItem, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'deployItemId' })
  deployItem: DeployItem;

  /** 端口、路径等 JSON */
  @Column({ type: 'json', nullable: true })
  config: Record<string, unknown> | null;

  @Column({ type: 'text', nullable: true })
  remark: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
