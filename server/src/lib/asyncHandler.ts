import type { NextFunction, Request, Response } from 'express'

type Handler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>

/** Envuelve un handler async para que los errores lleguen al middleware de error. */
export function asyncHandler(fn: Handler) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next)
  }
}
