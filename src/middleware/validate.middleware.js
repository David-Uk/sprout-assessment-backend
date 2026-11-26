'use strict';

const AppError = require('../utils/app-error');

const STATUSES = ['pending', 'in_progress', 'completed'];

function invalid(message) {
  throw new AppError('VALIDATION_ERROR', message);
}

function checkStatus(value) {
  if (!STATUSES.includes(value)) invalid('Invalid status');
}

function createTask(req, _res, next) {
  try {
    const body = req.body || {};
    if (typeof body.title !== 'string' || body.title.trim().length === 0 || body.title.trim().length > 150) {
      invalid('Invalid title');
    }
    if (body.description !== undefined && (typeof body.description !== 'string' || body.description.length > 1000)) {
      invalid('Invalid description');
    }
    if (body.status !== undefined) checkStatus(body.status);
  } catch (err) {
    return next(err);
  }
  next();
}

function taskId(req, _res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) invalid('Invalid id');
  } catch (err) {
    return next(err);
  }
  next();
}

function statusBody(req, _res, next) {
  try {
    checkStatus(req.body && req.body.status);
  } catch (err) {
    return next(err);
  }
  next();
}

function statusQuery(req, _res, next) {
  try {
    if (req.query.status !== undefined) checkStatus(req.query.status);
  } catch (err) {
    return next(err);
  }
  next();
}

function pagination(req, _res, next) {
  try {
    const page = req.query.page === undefined ? 1 : Number(req.query.page);
    const limit = req.query.limit === undefined ? 20 : Number(req.query.limit);
    if (!Number.isInteger(page) || page < 1) invalid('Invalid page');
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) invalid('Invalid limit');
    req.pagination = { page, limit, offset: (page - 1) * limit };
  } catch (err) {
    return next(err);
  }
  next();
}

module.exports = { createTask, taskId, statusBody, statusQuery, pagination };
