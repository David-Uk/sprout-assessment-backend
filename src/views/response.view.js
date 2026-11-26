'use strict';

// The API has no HTML views; JSON response shapes live here so controllers
// stay focused on coordinating the request.
function sendTask(res, task) {
  res.json({ data: task });
}

function sendCreated(res, task) {
  res.status(201).json({ data: task });
}

function sendTaskList(res, tasks, meta = {}) {
  res.json({ data: tasks, count: tasks.length, ...meta });
}

function sendError(res, code, message, statusCode) {
  res.status(statusCode).json({ error: { code, message } });
}

module.exports = { sendTask, sendCreated, sendTaskList, sendError };
