'use strict';

const path = require('node:path');
const dotenv = require('dotenv');
const chai = require('chai');
const chaiHttp = require('chai-http');

const root = path.join(__dirname, '..');

// Load the isolated test database credentials before the app/config is required.
dotenv.config({ path: path.join(root, '.env.test') });

const testUrl = process.env.DATABASE_URL_TEST;
if (!testUrl) {
  throw new Error('DATABASE_URL_TEST is missing. Copy .env.example to .env.test and set it.');
}

// src/config.js uses DATABASE_URL; dotenv will not overwrite values already set here.
process.env.DATABASE_URL = testUrl;
process.env.DATABASE_URL_UNPOOLED = process.env.DATABASE_URL_TEST_UNPOOLED || testUrl;
process.env.NODE_ENV = 'test';

chai.use(chaiHttp);

const { prepareSchema } = require('./helpers/db');
const { close } = require('../src/db');

exports.mochaHooks = {
  async beforeAll() {
    await prepareSchema();
  },
  async afterAll() {
    await close();
  },
};
