import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const derive = promisify(scrypt);
export async function hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16).toString('hex');
    const hash = await derive(password, salt, 64) as Buffer;
    return `scrypt:${salt}:${hash.toString('hex')}`;
}

export async function verifyPassword(password: string, stored?: string): Promise<boolean> {
    const valid = stored?.match(/^scrypt:([a-f0-9]{32}):([a-f0-9]{128})$/);
    const salt = valid?.[1] || '0'.repeat(32);
    const expected = Buffer.from(valid?.[2] || '0'.repeat(128), 'hex');
    const actual = await derive(password, salt, 64) as Buffer;
    return timingSafeEqual(actual, expected) && !!valid;
}
