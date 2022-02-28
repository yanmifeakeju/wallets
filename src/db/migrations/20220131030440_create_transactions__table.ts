import { Knex } from 'knex';

const tablename = 'transactions';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(tablename, (table) => {
    table.increments('id').unique().notNullable().primary();
    table.integer('account_id').notNullable();
    table.decimal('amount', 20, 2).notNullable().defaultTo(0);
    table.decimal('previous_balance', 20, 2).notNullable();
    table.decimal('current_balance', 20, 2).notNullable();
    table.string('reference').notNullable().unique().defaultTo(knex.raw('uuid_generate_v4()'));
    table.enum('method', ['DEPOSIT', 'WITHDRAW', 'TRANSFER', 'REVERSAL']);
    table.enum('type', ['CREDIT', 'DEBIT']);
    table.json('details').notNullable();
    table.integer('version').notNullable().defaultTo(0);
    table.boolean('reversed').notNullable().defaultTo(false);
    table.timestamps(true, true);

    table.foreign('account_id').references('id').inTable('accounts');
    table.unique(['version', 'account_id']);
  });

  await knex.raw(`
    CREATE TRIGGER update_timestamp
    BEFORE UPDATE
    ON ${tablename}
    FOR EACH ROW
    EXECUTE PROCEDURE update_timestamp();
  `);
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable(tablename);
}
