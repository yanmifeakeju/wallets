import { Knex } from 'knex';
import ApplicationError from '../helpers/ApplicationError';

export const debitTransaction = async (userId: string, amount: number, method: string, db: Knex) => {
  const record = await db.transaction(async (trx) => {
    let [getAccount] = await db('accounts').select('*').where({ user_id: userId }).returning('*').transacting(trx);

    let [updatedAccount] = await db('accounts')
      .update({ balance: Number(getAccount.balance) - amount, version: getAccount.version + 1 })
      .where({ id: getAccount.id, version: getAccount.version })
      .returning('*')
      .transacting(trx);

    //version my have changed
    if (!updatedAccount) {
      [getAccount] = await db('accounts').select('*').where({ user_id: userId }).returning('*').transacting(trx);

      [updatedAccount] = await db('accounts')
        .update({ balance: Number(getAccount.balance) - amount, version: getAccount.version + 1 })
        .where({ id: getAccount.id, version: getAccount.version })
        .returning('*')
        .transacting(trx);
    }

    if (updatedAccount && Number(updatedAccount.balance) < 0) throw new ApplicationError('You do not have sufficient balance', 400);

    const recordTransaction = await db('transactions')
      .insert({
        account_id: updatedAccount.id,
        amount,
        previous_balance: getAccount.balance,
        current_balance: updatedAccount.balance,
        method,
        type: 'DEBIT',
        version: updatedAccount.version,
        details: JSON.stringify({ user: getAccount.id })
      })
      .returning('*')
      .transacting(trx);

    return [updatedAccount, recordTransaction];
  });
  return record;
};
