import type { ValidationCase } from './types';

export const INVALID_PROFILE_UPDATES: readonly ValidationCase[] = [
    { label: 'a name shorter than 2 chars', payload: { name: 'A' } },
    { label: 'an empty name', payload: { name: '' } },
    { label: 'a non-string name', payload: { name: 123 } },
    { label: 'a password shorter than 6 chars', payload: { password: '123' } },
    { label: 'a non-string password', payload: { password: 123456 } },
    { label: 'an address that is not an object', payload: { address: 'Springfield' } },
    { label: 'a non-string address field', payload: { address: { city: 123 } } },
];
