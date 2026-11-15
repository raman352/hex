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

interface StoredUserRecord {
  id: string;
  fullName: string;
  email: string;
  role: ServerUserRole;
  passwordHash: string;
  createdAt: string;
  isDemo: boolean;
}

const DATA_DIR = path.resolve(process.cwd(), '.data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
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

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash || !storedHash.includes(':')) return false;
  const [salt, hashHex] = storedHash.split(':');
  if (!salt || !hashHex) return false;
  try {
    const derivedBuf = crypto.scryptSync(password, salt, 64);
    const storedBuf = Buffer.from(hashHex, 'hex');
    if (derivedBuf.length !== storedBuf.length) return false;
    return crypto.timingSafeEqual(derivedBuf, storedBuf);
  } catch {
    return false;
  }
}

function readUsersFile(): StoredUserRecord[] {
  ensureDataDir();
  if (!fs.existsSync(USERS_FILE)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(USERS_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (u): u is StoredUserRecord =>
        Boolean(u) &&
        typeof u.id === 'string' &&
        typeof u.email === 'string' &&
        typeof u.fullName === 'string' &&
        (u.role === 'customer' || u.role === 'admin') &&
        typeof u.passwordHash === 'string'
    );
  } catch {
    return [];
  }
}

function writeUsersFile(users: StoredUserRecord[]): void {
  ensureDataDir();
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), {
    encoding: 'utf8',
    mode: 0o600,
  });
}

function ensureSeedUsers(): StoredUserRecord[] {
  const users = readUsersFile();
  let changed = false;
  const nowIso = new Date().toISOString();

  // Ensure standard demo customer account has deterministic demo credential
  const demoCustomerIdx = users.findIndex((u) => u.id === 'usr-demo-customer');
  if (demoCustomerIdx === -1) {
    users.push({
      id: 'usr-demo-customer',
      fullName: 'Priya Sharma',
      email: 'priya.demo@techcare.example',
      role: 'customer',
      passwordHash: hashPassword('Customer@1234'),
      createdAt: nowIso,
      isDemo: true,
    });
    changed = true;
  } else if (users[demoCustomerIdx].isDemo && !verifyPassword('Customer@1234', users[demoCustomerIdx].passwordHash)) {
    users[demoCustomerIdx] = {
      ...users[demoCustomerIdx],
      passwordHash: hashPassword('Customer@1234'),
    };
    changed = true;
  }

  // Ensure standard demo admin account has deterministic demo credential
  const demoAdminIdx = users.findIndex((u) => u.id === 'usr-demo-admin');
  if (demoAdminIdx === -1) {
    users.push({
      id: 'usr-demo-admin',
      fullName: 'TechCare Admin (Demo)',
      email: 'admin.demo@techcare.example',
      role: 'admin',
      passwordHash: hashPassword('Admin@1234'),
      createdAt: nowIso,
      isDemo: true,
    });
    changed = true;
  } else if (users[demoAdminIdx].isDemo && !verifyPassword('Admin@1234', users[demoAdminIdx].passwordHash)) {
    users[demoAdminIdx] = {
      ...users[demoAdminIdx],
      passwordHash: hashPassword('Admin@1234'),
    };
    changed = true;
  }

  // Sync optional environment-configured administrator account if provided
  const envAdminEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const envAdminPassword = process.env.ADMIN_PASSWORD || '';
  if (
    envAdminEmail &&
    envAdminEmail !== 'admin@techcare.local' &&
    envAdminPassword &&
    envAdminPassword !== 'REPLACE_WITH_STRONG_ADMIN_PASSWORD'
  ) {
    const envAdminIdx = users.findIndex((u) => u.id === 'usr-env-admin');
    if (envAdminIdx === -1) {
      users.push({
        id: 'usr-env-admin',
        fullName: 'TechCare Administrator',
        email: envAdminEmail,
        role: 'admin',
        passwordHash: hashPassword(envAdminPassword),
        createdAt: nowIso,
        isDemo: false,
      });
      changed = true;
    } else if (
      users[envAdminIdx].email !== envAdminEmail ||
      !verifyPassword(envAdminPassword, users[envAdminIdx].passwordHash)
    ) {
      users[envAdminIdx] = {
        ...users[envAdminIdx],
        email: envAdminEmail,
        role: 'admin',
        passwordHash: hashPassword(envAdminPassword),
      };
      changed = true;
    }
  }

  if (changed) {
    writeUsersFile(users);
  }
  return users;
}

function toSessionUser(record: StoredUserRecord): SessionUser {
  return {
    id: record.id,
    fullName: record.fullName,
    email: record.email,
    role: record.role,
    isDemo: Boolean(record.isDemo),
  };
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
    if (typeof decoded.id !== 'string' || typeof decoded.email !== 'string') {
      return null;
    }
    return {
      id: decoded.id,
      fullName: String(decoded.fullName || ''),
      email: decoded.email,
      role: decoded.role,
      isDemo: Boolean(decoded.isDemo),
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

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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
      error: 'Authentication required. Please sign in to continue.',
    });
    return;
  }
  (req as Request & { authUser?: SessionUser }).authUser = user;
  next();
}

