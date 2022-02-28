import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
CREATE OR REPLACE FUNCTION update_timestamp() RETURNS TRIGGER
    LANGUAGE plpgsql
    AS
    $$
    BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
    END;
    $$;
  `);

  knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
}

export async function down(knex: Knex) {
  return knex.raw(`
    DROP FUNCTION IF EXISTS update_timestamp() CASCADE;
  `);
}
