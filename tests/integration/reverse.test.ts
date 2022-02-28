import walletManger from '../../src';
import db from '../../src/db/connection';
import { WalletResponse } from '../../src/lib/lib';
import { addTestUserAndAccount, dbTeardown } from './utills';
import { getAccount } from '../../src/lib/plugins/accounts';

afterAll(async () => {
  await dbTeardown(db);
  await db.destroy();
});

describe('Reverse Transaction', function () {
  describe('Successful Reversal', function () {
    let sender: { id: string };
    let recipient: { id: string };
    let senderAccount: { id: number; balance: string; version: number; sender_id: string };
    let recipientAccount: { id: number; balance: string; version: number; sender_id: string };
    let transfer: WalletResponse;
    let reversal: WalletResponse;
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
        0
      ));
      transfer = await walletManger.transfer(sender.id, recipient.id, value);
      // console.log(transfer);
      reversal = await walletManger.reversal(transfer.data.transaction.reference);
    });

    it('should succesfully complete transaction between sender and recipient', async function () {
      expect(reversal.code).toBe(201);
      expect(reversal.success).toBeTruthy();
      expect(reversal.data.length).toEqual(2);
    });

    it('should mark the reverse fields as true', async function () {
      expect(reversal.data[0].reversed).toEqual(true);
      expect(reversal.data[1].reversed).toEqual(true);
    });

    it('the transaction must not change', async function () {
      expect(reversal.data[0].details.reference).toEqual(reversal.data[1].details.reference);
    });

    it('should record the changes in the database', async function () {
      const theSender = await getAccount(senderAccount.id, db);
      const theReciever = await getAccount(recipientAccount.id, db);

      expect(theSender.balance).toEqual(senderAccount.balance);
      expect(theReciever.balance).toEqual(recipientAccount.balance);
    });

    describe('Successful Reversal', function () {
      it('should fail if an attempt is made to reverse an already reversed transaction', async function () {
        const shouldFail = await walletManger.reversal(transfer.data.transaction.reference);
        expect(shouldFail.code).toBe(400);
      });

      it('should not mutate the balance in the users account', async function () {
        const theSender = await getAccount(senderAccount.id, db);
        const theReciever = await getAccount(recipientAccount.id, db);

        expect(theSender.balance).toEqual(senderAccount.balance);
        expect(theReciever.balance).toEqual(recipientAccount.balance);
      });
    });
  });
});
