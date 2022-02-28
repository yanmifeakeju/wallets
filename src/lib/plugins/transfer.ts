import { Knex } from 'knex';
import crypto from 'crypto';
import ApplicationError from '../helpers/ApplicationError';

export const transferBetweenWallets = async (sender: string, receiver: string, amount: number, method: string, db: Knex) => {
  const record = await db.transaction(async (trx) => {
    let [sending] = await db('accounts').select('*').where({ user_id: sender }).transacting(trx);
    let [recieving] = await db('accounts').select('*').where({ user_id: receiver }).transacting(trx);

    if (!sending || !recieving) throw new ApplicationError('Cannot retrieve one of the wallets', 404);

    let [senderAccount] = await db('accounts')
      .update({ balance: Number(sending.balance) - Number(amount), version: sending.version + 1 })
      .where({ id: sending.id, version: sending.version })
      .returning('*')
      .transacting(trx);

    let [receiverAccount] = await db('accounts')
      .update({ balance: Number(recieving.balance) + Number(amount), version: recieving.version + 1 })
      .where({ id: recieving.id, version: recieving.version })
      .returning('*')
      .transacting(trx);

    // If the currently retrieved record has been changed
    // perform another retrieval once
    if (!senderAccount) {
      [sending] = await db('accounts').select('*').where({ user_id: sender }).transacting(trx);
      [senderAccount] = await db('accounts')
        .update({ balance: Number(sending.balance) - Number(amount), version: sending.version + 1 })
        .where({ id: sending.id, version: sending.version })
        .returning('*')
        .transacting(trx);
    }

    if (!receiverAccount) {
      [recieving] = await db('accounts').select('*').where({ user_id: receiver }).transacting(trx);

      [receiverAccount] = await db('accounts')
        .update({ balance: Number(recieving.balance) + Number(amount), version: recieving.version + 1 })

        .where({ id: recieving.id, version: recieving.version })
        .returning('*')
        .transacting(trx);
    }

    if (!receiverAccount || !senderAccount) throw new ApplicationError('Transaction cannot be completed', 404);
    if (Number(senderAccount.balance) < 0) throw new ApplicationError('Insufficient balance', 400);

    const reference = crypto.randomBytes(3 * 4).toString('base64');

    const recordTransaction = await db('transactions')
      .insert([
        {
          account_id: senderAccount.id,
          amount,
          previous_balance: sending.balance,
          current_balance: senderAccount.balance,
          method,
          type: 'DEBIT',
          version: senderAccount.version,
          details: JSON.stringify({ reference, user: receiverAccount.user_id })
        },
        {
          account_id: receiverAccount.id,
          amount,
          previous_balance: recieving.balance,
          current_balance: receiverAccount.balance,
          method,
          type: 'CREDIT',
          version: receiverAccount.version,
          details: JSON.stringify({ reference, user: senderAccount.user_id })
        }
      ])
      .returning('*')
      .transacting(trx);

    return [senderAccount, recordTransaction];
  });
  return record;
};
