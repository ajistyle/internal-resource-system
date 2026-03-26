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
import { Database } from './database.entity';

@Entity('data_maintenance_records')
export class DataMaintenanceRecord {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  projectId: number;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @Column()
  databaseId: number;

  @ManyToOne(() => Database, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'databaseId' })
  database: Database;

  @Column({ type: 'varchar', length: 64 })
  requestSource: string;

  @Column({ type: 'varchar', length: 256, nullable: true })
  complianceNote: string | null;

  @Column({ type: 'text', nullable: true })
  handlingMeasure: string | null;

  @Column({ type: 'int', nullable: true })
  handlingCount: number | null;

  @Column({ type: 'datetime' })
  handledAt: Date;

  @Column({ type: 'varchar', length: 64 })
  handler: string;

  @Column({ type: 'text', nullable: true })
  remark: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

