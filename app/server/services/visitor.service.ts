import {
  VISITOR_COOKIE,
  VISITOR_COOKIE_MAX_AGE,
} from "~/shared/constants";
import { randomId, randomToken, sha256Hex } from "~/shared/crypto";

import { VisitorRepository } from "../repositories/visitor.repository";

export interface VisitorContext {
  visitorId: string;
  ipHash: string | null;
  setCookie: string | null;
  countryCode: string | null;
  deviceType: string;
  userAgentFamily: string;
}

export class VisitorService {
  private readonly repository: VisitorRepository;

  constructor(
    database: D1Database,
    private readonly env: Env,
  ) {
    this.repository = new VisitorRepository(database);
  }

  async resolve(request: Request): Promise<VisitorContext> {
    const now = new Date().toISOString();
    const existingToken = readCookie(request.headers.get("cookie"), VISITOR_COOKIE);
    const token = existingToken ?? randomToken();
    const tokenHash = await sha256Hex(
      `${this.env.ANONYMOUS_HASH_SALT ?? "local-anonymous-salt"}:${token}`,
    );
    const countryCode = readCountry(request);
    const userAgent = request.headers.get("user-agent") ?? "";
    const deviceType = classifyDevice(userAgent);
    const userAgentFamily = classifyBrowser(userAgent);

    let visitor = await this.repository.findByTokenHash(tokenHash);
    if (visitor) {
      await this.repository.touch(visitor.id, now);
    } else {
      visitor = await this.repository.create({
        id: randomId(),
        tokenHash,
        countryCode,
        deviceType,
        now,
      });
    }

    if (!visitor) {
      throw new Error("VISITOR_CREATE_FAILED");
    }

    const connectingIp = request.headers.get("cf-connecting-ip");
    const ipHash = connectingIp
      ? await sha256Hex(
          `${this.env.IP_HASH_SALT ?? "local-ip-salt"}:${new Date()
            .toISOString()
            .slice(0, 10)}:${connectingIp}`,
        )
      : null;

    return {
      visitorId: visitor.id,
      ipHash,
      setCookie: existingToken ? null : serializeVisitorCookie(token),
      countryCode,
      deviceType,
      userAgentFamily,
    };
  }
}

function readCookie(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) {
    return null;
  }

  for (const part of cookieHeader.split(";")) {
    const [key, ...valueParts] = part.trim().split("=");
    if (key === name) {
      try {
        return decodeURIComponent(valueParts.join("="));
      } catch {
        return null;
      }
    }
  }

  return null;
}

function serializeVisitorCookie(token: string): string {
  return `${VISITOR_COOKIE}=${encodeURIComponent(
    token,
  )}; Max-Age=${VISITOR_COOKIE_MAX_AGE}; Path=/; HttpOnly; Secure; SameSite=Lax`;
}

function readCountry(request: Request): string | null {
  const cfCountry = request.headers.get("cf-ipcountry");
  return cfCountry && cfCountry.length === 2 ? cfCountry : null;
}

function classifyDevice(userAgent: string): string {
  if (/ipad|tablet/iu.test(userAgent)) {
    return "tablet";
  }
  if (/mobile|iphone|android/iu.test(userAgent)) {
    return "mobile";
  }
  return userAgent ? "desktop" : "unknown";
}

function classifyBrowser(userAgent: string): string {
  if (/edg\//iu.test(userAgent)) return "Edge";
  if (/chrome\//iu.test(userAgent)) return "Chrome";
  if (/firefox\//iu.test(userAgent)) return "Firefox";
  if (/safari\//iu.test(userAgent)) return "Safari";
  return "Other";
}
