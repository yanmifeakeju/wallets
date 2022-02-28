import walletManger from '../../src';
import db from '../../src/db/connection';
import { addTestUserAndAccount, dbTeardown } from './utills';

let user: { id: string };
let account: { id: number; balance: string; version: number; user_id: string };

const value = 500;

beforeAll(async () => {
  await dbTeardown(db);
  ({ user, account } = await addTestUserAndAccount({ username: 'depositTester', password: 'depositTesterPassword' }, db));
});

afterAll(async () => {
  await dbTeardown(db);
  await db.destroy();
});

describe('Deposit Transaction', function () {
  it('should succesfully complete transaction when amount is greater than zero', async function () {
    const deposit = await walletManger.deposit(user.id, value);
    expect(deposit.code).toBe(201);
    expect(deposit.success).toBeTruthy();
  });

  it('expect the account reflect the value the of the deposit', async function () {
    const [isAdded] = await db('accounts').select('*').where({ id: account.id });
    expect(Number(isAdded.balance)).toBe(value);
  });

  it('expect the version column of the account to increment by 1', async function () {
    const [isAdded] = await db('accounts').select('*').where({ id: account.id });
    expect(isAdded.version - 1).toEqual(account.version);
  });

  it('expects an attempt to update an already update of an account into the transaction table to fail unique constraints', async function () {
    try {
      await db('transactions').insert({
        account_id: account.id,
        amount: 500,
        previous_balance: 500,
        current_balance: 500,
        method: 'DEPOSIT',
        type: 'CREDIT',
        version: account.version + 1,
        details: JSON.stringify({ receiver: null })
      });
    } catch (e) {
      expect(e).toBeTruthy();
    }
  });

  it('expect a single record of the transaction to be in the database table', async function () {
    const transaction = await db('transactions').select('*').where({ account_id: account.id });
    expect(transaction.length).toEqual(1);
  });

  it('expects the transaction to record both the previous value and the current value of the account', async function () {
    const [transaction] = await db('transactions').select('*').where({ account_id: account.id });
    const [updateAccount] = await db('accounts').select('*').where({ id: account.id });

    expect(Number(transaction.previous_balance)).toEqual(Number(account.balance));
    expect(Number(transaction.current_balance)).toEqual(Number(updateAccount.balance));
  });

  describe('Attempt to update a transaction with same version and id with Wallet Deposit  to pass with unique record', function () {
    let user: { id: string };
    let account: { id: number; balance: string; version: number; user_id: string };
    beforeAll(async () => {
      await dbTeardown(db);
      ({ user, account } = await addTestUserAndAccount({ username: 'depositTester', password: 'depositTesterPassword' }, db));
    });
    it('should record a unique transaction for each deposit', async function () {
      await walletManger.deposit(user.id, 500);
      await walletManger.deposit(user.id, 500);
      await walletManger.deposit(user.id, 500);
      await walletManger.deposit(user.id, 500);

      const transactions = await db('transactions').select('*').where({ account_id: account.id });
      const [getAccount] = await db('accounts').select('*').where({ id: account.id });

      expect(Number(getAccount.balance)).toEqual(2000);
      expect(transactions.length).toEqual(4);
      for (let i = 0; i < transactions.length; i++) {
        if (transactions[i + 1]) {
          expect(transactions[i].current_balance).toEqual(transactions[i + 1].previous_balance);
        }
      }
    });
  });
});
