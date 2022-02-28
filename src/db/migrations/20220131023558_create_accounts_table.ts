import { Knex } from 'knex';

const tablename = 'accounts';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(tablename, (table) => {
    table.increments('id').unique().notNullable().primary();
    table.decimal('balance', 20, 4).notNullable().defaultTo(0);
    table.uuid('user_id').notNullable();
    table.integer('version').notNullable().defaultTo(1);
    table.timestamps(true, true);

    table.foreign('user_id').references('id').inTable('users');
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
