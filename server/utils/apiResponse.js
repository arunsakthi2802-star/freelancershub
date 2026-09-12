const successResponse = (res, data = {}, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({ success: true, message, ...data });
};

const errorResponse = (res, message = 'Error', statusCode = 400) => {
  return res.status(statusCode).json({ success: false, message });
};

const paginatedResponse = (res, data, total, page, limit, message = 'Success') => {
  return res.status(200).json({
    success: true,
    message,
    count: data.length,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / limit),
    data,
  });
};

module.exports = { successResponse, errorResponse, paginatedResponse };
