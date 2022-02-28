import { Knex } from 'knex';
import ApplicationError from '../helpers/ApplicationError';

export const getAccount = async (identifier: string | number, db: Knex) => {
  const where: { id?: number; user_id?: string } = {};
  typeof identifier === 'string' ? (where.user_id = identifier) : (where.id = identifier);

  const [account] = await db('accounts').select('*').where(where);
  if (!account) throw new ApplicationError('Wallet does not exist', 401);

  return account;
};
