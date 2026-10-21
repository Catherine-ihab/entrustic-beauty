import { createApp } from '../main';

/**
 * Vercel serverless entry point.
 *
 * The function gets one invocation per request, but the Nest application must
 * be created once per cold start and then reused — hence the memoised promise.
 *
 * Kept inside the API source tree (rather than in the root `api/` folder) so
 * `nest build` compiles it together with the rest of the app. Bundling then
 * happens from the compiled JavaScript, which already carries the
 * `design:paramtypes` metadata NestJS needs for dependency injection.
 */
type ExpressHandler = (req: unknown, res: unknown) => unknown;

let handlerPromise: Promise<ExpressHandler> | null = null;

function getHandler(): Promise<ExpressHandler> {
  if (!handlerPromise) {
    handlerPromise = (async () => {
      const app = await createApp();
      // Nest only mounts its router — and every global guard, filter and
      // interceptor — during init(). `listen()` would normally call it, but a
      // serverless function must not open a port. Skipping this makes requests
      // reach Express and fall through to its own 404 handler.
      await app.init();
      // Express instance Nest created internally: a plain `(req, res)` listener.
      return app.getHttpAdapter().getInstance() as ExpressHandler;
    })().catch((err) => {
      // Never cache a failed boot — the next invocation should retry.
      handlerPromise = null;
      throw err;
    });
  }
  return handlerPromise;
}

module.exports = async (req: unknown, res: unknown) => {
  const expressApp = await getHandler();
  return expressApp(req, res);
};
