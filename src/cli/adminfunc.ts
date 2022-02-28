import inquirer from 'inquirer';
import walletManger from '..';

enum Commands {
  REVERSAL = 'REVERSAL',
  QUIT = 'QUIT'
}

enum Reinit {
  BACK = 'BACK',
  QUIT = 'QUIT'
}

export function promptAdmin(): void {
  console.clear();
  console.log('Logged in as admin');
  inquirer
    .prompt({
      type: 'list',
      name: 'command',
      message: 'Choose an option',
      choices: Object.values(Commands)
    })
    .then((answers) => {
      switch (answers['command']) {
        case Commands.REVERSAL:
          reversal();
          break;

        case Commands.QUIT:
        default:
          process.exit(0);
      }
    });
}

function reversal() {
  const output: { reference: string }[] = [];
  inquirer
    .prompt({
      type: 'input',
      name: 'reference',
      message: 'Please provide the transaction reference'
    })
    .then(async (answers) => {
      output.push(answers);
      const [reply] = output;
      const t = await walletManger.reversal(reply.reference);
      if (!t.success) {
        process.stdout.write(`\n ${t.code} ${t.message}\n`);
        reinit();
      }
      process.stdout.write(`\n${t.code} ${t.message}\n`);
      reinit();
    });
}

function reinit(): void {
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
          promptAdmin();
          break;

        case Reinit.QUIT:
        default:
          process.exit(0);
      }
    });
}
