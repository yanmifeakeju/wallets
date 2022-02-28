import inquirer from 'inquirer';
import walletManger from '..';
import promptAccount from './initialize';

export async function addNewUser(
  questions: {
    input?: string;
    name: string;
    type?: string;
    message: string;
    mask?: string;
  }[]
) {
  const output: { username: string; password: string; password2: string }[] = [];
  inquirer.prompt(questions).then(async (answers) => {
    output.push(answers);
    const [reply] = output;
    const response = await walletManger.createUser({ username: reply.username, password: reply.password });
    if (!response.success) {
      console.log(response.code, ' ', response.message);
      addNewUser(questions);
    } else {
      console.log(response.message, 'Please log in to user your account');
    }
  });
}

export async function logInUser(
  questions: {
    input?: string;
    name: string;
    type?: string;
    message: string;
    mask?: string;
  }[]
) {
  const output: { username: string; password: string; password2: string }[] = [];
  inquirer.prompt(questions).then(async (answers) => {
    output.push(answers);
    const [reply] = output;
    const response = await walletManger.authUser({ username: reply.username, password: reply.password });
    if (!response.success) {
      console.log(response.code, ' ', response.message);
      logInUser(questions);
    } else {
      const user = await walletManger.retrieveUserWithUsername(reply.username);
      promptAccount(user.data);
    }
  });
}
