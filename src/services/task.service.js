'use strict';

const taskModel = require('../models/task.model');
const AppError = require('../utils/app-error');

const STATUSES = ['pending', 'in_progress', 'completed'];

function validateStatus(status) {
  if (!STATUSES.includes(status)) {
    throw new AppError('VALIDATION_ERROR', 'Invalid status');
  }
}

async function list(status, pagination = {}) {
  if (status !== undefined) validateStatus(status);
  const { rows, total } = await taskModel.list(status, pagination);
  return { rows, total };
}

async function create(input = {}) {
  const { title, description = '', status = 'pending' } = input;
  if (typeof title !== 'string' || title.trim().length === 0 || title.trim().length > 150) {
    throw new AppError('VALIDATION_ERROR', 'Invalid title');
  }
  if (typeof description !== 'string' || description.length > 1000) {
    throw new AppError('VALIDATION_ERROR', 'Invalid description');
  }
  validateStatus(status);
  return taskModel.create({ title: title.trim(), description, status });
}

async function updateStatus(id, status) {
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError('VALIDATION_ERROR', 'Invalid id');
  }
  validateStatus(status);
  const task = await taskModel.updateStatus(id, status);
  if (!task) {
    throw new AppError('NOT_FOUND', 'Task not found', 404);
  }
  return task;
}

module.exports = { list, create, updateStatus };
