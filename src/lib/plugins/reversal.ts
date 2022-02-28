import { Knex } from 'knex';
import ApplicationError from '../helpers/ApplicationError';
import { getAccount } from './accounts';
import { transferBetweenWallets } from './transfer';

export const reverseTransaction = async (reference: string, db: Knex) => {
  const [transactionRecord] = await db('transactions').where({ reference }).select('*');
  if (!transactionRecord) throw new ApplicationError('Transaction record doesn not exist', 404);
  if (transactionRecord.reversed) throw new ApplicationError('Cannot reversed a reversed transaction', 400);
  // if(transactionRecord.method == 'REVERSAL') throw new ApplicationError('This was a reversed trh')

  const record = db.transaction(async (trx) => {
    if (!transactionRecord) throw new ApplicationError('Transaction record doesn not exist', 404);

    const correspondTransactions = await db.raw(
      `select * from transactions  where details ->> 'reference' = '${transactionRecord.details.reference}'`
    );

    const { rows } = correspondTransactions;
    if (rows.length !== 2) throw new ApplicationError('Corresponding transaction not found', 404);

    const accounts = [await getAccount(rows[0].details.user, db), await getAccount(rows[1].details.user, db)];

    let sender;
    let recipient;

    if (transactionRecord.type === 'CREDIT') {
      [recipient] = accounts.filter((account) => transactionRecord.account_id === account.id);
      [sender] = accounts.filter((account) => transactionRecord.account_id !== account.id);
    } else {
      [recipient] = accounts.filter((account) => transactionRecord.account_id !== account.id);
      [sender] = accounts.filter((account) => transactionRecord.account_id === account.id);
    }

    const updateRecord = rows.map(async (row: { id: number }) => {
      const [update] = await db('transactions').update({ reversed: true }).where({ id: row.id, reversed: false }).returning('*').transacting(trx);
      if (!update) new ApplicationError('Cannot reversed a reversed transaction', 400);
      return update;
    });
    const result = await Promise.all(updateRecord);

    const update = await transferBetweenWallets(recipient.user_id, sender.user_id, Number(transactionRecord.amount), 'REVERSAL', db);

    if (!update) throw new ApplicationError('Error reversing transaction', 500);

    return result;
  });

  return record;
};
