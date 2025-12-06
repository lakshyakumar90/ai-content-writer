import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";
const TOKEN_COOKIE = "token";

export function signToken(userId: string) {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: "7d" });
}

export function setAuthCookie(res: Response, token: string) {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie(TOKEN_COOKIE, token, {
    httpOnly: true,
    sameSite: isProduction ? "none" : "lax", // "none" required for cross-origin in production
    secure: isProduction, // true in production (HTTPS), false in development
    maxAge: 7 * 24 * 60 * 60 * 1000,
    // Add domain if needed (usually not required)
    // domain: process.env.COOKIE_DOMAIN,
  });
}

export function clearAuthCookie(res: Response) {
  const isProduction = process.env.NODE_ENV === 'production';
  res.clearCookie(TOKEN_COOKIE, {
    httpOnly: true,
    sameSite: isProduction ? "none" : "lax",
    secure: isProduction,
  });
}

export interface AuthedRequest extends Request {
  userId?: string;
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  // Try cookie first
  let token = (req as any).cookies?.[TOKEN_COOKIE];
  
  // Fallback to Authorization header
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }
  
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    req.userId = payload.sub as string;
    next();
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }
}


