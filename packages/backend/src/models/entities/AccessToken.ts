/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Entity, PrimaryColumn, Index, Column, ManyToOne, JoinColumn } from 'typeorm';
import { id } from '../id.js';
import { User } from './User.js';
import { App } from './App.js';

@Entity()
export class AccessToken {
	@PrimaryColumn(id())
	public id: string;

	@Column('timestamp with time zone', {
		comment: 'The created date of the AccessToken.',
	})
	public createdAt: Date;

	@Column('timestamp with time zone', {
		nullable: true,
	})
	public lastUsedAt: Date | null;

	@Index()
	@Column('varchar', {
		length: 128,
	})
	public token: string;

	@Index()
	@Column('varchar', {
		length: 128,
		nullable: true,
	})
	public session: string | null;

	@Index()
	@Column('varchar', {
		length: 128,
	})
	public hash: string;

	@Index()
	@Column(id())
	public userId: User['id'];

	@ManyToOne(type => User, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public user: User | null;

	@Column({
		...id(),
		nullable: true,
	})
	public appId: App['id'] | null;

	@ManyToOne(type => App, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public app: App | null;

	@Column('varchar', {
		length: 128,
		nullable: true,
	})
	public name: string | null;

	@Column('varchar', {
		length: 512,
		nullable: true,
	})
	public description: string | null;

	@Column('varchar', {
		length: 512,
		nullable: true,
	})
	public iconUrl: string | null;

	@Column('varchar', {
		length: 64, array: true,
		default: '{}',
	})
	public permission: string[];

	@Column('boolean', {
		default: false,
	})
	public fetched: boolean;
}
