import dataService, { ready, ensureDefaultUsers, validateCredentials } from './js/dataService.js';
import assert from 'node:assert/strict';

await ready;
await dataService.reset();
await ensureDefaultUsers();
const user = await validateCredentials('facundo', '1234');
assert.ok(user && user.name === 'facundo', 'default user should exist');
console.log('Login test passed');
