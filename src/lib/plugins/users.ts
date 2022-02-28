import { Knex } from 'knex';
import ApplicationError from '../helpers/ApplicationError';
import { hashPassword, verifyPassword } from '../helpers/password';
import { UserData } from '../lib';
import { getAccount } from './accounts';

export const createUserAndAccount = async (data: UserData, db: Knex) => {
  const info = { ...data };
  info.password = await hashPassword(info.password);

  const record = db.transaction(async (trx) => {
    const [user] = await db('users').insert(info).returning('*').transacting(trx);
    const [account] = await db('accounts').insert({ user_id: user.id }).returning('*').transacting(trx);

    delete user.password;

    return { user, account };
  });

  return record;
};

export const isUser = async (data: UserData, db: Knex) => {
  const [user] = await db('users').select('*').where({ username: data.username });
  if (!user) throw new ApplicationError('Invalid credentials', 401);

  const verifyCreds = await verifyPassword(data.password, user.password);
  if (!verifyCreds) throw new ApplicationError('Invalid credentials', 401);

  delete user.password;

  return user;
};

export const getUser = async (username: string, db: Knex) => {
  const [user] = await db('users').select('*').where({ username });
  if (!user) throw new ApplicationError('Invalid credentials', 401);

  delete user.password;

  return user;
};

export const retrieveTransctionHistory = async (userId: string, db: Knex) => {
  const accountInfo = await getAccount(userId, db);
  const transactions = await db('transactions').where({ account_id: accountInfo.id });
  return transactions;
};
