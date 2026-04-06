const requestLogger = (req, res, next) => {
  const timestamp = new Date().toISOString().slice(11, 23);
  const method = req.method;
  const url = req.originalUrl;

  // Log request
  console.log(`\n📥 [${timestamp}] ${method} ${url}`);

  if (req.user) {
    console.log(`   👤 User: ${req.user.name} (${req.user.role})`);
  }

  if (Object.keys(req.body || {}).length > 0) {
    const body = { ...req.body };
    // Mask sensitive fields
    if (body.password) body.password = '***';
    if (body.code) body.code = `[${body.code.length} chars]`;
    console.log(`   📦 Body:`, JSON.stringify(body, null, 2));
  }

  if (Object.keys(req.query || {}).length > 0) {
    console.log(`   🔍 Query:`, req.query);
  }

  // Log response
  const originalJson = res.json.bind(res);
  res.json = (data) => {
    const status = res.statusCode;
    const icon = status >= 400 ? '❌' : '✅';
    console.log(`   ${icon} Response ${status}:`, JSON.stringify(data, null, 2).slice(0, 300));
    return originalJson(data);
  };

  next();
};

module.exports = requestLogger;
