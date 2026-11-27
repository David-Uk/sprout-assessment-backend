'use strict';

const { expect } = require('chai');

const configPath = require.resolve('../src/config');

describe('CORS origin policy', () => {
  it('allows local dev origins on any port but never unknown origins', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    delete require.cache[configPath];

    try {
      const devConfig = require('../src/config');
      // Vite falls back to 5174, 5175, ... when 5173 is already taken.
      expect(devConfig.isAllowedOrigin('http://localhost:5173')).to.equal(true);
      expect(devConfig.isAllowedOrigin('http://localhost:5174')).to.equal(true);
      expect(devConfig.isAllowedOrigin('http://127.0.0.1:5175')).to.equal(true);
      expect(devConfig.isAllowedOrigin('https://evil.example')).to.equal(false);
    } finally {
      process.env.NODE_ENV = originalEnv;
      delete require.cache[configPath];
      require('../src/config');
    }
  });

  it('keeps the explicit allow-list outside development', () => {
    const config = require('../src/config');
    expect(config.nodeEnv).to.equal('test');
    expect(config.isAllowedOrigin('http://localhost:5174')).to.equal(false);
  });
});
