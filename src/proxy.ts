import { NextRequest, NextResponse } from "next/server";
import { redis } from "./lib/redis";
import { nanoid } from "nanoid";

const ROOM_SECONDS = 60 * 10;

export async function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const match = pathname.match(/^\/room\/([^/]+)$/);
  if (!match) return NextResponse.redirect(new URL("/", req.url));

  const roomId = match[1];

  // ensure room meta exists
  const meta = await redis.hgetall(`meta:${roomId}`);
  if (!meta || Object.keys(meta).length === 0) {
    return NextResponse.redirect(new URL("/?error=room-notFound", req.url));
  }

  const connectedSetKey = `connected:${roomId}`;

  // existing token from cookie (same browser / same identity)
  const existingToken = req.cookies.get("x-auth-token")?.value;
  if (existingToken) {
    const isMember = await redis.sismember(connectedSetKey, existingToken);
    if (isMember) {
      // refresh TTLs for room/meta/connected set (optional)
      try {
        await redis.expire(connectedSetKey, ROOM_SECONDS);
        await redis.expire(`meta:${roomId}`, ROOM_SECONDS);
      } catch {
        // ignore TTL errors
      }
      return NextResponse.next();
    }
  }

  // If user is new for this room, attempt to add to the connected set
  // Create token first (we need it to add to the set atomically)
  const token = nanoid();

  // Atomically add token to set
  const added = await redis.sadd(connectedSetKey, token); // returns 1 if added, 0 if already present

  // Ensure the connected set and meta share TTL
  try {
    await redis.expire(connectedSetKey, ROOM_SECONDS);
    await redis.expire(`meta:${roomId}`, ROOM_SECONDS);
  } catch {
    // ignore TTL failures
  }

  // Count current connected users
  const count = await redis.scard(connectedSetKey);

  // If room is now over capacity, remove token and redirect
  if (count > 2) {
    // remove the token we just added
    await redis.srem(connectedSetKey, token);
    return NextResponse.redirect(new URL("/", req.url)); // or "/?error=room-full"
  }

  // OK — room has capacity; issue cookie and allow
  const response = NextResponse.next();
  response.cookies.set("x-auth-token", token, {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  return response;
}

export const config = {
  matcher: ["/room/:path*"],
};
