import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm'

import { CredentialStatus } from '../types'

import { RevocationRegistryEntity } from './revocation-registry.entity'

@Entity('credentials')
export class CredentialEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'varchar', nullable: true })
  connectionId?: string

  @Column({ type: 'varchar', nullable: true })
  threadId?: string

  @Column({ type: 'varchar', nullable: true })
  refIdHash?: string

  @Column({ nullable: true })
  status?: CredentialStatus

  @Column({ type: 'integer', nullable: true })
  revocationRegistryIndex?: number

  @ManyToOne(() => RevocationRegistryEntity, { nullable: true })
  @JoinColumn({ name: 'revocationRegistryId' })
  revocationRegistry?: RevocationRegistryEntity

  @CreateDateColumn()
  createdTs?: Date

  @UpdateDateColumn()
  updatedTs?: Date
}
