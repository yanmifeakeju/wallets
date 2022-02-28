/* eslint-disable @typescript-eslint/no-unused-vars */
import inquirer from 'inquirer';
import { promptAdmin } from './adminfunc';
import { addNewUser, logInUser } from './authCommands';
import { UserQuestions } from './questions';

enum Commands {
  Quit = 'QUIT',
  New = 'NEW ACCOUNT',
  ADMIN = 'ADMIN',
  LogIn = 'LOG IN'
}

function promptUser(): void {
  console.clear();
  inquirer
    .prompt({
      type: 'list',
      name: 'command',
      message: 'Choose an option',
      choices: Object.values(Commands)
    })
    .then((answers) => {
      switch (answers['command']) {
        case Commands.New:
          addNewUser(UserQuestions);
          break;
        case Commands.LogIn:
          logInUser(UserQuestions);
          break;
        case Commands.ADMIN:
          adminCode();
          break;
        case Commands.Quit:
        default:
          process.exit(0);
      }
    });
}

function adminCode() {
  const output: { code: string }[] = [];
  inquirer
    .prompt({
      type: 'input',
      name: 'code',
      message: 'Put in the admin code'
    })
    .then(async (answers) => {
      output.push(answers);
      const [reply] = output;
      if (reply.code !== 'forus') {
        process.stdout.write('Bad Code\n');
        process.exit(0);
      }
      promptAdmin();
    });
}

promptUser();
