import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  JoinTable,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Role } from './role.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 64, unique: true })
  username: string;

  @Column({ type: 'varchar', length: 255 })
  passwordHash: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  realName: string | null;

  @Column({ type: 'varchar', length: 128, nullable: true })
  email: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  mobile: string | null;

  @Column({ type: 'tinyint', default: 1 })
  enabled: number;

  /** 钉钉预留 */
  @Column({ type: 'varchar', length: 64, nullable: true })
  dingtalkUserid: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  dingtalkUnionid: string | null;

  @Column({ type: 'varchar', length: 128, nullable: true })
  dingtalkNickname: string | null;

  /** 预留：部门（钉钉组织架构） */
  @Column({ type: 'int', nullable: true })
  departmentId: number | null;

  @ManyToMany(() => Role, (r) => r.users, { eager: true })
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'userId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'roleId', referencedColumnName: 'id' },
  })
  roles: Role[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
