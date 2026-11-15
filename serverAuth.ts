import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import type { NextFunction, Request, Response } from 'express';

export type ServerUserRole = 'customer' | 'admin';

export interface SessionUser {
  id: string;
  fullName: string;
  email: string;
  role: ServerUserRole;
  isDemo: boolean;
}

const DATA_DIR = path.resolve(process.cwd(), '.data');
const SESSION_COOKIE_NAME = 'tc_deskpilot_session';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const SESSION_SECRET_FILE = path.join(DATA_DIR, 'session.secret');

let cachedRuntimeSecret: string | null = null;

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function getSessionSecret(): string {
  const configured = process.env.AUTH_SESSION_SECRET;
  if (configured && configured !== 'REPLACE_WITH_LONG_RANDOM_SECRET' && configured.length >= 16) {
    return configured;
  }
  if (cachedRuntimeSecret) {
    return cachedRuntimeSecret;
  }
  ensureDataDir();
  try {
    if (fs.existsSync(SESSION_SECRET_FILE)) {
      const existing = fs.readFileSync(SESSION_SECRET_FILE, 'utf8').trim();
      if (existing.length >= 32) {
        cachedRuntimeSecret = existing;
        return existing;
      }
    }
    const generated = crypto.randomBytes(32).toString('hex');
    fs.writeFileSync(SESSION_SECRET_FILE, generated, { encoding: 'utf8', mode: 0o600 });
    cachedRuntimeSecret = generated;
    return generated;
  } catch {
    cachedRuntimeSecret = crypto.randomBytes(32).toString('hex');
    return cachedRuntimeSecret;
  }
}

function signSessionToken(user: SessionUser): string {
  const payload = {
    ...user,
    exp: Date.now() + SESSION_TTL_MS,
  };
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto
    .createHmac('sha256', getSessionSecret())
    .update(encoded)
    .digest('base64url');
  return `${encoded}.${sig}`;
}

function verifySessionToken(token: string): SessionUser | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [encoded, sig] = parts;
  if (!encoded || !sig) return null;

  const expectedSig = crypto
    .createHmac('sha256', getSessionSecret())
    .update(encoded)
    .digest('base64url');

  const sigBuf = Buffer.from(sig, 'utf8');
  const expectedBuf = Buffer.from(expectedSig, 'utf8');
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }

  try {
    const decoded = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    if (!decoded || typeof decoded.exp !== 'number' || decoded.exp < Date.now()) {
      return null;
    }
    if (decoded.role !== 'customer' && decoded.role !== 'admin') {
      return null;
    }
    return {
      id: String(decoded.id),
      fullName: String(decoded.fullName),
      email: String(decoded.email),
      role: decoded.role,
      isDemo: true,
    };
  } catch {
    return null;
  }
}

function parseCookies(cookieHeader?: string): Record<string, string> {
  const result: Record<string, string> = {};
  if (!cookieHeader) return result;
  const pairs = cookieHeader.split(';');
  for (const pair of pairs) {
    const eqIdx = pair.indexOf('=');
    if (eqIdx < 0) continue;
    const key = pair.slice(0, eqIdx).trim();
    const val = pair.slice(eqIdx + 1).trim();
    if (key) {
      result[key] = decodeURIComponent(val);
    }
  }
  return result;
}

function setSessionCookie(req: Request, res: Response, user: SessionUser): string {
  const token = signSessionToken(user);
  const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https';
  res.cookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: isHttps ? 'none' : 'lax',
    secure: isHttps,
    path: '/',
    maxAge: SESSION_TTL_MS,
  });
  return token;
}

function clearSessionCookie(req: Request, res: Response): void {
  const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https';
  res.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    sameSite: isHttps ? 'none' : 'lax',
    secure: isHttps,
    path: '/',
  });
}

function toDemoSlug(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'guest';
}

export function getSessionUser(req: Request): SessionUser | null {
  const authHeader = req.headers.authorization;
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    const bearerToken = authHeader.slice(7).trim();
    if (bearerToken) {
      const verified = verifySessionToken(bearerToken);
      if (verified) return verified;
    }
  }

  const cookies = parseCookies(req.headers.cookie);
  const cookieToken = cookies[SESSION_COOKIE_NAME];
  if (!cookieToken) return null;
  return verifySessionToken(cookieToken);
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const user = getSessionUser(req);
  if (!user) {
    res.status(401).json({
      code: 'SESSION_EXPIRED',
      error: 'Demo session expired. Please select Customer Demo or Admin Demo to continue.',
    });
    return;
  }
  (req as Request & { authUser?: SessionUser }).authUser = user;
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const user = getSessionUser(req);
  if (!user) {
    res.status(401).json({
      code: 'SESSION_EXPIRED',
      error: 'Demo session required.',
    });
    return;
  }
  if (user.role !== 'admin') {
    res.status(403).json({ error: 'Admin Demo mode required.' });
    return;
  }
  (req as Request & { authUser?: SessionUser }).authUser = user;
  next();
}

export function registerAuthRoutes(app: import('express').Express): void {
  app.get('/api/auth/me', (req: Request, res: Response) => {
    const user = getSessionUser(req);
    if (!user) {
      res.status(401).json({ error: 'No active demo session' });
      return;
    }
    res.json({ user });
  });

  app.post('/api/auth/demo', (req: Request, res: Response) => {
    const { portal, demoName } = req.body ?? {};
    const targetRole: ServerUserRole = portal === 'admin' ? 'admin' : 'customer';

    if (targetRole === 'admin') {
      const adminUser: SessionUser = {
        id: 'usr-demo-admin',
        fullName: 'TechCare Admin (Demo)',
        email: 'admin.demo@techcare.example',
        role: 'admin',
        isDemo: true,
      };
      const sessionToken = setSessionCookie(req, res, adminUser);
      res.json({ user: adminUser, sessionToken });
      return;
    }

    const rawName = typeof demoName === 'string' ? demoName.trim().slice(0, 60) : '';
    const cleanName = rawName.length >= 2 ? rawName : 'Priya Sharma';
    const slug = toDemoSlug(cleanName);

    const customerUser: SessionUser = {
      id: cleanName.toLowerCase() === 'priya sharma' ? 'usr-demo-customer' : `usr-demo-${slug}`,
      fullName: cleanName,
      email: `${slug}.demo@techcare.example`,
      role: 'customer',
      isDemo: true,
    };

    const sessionToken = setSessionCookie(req, res, customerUser);
    res.json({ user: customerUser, sessionToken });
  });

  app.post('/api/auth/logout', (req: Request, res: Response) => {
    clearSessionCookie(req, res);
    res.json({ ok: true });
  });

  app.get('/api/admin/verify', requireAdmin, (req: Request, res: Response) => {
    const user = (req as Request & { authUser?: SessionUser }).authUser;
    res.json({ verified: true, user });
  });
}
