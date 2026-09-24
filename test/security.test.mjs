import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { hashPassword, verifyPassword, makeToken, parseToken } from '../src/lib/security.ts';

process.env.SESSION_SECRET = 'test-secret-0123456789abcdef0123456789abcdef';

test('password hashes authenticate only the original password', () => {
  const hash = hashPassword('a-strong-password');
  assert.ok(verifyPassword('a-strong-password', hash));
  assert.equal(verifyPassword('wrong-password', hash), false);
  assert.equal(verifyPassword('a-strong-password', '$2b$10$placeholder'), false);
});

test('signed sessions reject tampering and expiration', () => {
  const session = { userId: 3, username: 'viewer', roleId: 2 };
  const token = makeToken(session);
  assert.deepEqual(parseToken(token), session);
  assert.equal(parseToken(token + 'x'), null);
  const [payload, mac] = token.split('.');
  const altered = Buffer.from(JSON.stringify({ ...session, roleId: 1, expires: Date.now() + 10000 })).toString('base64url');
  assert.equal(parseToken(`${altered}.${mac}`), null);
  assert.equal(parseToken(`${payload}.bad`), null);
  const expiredPayload = Buffer.from(JSON.stringify({ ...session, expires: Date.now() - 1 })).toString('base64url');
  const expiredMac = createHmac('sha256', process.env.SESSION_SECRET).update(expiredPayload).digest('base64url');
  assert.equal(parseToken(`${expiredPayload}.${expiredMac}`), null);
});
