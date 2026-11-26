'use strict';

const taskService = require('../services/task.service');
const view = require('../views/response.view');

async function list(req, res, next) {
  try {
    const pagination = req.pagination || { page: 1, limit: 20 };
    const { rows, total } = await taskService.list(req.query.status, pagination);
    view.sendTaskList(res, rows, { page: pagination.page, limit: pagination.limit, total });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    view.sendCreated(res, await taskService.create(req.body));
  } catch (err) {
    next(err);
  }
}

async function updateStatus(req, res, next) {
  try {
    const id = Number(req.params.id);
    const status = req.body && req.body.status;
    view.sendTask(res, await taskService.updateStatus(id, status));
  } catch (err) {
    next(err);
  }
}

module.exports = { list, create, updateStatus };
