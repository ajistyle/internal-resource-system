import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'project_modules' })
export class ProjectModule {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index()
  @Column({ type: 'int' })
  projectId!: number;

  @Column({ type: 'varchar', length: 128 })
  moduleName!: string;

  @Column({ type: 'text', nullable: true })
  remark!: string | null;

  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date;
}

