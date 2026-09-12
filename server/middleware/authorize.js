// Role-based access control middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      res.status(401);
      throw new Error('Not authorized');
    }

    if (!roles.includes(req.user.role)) {
      res.status(403);
      throw new Error(
        `Access denied. Role '${req.user.role}' is not authorized for this resource. Required: ${roles.join(' or ')}`
      );
    }

    next();
  };
};

module.exports = authorize;
