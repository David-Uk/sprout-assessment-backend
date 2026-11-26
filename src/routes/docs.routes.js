'use strict';

const router = require('express').Router();
const controller = require('../controllers/docs.controller');

router.get('/', controller.reference);
router.get('/openapi.json', controller.openapi);

module.exports = router;
