import walletManger from '../../src';
import db from '../../src/db/connection';
import { WalletResponse } from '../../src/lib/lib';

const dbTeardown = async () => {
  await db('transactions').delete();
  await db('accounts').delete();
  await db('users').delete();
};

beforeAll(() => dbTeardown());

afterAll(async () => db.destroy());

describe('Create User', function () {
  const testuser = { username: 'testuser', password: 'testpassword' };

  describe('with invalid data', function () {
    it('should return an object with property success set to false and code set to 400', async function () {
      const data = { username: '', password: '' };
      const user = await walletManger.createUser(data);
      expect(user.success).toBeFalsy();
      expect(user.code).toBe(400);
    });

    it('should return an object with property success set to false and code set to 409', async function () {
      await db('users').insert(testuser).returning('*');
      const user = await walletManger.createUser(testuser);
      expect(user.success).toBeFalsy();
      expect(user.code).toBe(409);
    });
  });

  describe('with valid data', function () {
    const data = { username: 'validuser', password: 'validpassword' };
    let user: WalletResponse;

    beforeAll(async () => {
      user = await walletManger.createUser(data);
    });

    it('should return an object with property success set to true and code set to 201 ', async function () {
      expect(user.success).toBeTruthy();
      expect(user.code).toBe(201);
    });

    it('should not return a data property containing the user info', async function () {
      expect(user.data).toBeFalsy();
    });

    it('should store the user in the database and password must be hashed', async function () {
      const u = await db('users').select('*').where({ username: data.username });
      expect(u.length).toEqual(1);
      const [p] = u;
      expect(p.password).not.toBe(data.password);
    });

    it('should create a corresponding entry for the user in the accounts table with a balance of zero', async function () {
      const [user] = await db('users').select('*').where({ username: data.username });
      const [acc] = await db('accounts').select('*').where({ user_id: user.id });

      expect(acc.user_id).toEqual(user.id);
      expect(Number(acc.balance)).toEqual(0);
    });
  });

  describe('authenticating user', function () {
    it('should return object with property success set to false and code set 401 for incorrect username or password', async function () {
      const u = await walletManger.authUser({ username: 'olu', password: 'folu' });
      expect(u.code).toBe(401);
      expect(u.success).toBeFalsy();
    });

    it('should return object with property success set to true and code set 200 for correct username or password', async function () {
      const data = { username: 'validuser', password: 'validpassword' };
      const u = await walletManger.authUser({ username: data.username, password: data.password });
      expect(u.code).toBe(200);
      expect(u.success).toBeTruthy();
      expect(u.data.password).toBeFalsy();
    });
  });
});
