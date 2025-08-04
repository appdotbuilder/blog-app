
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type LoginInput } from '../schema';
import { loginUser } from '../handlers/login_user';

const testUser = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'password123',
  role: 'reader' as const
};

const testLoginInput: LoginInput = {
  email: 'test@example.com',
  password: 'password123'
};

describe('loginUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should login user with valid credentials', async () => {
    // Create test user with hashed password using Bun's built-in hasher
    const hashedPassword = await Bun.password.hash(testUser.password);
    await db.insert(usersTable)
      .values({
        username: testUser.username,
        email: testUser.email,
        password_hash: hashedPassword,
        role: testUser.role
      })
      .execute();

    const result = await loginUser(testLoginInput);

    expect(result.email).toEqual(testUser.email);
    expect(result.username).toEqual(testUser.username);
    expect(result.role).toEqual(testUser.role);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.password_hash).toBeDefined();
  });

  it('should throw error for non-existent email', async () => {
    const invalidInput: LoginInput = {
      email: 'nonexistent@example.com',
      password: 'password123'
    };

    await expect(loginUser(invalidInput)).rejects.toThrow(/invalid email or password/i);
  });

  it('should throw error for incorrect password', async () => {
    // Create test user
    const hashedPassword = await Bun.password.hash(testUser.password);
    await db.insert(usersTable)
      .values({
        username: testUser.username,
        email: testUser.email,
        password_hash: hashedPassword,
        role: testUser.role
      })
      .execute();

    const invalidInput: LoginInput = {
      email: testUser.email,
      password: 'wrongpassword'
    };

    await expect(loginUser(invalidInput)).rejects.toThrow(/invalid email or password/i);
  });

  it('should work with different user roles', async () => {
    // Create author user
    const authorUser = {
      username: 'authoruser',
      email: 'author@example.com',
      password: 'authorpass123',
      role: 'author' as const
    };

    const hashedPassword = await Bun.password.hash(authorUser.password);
    await db.insert(usersTable)
      .values({
        username: authorUser.username,
        email: authorUser.email,
        password_hash: hashedPassword,
        role: authorUser.role
      })
      .execute();

    const authorLoginInput: LoginInput = {
      email: authorUser.email,
      password: authorUser.password
    };

    const result = await loginUser(authorLoginInput);

    expect(result.email).toEqual(authorUser.email);
    expect(result.role).toEqual('author');
  });
});
