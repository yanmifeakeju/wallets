import { Knex } from 'knex';
import bcrypt from 'bcryptjs';

const salt = bcrypt.genSaltSync(10);

export async function seed(knex: Knex): Promise<void> {
  // Deletes ALL existing entries
  await knex('transactions').delete();
  await knex('accounts').delete();
  await knex('users').delete();

  for (let i = 0; i < 10; i++) {
    const [user] = await knex('users')
      .insert({
        username: 'users' + i,
        password: bcrypt.hashSync('password', salt)
      })
      .returning('*');

    await knex('accounts').insert({ user_id: user.id, balance: 10000 });
  }
}
