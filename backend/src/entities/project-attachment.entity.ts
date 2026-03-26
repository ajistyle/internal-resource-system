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
import { Project } from './project.entity';
import { PROJECT_ATTACHMENT_CATEGORY_ORIGINAL } from '../project-attachments/project-attachments.constants';

@Entity('project_attachments')
@Index(['projectId', 'category', 'status'])
export class ProjectAttachment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Index()
  projectId: number;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @Column({ type: 'varchar', length: 64, default: PROJECT_ATTACHMENT_CATEGORY_ORIGINAL })
  category: string;

  @Column({ type: 'varchar', length: 512 })
  originalName: string;

  @Column({ type: 'varchar', length: 64 })
  bucket: string;

  @Column({ type: 'varchar', length: 1024 })
  objectKey: string;

  @Column({ type: 'varchar', length: 128, nullable: true })
  mimeType: string | null;

  @Column({ type: 'bigint', unsigned: true })
  size: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  uploaderName: string | null;

  @Column({ type: 'tinyint', default: 1 })
  status: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
