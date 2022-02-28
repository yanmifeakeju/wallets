import { Knex } from 'knex';
import ApplicationError from '../helpers/ApplicationError';

export const creditTransaction = async (userId: string, amount: number, method: string, db: Knex) => {
  if (amount <= 0) throw new ApplicationError('You cannot deposit an amount less than or equal to zero', 400);

  const record = await db.transaction(async (trx) => {
    let [getAccount] = await db('accounts').select('*').where({ user_id: userId }).returning('*').transacting(trx);

    let [updatedAccount] = await db('accounts')
      .update({ balance: Number(getAccount.balance) + Number(amount), version: getAccount.version + 1 })
      .where({ id: getAccount.id, version: getAccount.version })
      .returning('*')
      .transacting(trx);

    if (!updatedAccount) {
      [getAccount] = await db('accounts').select('*').where({ user_id: userId }).returning('*').transacting(trx);

      [updatedAccount] = await db('accounts')
        .update({ balance: Number(getAccount.balance) + Number(amount), version: getAccount.version + 1 })
        .where({ id: getAccount.id, version: getAccount.version })
        .returning('*')
        .transacting(trx);
    }

    const recordTransaction = await db('transactions')
      .insert({
        account_id: updatedAccount.id,
        amount,
        previous_balance: getAccount.balance,
        current_balance: updatedAccount.balance,
        method,
        type: 'CREDIT',
        version: updatedAccount.version,
        details: JSON.stringify({ receiver: null })
      })
      .returning('*')
      .transacting(trx);

    return [updatedAccount, recordTransaction];
  });
  return record;
};
