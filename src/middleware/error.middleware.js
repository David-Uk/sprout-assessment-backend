'use strict';

const AppError = require('../utils/app-error');
const view = require('../views/response.view');

function notFound(_req, res) {
  view.sendError(res, 'NOT_FOUND', 'Route not found', 404);
}

function errorHandler(err, _req, res, _next) {
  if (err instanceof AppError) {
    return view.sendError(res, err.code, err.message, err.statusCode);
  }
  console.error(err);
  return view.sendError(res, 'INTERNAL_ERROR', 'Internal server error', 500);
}

module.exports = { notFound, errorHandler };
