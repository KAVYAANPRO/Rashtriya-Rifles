module.exports = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    // Zod v4 exposes `issues`; v3 exposed `errors`. Support both.
    const issues = result.error?.issues || result.error?.errors || [];
    const first = issues[0];
    const message = first
      ? `${(first.path || []).join('.') || 'body'}: ${first.message}`
      : 'Validation error';
    return res.status(422).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message, statusCode: 422 },
    });
  }
  req.body = result.data;
  next();
};
