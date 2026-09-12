const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || 'Internal Server Error';

  // Postgres unique key violation (e.g. email already exists)
  if (err.code === '23505') {
    statusCode = 400;
    message = 'Resource already exists';
  }

  // Postgres invalid UUID/data format (cast error)
  if (err.code === '22P02') {
    statusCode = 404;
    message = 'Resource not found: invalid ID format';
  }

  // Postgres foreign key violation
  if (err.code === '23503') {
    statusCode = 400;
    message = 'Foreign key constraint failed: related resource not found';
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 400;
    message = 'File size too large. Maximum allowed size is 10MB.';
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    statusCode = 400;
    message = 'Unexpected file field';
  }

  // Log error to console/terminal
  console.error('🔥 Backend Error:', err);

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
