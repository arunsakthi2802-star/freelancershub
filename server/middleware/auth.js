const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const { db, mapUser } = require('../config/db');

const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Check Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  // Check cookie
  else if (req.cookies?.token) {
    token = req.cookies.token;
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token provided');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const { data: user, error } = await db
      .from('users')
      .select('*')
      .eq('id', decoded.id)
      .single();

    if (error || !user) {
      res.status(401);
      throw new Error('Not authorized, user not found');
    }

    req.user = mapUser(user);

    if (req.user.isBanned) {
      res.status(403);
      throw new Error('Your account has been suspended. Please contact support.');
    }

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      res.status(401);
      throw new Error('Not authorized, invalid token');
    }
    if (error.name === 'TokenExpiredError') {
      res.status(401);
      throw new Error('Not authorized, token expired');
    }
    throw error;
  }
});

// Optional auth - does not throw if no token
const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.token) {
    token = req.cookies.token;
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const { data: user } = await db
        .from('users')
        .select('*')
        .eq('id', decoded.id)
        .single();
      
      req.user = mapUser(user);
    } catch (e) {
      req.user = null;
    }
  }
  next();
});

module.exports = { protect, optionalAuth };

