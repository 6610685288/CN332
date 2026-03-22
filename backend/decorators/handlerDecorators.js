/**
 * Decorator pattern (functional): wrap Express handlers with cross-cutting behavior.
 * compose(A, B)(handler) === A(B(handler)) — B runs closest to the handler.
 */

function compose(...decorators) {
  return (handler) => decorators.reduceRight((acc, dec) => dec(acc), handler);
}

function withHandledErrors(handler) {
  return async (req, res, next) => {
    try {
      await Promise.resolve(handler(req, res, next));
    } catch (err) {
      console.error("[API] unhandled:", err);
      if (res.headersSent) {
        if (typeof next === "function") return next(err);
        return;
      }
      res.status(500).json({ error: "เซิร์ฟเวอร์ผิดพลาดภายใน" });
    }
  };
}

function withApiLogging(handler) {
  return async (req, res, next) => {
    const start = Date.now();
    const tag = `${req.method} ${req.originalUrl || req.url}`;
    console.log(`[API] → ${tag}`);
    try {
      await Promise.resolve(handler(req, res, next));
    } finally {
      console.log(`[API] ← ${tag} ${Date.now() - start}ms`);
    }
  };
}

const decorateApiHandler = compose(withApiLogging, withHandledErrors);

module.exports = {
  compose,
  withHandledErrors,
  withApiLogging,
  decorateApiHandler,
};
