import { Knex } from 'knex';
import { UserData } from '../../src/lib/lib';

export const dbTeardown = async (db: Knex) => {
  await db('transactions').delete();
  await db('accounts').delete();
  await db('users').delete();
};

export const addTestUserAndAccount = async (data: UserData, db: Knex, balance = 0) => {
  const [user] = await db('users').insert(data).returning('*');
  const [account] = await db('accounts').insert({ user_id: user.id, balance }).returning('*');

  return { user, account };
};
