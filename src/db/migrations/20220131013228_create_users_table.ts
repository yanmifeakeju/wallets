import { Knex } from 'knex';

const tablename = 'users';

export async function up(knex: Knex): Promise<void> {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
  await knex.schema.createTable(tablename, (table) => {
    table.uuid('id').unique().notNullable().primary().defaultTo(knex.raw('uuid_generate_v4()'));

    table.string('username', 50).unique().notNullable();

    table.string('password', 190).notNullable();

    // table.enum('coin_status', ['active', 'inactive']).defaultTo('inactive');

    table.timestamps(true, true);
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
