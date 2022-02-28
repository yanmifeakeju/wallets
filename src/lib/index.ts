import 'dotenv/config';

import ApplicationError from './helpers/ApplicationError';
import { UserData, WalletResponse } from './lib';
import validate from './validation/users';
import Wallet from './wallet';

const wallet = new Wallet();

export const createUser = async (data: UserData): Promise<WalletResponse> => {
  try {
    const invalid = validate(data);
    if (invalid) return { success: false, code: 400, message: invalid.error };

    await wallet.processNewUser(data);
    return { success: true, code: 201, message: 'User Created' };
  } catch (e) {
    const errorResponse = formatErroMessage(e);
    return errorResponse;
  }
};

export const authUser = async (data: UserData) => {
  try {
    const user = await wallet.auth(data);
    return { success: true, code: 200, message: 'User Retrieved', data: user };
  } catch (e) {
    const errorResponse = formatErroMessage(e);
    return errorResponse;
  }
};

export const retrieveUserWithUsername = async (username: string) => {
  try {
    const user = await wallet.userWithUsername(username);
    return { success: true, code: 200, message: 'User Retrieved', data: user };
  } catch (e) {
    const errorResponse = formatErroMessage(e);
    return errorResponse;
  }
};

export const getAccountBalance = async (userId: string) => {
  try {
    const balance = await wallet.getUserAccountBalance(userId);
    return { success: true, code: 200, message: 'Balance Retrieved', data: balance };
  } catch (e) {
    const errorResponse = formatErroMessage(e);
    return errorResponse;
  }
};

export const getTransactionHistory = async (userId: string) => {
  try {
    const transactions = await wallet.getUserTransactionHistory(userId);
    return { success: true, code: 200, message: 'User Retrieved', data: transactions };
  } catch (e) {
    const errorResponse = formatErroMessage(e);
    return errorResponse;
  }
};

export const deposit = async (userId: string, amount: number): Promise<WalletResponse> => {
  try {
    if (amount < 100) return { success: false, code: 401, message: 'You cannot send below #100' };
    const transaction = await wallet.processDeposit(userId, amount);

    return { success: true, code: 201, message: 'Deposit Successful', data: transaction };
  } catch (e) {
    const errorResponse = formatErroMessage(e);
    return errorResponse;
  }
};

export const withdraw = async (userId: string, amount: number): Promise<WalletResponse> => {
  try {
    const withdrawal = await wallet.processWithdrawal(userId, amount);
    return { success: true, code: 201, message: 'Withdraw Successful', data: withdrawal };
  } catch (e) {
    const errorResponse = formatErroMessage(e);
    return errorResponse;
  }
};

export const transfer = async (senderId: string, recieverId: string, amount: number) => {
  try {
    const transfered = await wallet.processTransfer(senderId, recieverId, amount);
    return { success: true, code: 201, message: 'Transfer Successful', data: transfered };
  } catch (e) {
    const errorResponse = formatErroMessage(e);
    return errorResponse;
  }
};

export const reversal = async (reference: string) => {
  try {
    const transfered = await wallet.processReversal(reference);
    return { success: true, code: 201, message: 'Reversal Successful', data: transfered };
  } catch (e) {
    const errorResponse = formatErroMessage(e);
    return errorResponse;
  }
};

function formatErroMessage(e: unknown): WalletResponse {
  if (e instanceof ApplicationError) return { success: false, code: e.code, message: e.message };

  if (e instanceof Error && e.message.includes('unique constraint')) {
    return { success: false, code: 409, message: 'Duplicate resource insertion attempted' };
  }

  return { success: false, code: 500, message: 'Internal Application Error' };
}
