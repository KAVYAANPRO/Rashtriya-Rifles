module.exports = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const firstError = result.error?.errors?.[0];
    const message = firstError ? `${firstError.path.join('.')}: ${firstError.message}` : 'Validation error';
    return res.status(422).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message, statusCode: 422 },
    });
  }
  req.body = result.data;
  next();
};
