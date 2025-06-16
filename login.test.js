import { startServer } from './server/index.js';
import assert from 'node:assert/strict';

process.env.API_URL = 'http://localhost:3000/api';
// start the API server for the tests
const server = await startServer(3000);

const dataModule = await import('./js/dataService.js');
const { default: dataService, ready, ensureDefaultUsers, validateCredentials } = dataModule;

await ready;
await dataService.reset();
await ensureDefaultUsers();
const user = await validateCredentials('admin', 'admin');
assert.ok(user && user.name === 'admin', 'default admin user should exist');
console.log('Login test passed');
server.close();
