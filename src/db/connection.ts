import config from './knexfile';
import knex, { Knex } from 'knex';

const db: Knex = knex(config[process.env.NODE_ENV!]);

export default db;
