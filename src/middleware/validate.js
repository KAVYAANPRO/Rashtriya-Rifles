module.exports = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(422).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: result.error.errors[0].message, statusCode: 422 },
    });
  }
  req.body = result.data;
  next();
};
