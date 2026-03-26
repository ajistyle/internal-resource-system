import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Project } from './project.entity';
import { RemoteInfo } from './remote-info.entity';
import { ServerDeployItem } from './server-deploy-item.entity';

@Entity('servers')
export class Server {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  projectId: number;

  @ManyToOne(() => Project, (p) => p.servers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @Column({ type: 'varchar', length: 128 })
  name: string;

  @Column({ type: 'varchar', length: 64 })
  ip: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  eip: string | null;

  @Column({ type: 'varchar', length: 128, nullable: true })
  hostname: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  os: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  osType: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  cpuArch: string | null;

  @Column({ type: 'varchar', length: 128, nullable: true })
  cpuModel: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  cpuCores: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  memory: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  systemDisk: string | null;

  @Column({ type: 'varchar', length: 128, nullable: true })
  dataDisk: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  networkRegion: string | null;

  @Column({ type: 'int', unsigned: true, nullable: true })
  sshPort: number | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  sshUser: string | null;

  @Column({ type: 'varchar', length: 256, nullable: true })
  sshPassword: string | null;

  @Column({ type: 'text', nullable: true })
  remark: string | null;

  @Column({ nullable: true })
  defaultRemoteInfoId: number | null;

  @ManyToOne(() => RemoteInfo, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'defaultRemoteInfoId' })
  defaultRemoteInfo: RemoteInfo | null;

  @OneToMany(() => ServerDeployItem, (sdi) => sdi.server)
  serverDeployItems: ServerDeployItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
