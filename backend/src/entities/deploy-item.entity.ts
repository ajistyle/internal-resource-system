import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('deploy_items')
export class DeployItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 128 })
  name: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  version: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  softwareType: string | null;

  @Column({ type: 'varchar', length: 256, nullable: true })
  defaultAccess: string | null;

  @Column({ type: 'date', nullable: true })
  selectedAt: Date | null;

  @Column({ type: 'tinyint', default: 1 })
  enabled: number;

  @Column({ type: 'text', nullable: true })
  remark: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
