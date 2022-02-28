import { hash, genSalt, compare } from 'bcryptjs';

export async function hashPassword(password: string) {
  const salt = await genSalt(10);
  const hashed = hash(password, salt);

  return hashed;
}

export async function verifyPassword(password: string, hash: string) {
  return await compare(password, hash);
}
