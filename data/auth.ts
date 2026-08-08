import type { ValidationCase } from './types';

const stamp = Date.now();

export const INVALID_LOGINS: readonly ValidationCase[] = [
    { label: 'an empty body', payload: {} },
    { label: 'a missing password', payload: { email: 'user@demo.com' } },
    { label: 'a missing email', payload: { password: 'user123' } },
    { label: 'a malformed email', payload: { email: 'not-an-email', password: 'user123' } },
    { label: 'a non-string password', payload: { email: 'user@demo.com', password: 12345 } },
];

export const INVALID_REGISTRATIONS: readonly ValidationCase[] = [
    { label: 'an empty body', payload: {} },
    {
        label: 'a name shorter than 2 chars',
        payload: { name: 'A', email: `short${stamp}@demo.com`, password: 'user123' },
    },
    {
        label: 'a password shorter than 6 chars',
        payload: { name: 'Short Password', email: `pw${stamp}@demo.com`, password: '123' },
    },
    {
        label: 'a malformed email',
        payload: { name: 'Bad Email', email: 'not-an-email', password: 'user123' },
    },
];
