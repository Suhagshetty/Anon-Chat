import { redis } from "@/lib/redis";
import { Elysia } from "elysia";
import { nanoid } from "nanoid";

// defining duration
const ROOM_SECONDS = 60 * 10;
// to create new rooms route
const rooms = new Elysia({ prefix: "/room" }).post("/create", async () => {
  const roomId = nanoid();
  await redis.hset(`meta:${roomId}`, {
    connected: [],
    createdAt: Date.now(),
  });
  // auto deletion of room
  await redis.expire(`meta:${roomId}`, ROOM_SECONDS);
  return { roomId };
  
});

const app = new Elysia({ prefix: "/api" }).use(rooms).get("/user", {
  user: { name: "John" },
});

export const GET = app.fetch;
export const POST = app.fetch;

// Export an uppercase App type for consumers like eden/treaty clients
export type App = typeof app;
