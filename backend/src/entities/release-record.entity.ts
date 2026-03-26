import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'release_records' })
export class ReleaseRecord {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int', nullable: true })
  projectId!: number | null;

  // 如 dev/test/prod；也可以在后续版本改为字典关联
  @Column({ type: 'varchar', length: 64, nullable: true })
  environment!: string | null;

  @Column({ type: 'varchar', length: 128, nullable: true })
  versionTag!: string | null;

  @Column({ type: 'datetime', nullable: true })
  releasedAt!: Date | null;

  @Index()
  @Column({ type: 'varchar', length: 128, nullable: true })
  releasedBy!: string | null;

  @Column({ type: 'varchar', length: 512, nullable: true })
  remark!: string | null;

  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date;
}

