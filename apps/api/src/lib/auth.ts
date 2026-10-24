import { createHmac, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { json } from "./response";
import { USER_ROLES, type RouteHandler, type TokenPayload, type UserRole } from "./types";

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number
) => Promise<Buffer>;

// ---------- password ----------
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scryptAsync(password, salt, 64);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, saltHex, hashHex] = stored.split("$");
  if (scheme !== "scrypt" || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = await scryptAsync(password, Buffer.from(saltHex, "hex"), expected.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

// ---------- JWT (HS256) ----------
function secret(): string {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("JWT_SECRET is not set");
  return s;
}

const b64 = (v: string) => Buffer.from(v).toString("base64url");

function sign(data: string): Buffer {
  return createHmac("sha256", secret()).update(data).digest();
}

export function signToken(sub: string, role: UserRole, ttlSeconds = 8 * 3600): string {
  const header = b64(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload: TokenPayload = { sub, role, exp: Math.floor(Date.now() / 1000) + ttlSeconds };
  const body = b64(JSON.stringify(payload));
  const sig = sign(`${header}.${body}`).toString("base64url");
  return `${header}.${body}.${sig}`;
}

export function verifyToken(token: string): TokenPayload | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const expected = sign(`${parts[0]}.${parts[1]}`);
  const given = Buffer.from(parts[2], "base64url");
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  try {
    const p = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8")) as TokenPayload;
    if (
      typeof p.sub !== "string" ||
      !USER_ROLES.includes(p.role) ||
      typeof p.exp !== "number" ||
      p.exp < Math.floor(Date.now() / 1000)
    ) return null;
    return p;
  } catch {
    return null;
  }
}

// ---------- middleware ----------
// ใช้ครอบ handler ที่ต้อง login: handler: withAuth(async (ctx) => { ctx.user ... })
export function withAuth(handler: RouteHandler): RouteHandler {
  return async (ctx) => {
    const header = ctx.event.headers?.authorization ?? ctx.event.headers?.Authorization ?? "";
    const m = /^Bearer (.+)$/i.exec(header);
    const user = m ? verifyToken(m[1]) : null;
    if (!user) return json(401, { message: "Unauthorized" });
    return handler({ ...ctx, user });
  };
}

export function withRoleAuth(roles: readonly UserRole[], handler: RouteHandler): RouteHandler {
  return withAuth(async (ctx) => {
    if (!ctx.user || !roles.includes(ctx.user.role)) {
      return json(403, { message: "Forbidden" });
    }
    return handler(ctx);
  });
}