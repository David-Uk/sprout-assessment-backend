'use strict';

const spec = require('../../docs/openapi.json');
const docsView = require('../views/docs.view');

function reference(_req, res) {
  // Allow the Scalar bundle and its assets while keeping Helmet's other headers.
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' https://cdn.jsdelivr.net; " +
      "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; " +
      "img-src 'self' data: https:; connect-src 'self'"
  );
  res.type('html').send(docsView.html);
}

function openapi(_req, res) {
  res.json(spec);
}

module.exports = { reference, openapi };
