import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { db } from '../db/pool.js';
import logger from '../logger.js';
import type { RegisterInput, LoginInput } from '../schemas/auth.schema.js';

const BCRYPT_ROUNDS = 12;

interface UserRow extends RowDataPacket {
  id: number;
  username: string;
  password_hash: string;
  callsign: string;
  created_at: Date;
  updated_at: Date;
}

export interface TokenPayload {
  sub: number;
  username: string;
  callsign: string;
}

export interface UserProfile {
  id: number;
  username: string;
  callsign: string;
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  return secret;
}

export async function register(input: RegisterInput): Promise<{ token: string; user: UserProfile }> {
  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

  const [result] = await db.execute<ResultSetHeader>(
    'INSERT INTO Users (username, password_hash, callsign) VALUES (?, ?, ?)',
    [input.username, passwordHash, input.callsign]
  );

  const user: UserProfile = {
    id: result.insertId,
    username: input.username,
    callsign: input.callsign,
  };

  await backfillOrphanedContacts(user.id);

  const token = signToken(user);
  return { token, user };
}

async function backfillOrphanedContacts(userId: number): Promise<void> {
  try {
    const [userRows] = await db.execute<RowDataPacket[]>('SELECT COUNT(*) as cnt FROM Users');
    if ((userRows[0].cnt as number) !== 1) return;

    const [nullRows] = await db.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as cnt FROM Contacts WHERE user_id IS NULL'
    );
    const nullCount = nullRows[0].cnt as number;
    if (nullCount === 0) return;

    logger.info({ userId, count: nullCount }, 'backfilling orphaned contacts to first registered user');
    await db.execute('UPDATE Contacts SET user_id = ? WHERE user_id IS NULL', [userId]);
  } catch {
    // Column may not exist yet on fresh installs (schema already has NOT NULL)
  }
}

export async function login(input: LoginInput): Promise<{ token: string; user: UserProfile }> {
  const [rows] = await db.execute<UserRow[]>(
    'SELECT * FROM Users WHERE username = ?',
    [input.username]
  );

  if (rows.length === 0) {
    throw new AuthError('Invalid username or password');
  }

  const row = rows[0];
  const valid = await bcrypt.compare(input.password, row.password_hash);
  if (!valid) {
    throw new AuthError('Invalid username or password');
  }

  const user: UserProfile = {
    id: row.id,
    username: row.username,
    callsign: row.callsign,
  };

  const token = signToken(user);
  return { token, user };
}

export function verifyToken(token: string): TokenPayload {
  const payload = jwt.verify(token, getJwtSecret()) as unknown as TokenPayload;
  return payload;
}

function signToken(user: UserProfile): string {
  const payload: TokenPayload = {
    sub: user.id,
    username: user.username,
    callsign: user.callsign,
  };
  return jwt.sign(payload, getJwtSecret(), { expiresIn: '24h' });
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}
