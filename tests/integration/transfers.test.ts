import walletManger from '../../src';
import crypto from 'crypto';
import db from '../../src/db/connection';
import { WalletResponse } from '../../src/lib/lib';
import { addTestUserAndAccount, dbTeardown } from './utills';

afterAll(async () => {
  await dbTeardown(db);
  await db.destroy();
});

describe('Transfer Transaction', function () {
  describe('Successful Transfer', function () {
    let sender: { id: string };
    let recipient: { id: string };
    let senderAccount: { id: number; balance: string; version: number; user_id: string };
    let recipientAccount: { id: number; balance: string; version: number; user_id: string };
    let transfer: WalletResponse;

    const value = 500;

    beforeAll(async () => {
      await dbTeardown(db);
      ({ user: sender, account: senderAccount } = await addTestUserAndAccount(
        { username: 'withdrawTester', password: 'withdrawTesters' },
        db,
        10000
      ));

      ({ user: recipient, account: recipientAccount } = await addTestUserAndAccount(
        { username: 'sendRecipient', password: 'sendRecipientP' },
        db,
        10000
      ));
      transfer = await walletManger.transfer(sender.id, recipient.id, value);
    });

    it('should succesfully complete transaction between sender and recipient', async function () {
      expect(transfer.code).toBe(201);
      expect(transfer.success).toBeTruthy();
    });

    it('should return only the sender account details', function () {
      expect(transfer.data).toBeTruthy();
      expect(Object.keys(transfer.data)).toEqual(['account', 'transaction']);
      expect(transfer.data.account.user_id).toEqual(sender.id);
      expect(transfer.data.account.id).toEqual(transfer.data.transaction.account_id);
    });

    it('should increase the account of the recipicient by transaction value and reduce account of the sender by transaction vaule', async function () {
      const [fromAccount] = await db('accounts').select('*').where({ user_id: sender.id });
      const [toAccount] = await db('accounts').select('*').where({ user_id: recipient.id });

      expect(Number(senderAccount.balance) - value).toEqual(Number(fromAccount.balance));
      expect(Number(recipientAccount.balance) + value).toEqual(Number(toAccount.balance));
    });

    it('should store similar reference value for connected transactions', async function () {
      const [record] = await db('transactions').select('*').where({ account_id: senderAccount.id });
      const correspondTransactions = await db.raw(`select details from transactions  where details ->> 'reference' = '${record.details.reference}'`);

      const { rows } = correspondTransactions;
      const findSender = rows.filter((row: { user: string }) => row.user === senderAccount.user_id);
      const finderRecipient = rows.filter((row: { user: string }) => row.user === recipientAccount.user_id);

      expect(rows.length).toEqual(2);
      expect(findSender).toBeTruthy();
      expect(finderRecipient).toBeTruthy();
    });
  });

  describe('Unsuccessful Transfer', function () {
    let sender: { id: string };
    let recipient: { id: string };
    let senderAccount: { id: number; balance: string; version: number; sender_id: string };
    let recipientAccount: { id: number; balance: string; version: number; sender_id: string };
    let transfer: WalletResponse;

    beforeAll(async () => {
      await dbTeardown(db);

      ({ user: sender, account: senderAccount } = await addTestUserAndAccount({ username: 'failedTransaction', password: 'withdrawTesters' }, db));

      ({ user: recipient, account: recipientAccount } = await addTestUserAndAccount(
        { username: 'awongiveway', password: 'sendRecipientP' },
        db,
        10000
      ));

      transfer = await walletManger.transfer(sender.id, recipient.id, 100000);
    });

    it('should not complete a transaction from an account with insufficent balance', async function () {
      expect(transfer.code).toBe(400);
      expect(transfer.success).toBeFalsy();
    });

    it('should not mutatate or change the account balance of both account', async function () {
      const [fromAccount] = await db('accounts').select('*').where({ user_id: sender.id });
      const [toAccount] = await db('accounts').select('*').where({ user_id: recipient.id });

      expect(senderAccount.balance).toEqual(fromAccount.balance);
      expect(recipientAccount.balance).toEqual(toAccount.balance);
    });

    it('should not record a corresponding transaction record for the transaction', async function () {
      const [sender] = await db('transactions').select('*').where({ account_id: senderAccount.id });
      const [recipient] = await db('transactions').select('*').where({ account_id: recipientAccount.id });

      expect(sender).toBeFalsy();
      expect(recipient).toBeFalsy();
    });

    it('should not compelete a transaction inexisting user', async function () {
      const to = crypto.randomUUID();
      const transfer = await walletManger.transfer(recipient.id, to, 5000);
      const [checkStatus] = await db('accounts').select('*').where({ id: recipientAccount.id });

      expect(checkStatus.balance).toBe(recipientAccount.balance);
      expect(transfer.code).toBe(404);
    });
  });
});