export function requireCustomer(req: Request, res: Response, next: NextFunction): void {
  const user = getSessionUser(req);
  if (!user) {
    res.status(401).json({
      code: 'SESSION_EXPIRED',
      error: 'Authentication required. Please sign in as a customer.',
    });
    return;
  }
  if (user.role !== 'customer') {
    res.status(403).json({
      code: 'FORBIDDEN_ROLE',
      error: 'Access denied. Customer Chat is restricted to customer accounts.',
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
      error: 'Authentication required. Please sign in as an administrator.',
    });
    return;
  }
  if (user.role !== 'admin') {
    res.status(403).json({
      code: 'FORBIDDEN_ROLE',
      error: 'Access denied. Administrator permissions are required.',
    });
    return;
  }
  (req as Request & { authUser?: SessionUser }).authUser = user;
  next();
}

export function registerAuthRoutes(app: import('express').Express): void {
  ensureSeedUsers();

  app.get('/api/auth/me', (req: Request, res: Response) => {
    const user = getSessionUser(req);
    if (!user) {
      res.status(401).json({ error: 'No active authenticated session.' });
      return;
    }
    res.json({ user });
  });

  app.post('/api/auth/register', (req: Request, res: Response) => {
    const { fullName, email, password } = req.body ?? {};
    const cleanName = typeof fullName === 'string' ? fullName.trim() : '';
    const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const rawPassword = typeof password === 'string' ? password : '';

    if (cleanName.length < 2 || cleanName.length > 80) {
      res.status(400).json({ error: 'Please enter your full name (2–80 characters).' });
      return;
    }
    if (!isValidEmail(cleanEmail)) {
      res.status(400).json({ error: 'Please enter a valid email address.' });
      return;
    }
    if (rawPassword.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      return;
    }

    const users = ensureSeedUsers();
    if (users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      res.status(409).json({ error: 'An account with this email already exists. Please sign in.' });
      return;
    }

    // Security: customer registration ALWAYS assigns role 'customer' server-side
    const newRecord: StoredUserRecord = {
      id: `usr-${crypto.randomUUID()}`,
      fullName: cleanName,
      email: cleanEmail,
      role: 'customer',
      passwordHash: hashPassword(rawPassword),
      createdAt: new Date().toISOString(),
      isDemo: false,
    };

    users.push(newRecord);
    writeUsersFile(users);

    const sessionUser = toSessionUser(newRecord);
    const sessionToken = setSessionCookie(req, res, sessionUser);
    res.status(201).json({ user: sessionUser, sessionToken });
  });

  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { email, password, portal } = req.body ?? {};
    const cleanIdentifier = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const rawPassword = typeof password === 'string' ? password : '';
    const targetPortal: ServerUserRole = portal === 'admin' ? 'admin' : 'customer';

    if (!cleanIdentifier || !rawPassword) {
      res.status(400).json({ error: 'Please enter both your email and password.' });
      return;
    }

    const users = ensureSeedUsers();
    const matched = users.find((u) => u.email.toLowerCase() === cleanIdentifier);

    if (!matched || !verifyPassword(rawPassword, matched.passwordHash)) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    // Enforce strict portal/role separation server-side
    if (targetPortal === 'admin' && matched.role !== 'admin') {
      res.status(403).json({
        error: 'Access denied. This account does not have Administrator permissions.',
      });
      return;
    }

    if (targetPortal === 'customer' && matched.role !== 'customer') {
      res.status(403).json({
        error: 'Administrator accounts must sign in through the Administrator Sign In tab.',
      });
      return;
    }

    const sessionUser = toSessionUser(matched);
    const sessionToken = setSessionCookie(req, res, sessionUser);
    res.json({ user: sessionUser, sessionToken });
  });

  app.post('/api/auth/forgot-password', (req: Request, res: Response) => {
    const { email } = req.body ?? {};
    const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    if (!isValidEmail(cleanEmail)) {
      res.status(400).json({ error: 'Please enter a valid email address.' });
      return;
    }
    res.json({
      message:
        'If an account exists for that email, password reset instructions have been prepared. For prototype testing, you may also register a new customer account or use the demo customer login.',
    });
  });

  app.post('/api/auth/logout', (req: Request, res: Response) => {
    clearSessionCookie(req, res);
    res.json({ ok: true });
  });

  app.get('/api/admin/verify', requireAdmin, (req: Request, res: Response) => {
    const user = (req as Request & { authUser?: SessionUser }).authUser;
    res.json({ verified: true, user });
  });

  app.get('/api/admin/customers', requireAdmin, (_req: Request, res: Response) => {
    const users = ensureSeedUsers();
    const customers = users
      .filter((u) => u.role === 'customer')
      .map((u) => ({
        id: u.id,
        fullName: u.fullName,
        email: u.email,
        createdAt: u.createdAt,
        isDemo: Boolean(u.isDemo),
      }));
    res.json({ customers });
  });
}
