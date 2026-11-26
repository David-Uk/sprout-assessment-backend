'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { rateLimit } = require('express-rate-limit');
const config = require('./config');
const AppError = require('./utils/app-error');
const taskRoutes = require('./routes/task.routes');
const healthRoutes = require('./routes/health.routes');
const docsRoutes = require('./routes/docs.routes');
const { notFound, errorHandler } = require('./middleware/error.middleware');

const app = express();

app.disable('x-powered-by');
app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || config.corsOrigins.includes(origin)) return callback(null, true);
      return callback(new AppError('FORBIDDEN', 'Origin not allowed', 403));
    },
    methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
  })
);
app.use(express.json({ limit: '10kb' }));

// Request log: method, path, status and timing only — never bodies or headers.
if (config.nodeEnv !== 'test') {
  app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));
}

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

app.use('/health', healthRoutes);
app.use('/api/tasks', apiLimiter, taskRoutes);
app.use('/docs', docsRoutes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;
