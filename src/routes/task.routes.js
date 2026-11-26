'use strict';

const router = require('express').Router();
const controller = require('../controllers/task.controller');
const validate = require('../middleware/validate.middleware');

router.get('/', validate.statusQuery, validate.pagination, controller.list);
router.post('/', validate.createTask, controller.create);
router.patch('/:id/status', validate.taskId, validate.statusBody, controller.updateStatus);

module.exports = router;
