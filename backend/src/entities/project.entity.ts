import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Stakeholder } from './stakeholder.entity';
import { RemoteInfo } from './remote-info.entity';
import { Server } from './server.entity';

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 128 })
  name: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  projectLeader: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  envLeader: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  province: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  city: string | null;

  @Column({ type: 'text', nullable: true })
  remark: string | null;

  @OneToMany(() => Stakeholder, (s) => s.project)
  stakeholders: Stakeholder[];

  @OneToMany(() => RemoteInfo, (r) => r.project)
  remoteInfos: RemoteInfo[];

  @OneToMany(() => Server, (s) => s.project)
  servers: Server[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
