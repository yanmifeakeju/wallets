import inquirer from 'inquirer';
import walletManger from '..';

enum Commands {
  DEPOSIT = 'DEPOSIT',
  WITHDRAW = 'WITHRDAW',
  BALANCE = 'BALANCE',
  HISTORY = 'TRANSACTION HISTORY',
  TRANSFER = 'TRANSFER',
  QUIT = 'QUIT'
}

enum Reinit {
  BACK = 'BACK',
  QUIT = 'QUIT'
}

const transactionQuestion = [
  {
    input: 'input',
    name: 'amount',
    message: 'Please enter the an amount'
  }
];

export default function promptAccount(user: { id: string; username: string }): void {
  console.clear();
  console.log('Your Logged in, ', user.username);
  inquirer
    .prompt({
      type: 'list',
      name: 'command',
      message: 'Choose an option',
      choices: Object.values(Commands)
    })
    .then((answers) => {
      switch (answers['command']) {
        case Commands.DEPOSIT:
          deposit(user, transactionQuestion);
          break;
        case Commands.WITHDRAW:
          withdraw(user, transactionQuestion);
          break;
        case Commands.BALANCE:
          balance(user);
          break;
        case Commands.HISTORY:
          transactionHistory(user);
          break;
        case Commands.TRANSFER:
          transfer(user);
          break;
        case Commands.QUIT:
        default:
          process.exit(0);
      }
    });
}

function reinit(user: { id: string; username: string }): void {
  inquirer
    .prompt({
      type: 'list',
      name: 'command',
      message: 'Choose an option',
      choices: Object.values(Reinit)
    })
    .then((answers) => {
      switch (answers['command']) {
        case Reinit.BACK:
          promptAccount(user);
          break;

        case Reinit.QUIT:
        default:
          process.exit(0);
      }
    });
}

function deposit(user: { id: string; username: string }, questions: { input: string; name: string; message: string }[]) {
  const output: { amount: number }[] = [];
  inquirer.prompt(questions).then(async (answers) => {
    output.push(answers);
    const [reply] = output;
    const deposit = await walletManger.deposit(user.id, Number(reply.amount));
    if (!deposit.success) {
      console.log(deposit.code, ' ', deposit.message);
      reinit(user);
    }

    const message = `${deposit.message}! You account balance is ${deposit.data.account.balance} and transaction reference is ${deposit.data.transaction[0].reference}`;
    console.log(message);
    reinit(user);
  });
}

async function withdraw(user: { id: string; username: string }, questions: { input: string; name: string; message: string }[]) {
  const output: { amount: number }[] = [];
  inquirer.prompt(questions).then(async (answers) => {
    output.push(answers);
    const [reply] = output;
    const withdrawl = await walletManger.withdraw(user.id, Number(reply.amount));
    if (!withdrawl.success) {
      console.log(withdrawl.code, ' ', withdrawl.message);
      reinit(user);
    }
    const message = `${withdrawl.message}! You account balance is ${withdrawl.data.account.balance} and transaction reference is ${withdrawl.data.transaction[0].reference}`;
    console.log(message);
    reinit(user);
  });
}

async function balance(user: { id: string; username: string }) {
  const balance = await walletManger.getAccountBalance(user.id);
  console.log(balance.code, balance.message);
  balance.success ? console.log(`Your balnace is  ${balance.data.balance}`) : reinit(user);
  reinit(user);
}

async function transactionHistory(user: { id: string; username: string }) {
  const history = await walletManger.getTransactionHistory(user.id);

  console.log(history.code, history.message);
  history.success ? console.log(`Here is your transaction ${JSON.stringify(history.data, null, 4)}.`) : reinit(user);
  reinit(user);
}

async function transfer(user: { id: string; username: string }) {
  const output: { username: string; amount: number }[] = [];

  inquirer
    .prompt([
      {
        type: 'input',
        name: 'amount',
        message: 'How much do you want to send?'
      },
      {
        type: 'input',
        name: 'username',
        message: 'Please provide username of the wallet you want to transfer to:'
      }
    ])
    .then(async (answers) => {
      output.push(answers);
      const [reply] = output;
      const reciever = await walletManger.retrieveUserWithUsername(reply.username);
      if (!reciever.success) {
        console.log(reciever.code, reciever.message);
        return reinit(user);
      }

      const transfer = await walletManger.transfer(user.id, reciever.data.id, reply.amount);

      if (!transfer.success) {
        console.log(transfer.code, transfer.message);
        reinit(user);
      }

      process.stdout.write(`
      ${transfer.code} ${transfer.message}
      You have successfully transfered ${transfer.data.transaction.amount} to ${reply.username}
      You account balance is now ${transfer.data.account.balance}
      `);

      reinit(user);
    });
}
