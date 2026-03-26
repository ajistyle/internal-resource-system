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
import { Project } from '../../entities/project.entity';
import { Server } from '../../entities/server.entity';

export type BackupType = 'file' | 'database';
export type BackupPolicy = 'incremental' | 'full';

@Entity('data_backups')
@Index(['projectId', 'serverId'])
export class DataBackup {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  projectId: number;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @Column()
  serverId: number;

  @ManyToOne(() => Server, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'serverId' })
  server: Server;

  @Column({ type: 'varchar', length: 16 })
  backupType: BackupType;

  @Column({ type: 'varchar', length: 16 })
  backupPolicy: BackupPolicy;

  @Column({ type: 'text' })
  scope: string;

  @Column({ type: 'varchar', length: 64 })
  cron: string;

  @Column({ type: 'int', unsigned: true })
  retentionDays: number;

  @Column({ type: 'varchar', length: 512, nullable: true })
  localBackupPath: string | null;

  @Column({ type: 'varchar', length: 512, nullable: true })
  remoteBackupPath: string | null;

  @Column({ type: 'varchar', length: 512, nullable: true })
  localScriptPath: string | null;

  @Column({ type: 'varchar', length: 512, nullable: true })
  gitScriptPath: string | null;

  @Column({ type: 'text', nullable: true })
  remark: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

