import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum OperationLogType {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}

export enum OperationLogTarget {
  PROJECT = 'PROJECT',
  PROJECT_ATTACHMENT = 'PROJECT_ATTACHMENT',
  K8S_DEPLOYMENT = 'K8S_DEPLOYMENT',
  DATA_BACKUP = 'DATA_BACKUP',
  STAKEHOLDER = 'STAKEHOLDER',
  SERVER = 'SERVER',
  NETWORK_POLICY = 'NETWORK_POLICY',
  REMOTE_INFO = 'REMOTE_INFO',
  DEPLOY_ITEM = 'DEPLOY_ITEM',
  DICTIONARY = 'DICTIONARY',
  USER = 'USER',
}

@Entity('operation_logs')
export class OperationLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: 'varchar', length: 16 })
  type: OperationLogType;

  @Index()
  @Column({ type: 'varchar', length: 32 })
  target: OperationLogTarget;

  @Index()
  @Column({ type: 'varchar', length: 64 })
  operatorName: string;

  @Column({ type: 'varchar', length: 2048 })
  message: string;

  @CreateDateColumn()
  createdAt: Date;
}

