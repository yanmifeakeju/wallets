import 'dotenv/config';
import db from '../../db/connection';
import { UserData } from '../lib';
import { creditTransaction } from '../plugins/credit';
import { debitTransaction } from '../plugins/debit';
import { createUserAndAccount, getUser, isUser, retrieveTransctionHistory } from '../plugins/users';
import { transferBetweenWallets } from '../plugins/transfer';
import { reverseTransaction } from '../plugins/reversal';
import { getAccount } from '../plugins/accounts';

export default class Wallet {
  private connection = db;

  async processNewUser(data: UserData) {
    const user = await createUserAndAccount(data, this.connection);

    return user;
  }

  async auth(data: UserData) {
    const authenticatedUser = await isUser(data, this.connection);
    return authenticatedUser;
  }

  async getUserAccountBalance(userId: string) {
    const balance = await getAccount(userId, db);
    return { balance: balance.balance };
  }

  async getUserTransactionHistory(userId: string) {
    const transactions = await retrieveTransctionHistory(userId, this.connection);
    return transactions;
  }

  async userWithUsername(username: string) {
    const user = await getUser(username, this.connection);
    return user;
  }

  async processDeposit(userId: string, amount: number) {
    const [account, transaction] = await creditTransaction(userId, amount, 'DEPOSIT', this.connection);
    return { account, transaction };
  }

  async processWithdrawal(userId: string, amount: number) {
    const [account, transaction] = await debitTransaction(userId, amount, 'WITHDRAW', this.connection);
    return { account, transaction };
  }

  async processTransfer(from: string, to: string, amount: number) {
    const [account, transactionRecord] = await transferBetweenWallets(from, to, amount, 'TRANSFER', this.connection);
    const [transaction] = transactionRecord.filter((t: { account_id: number }) => t.account_id === account.id);
    return { account, transaction };
  }

  async processReversal(reference: string) {
    const reverse = await reverseTransaction(reference, this.connection);
    return reverse;
  }
}
