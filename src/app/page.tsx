"use client";
import { client } from "@/lib/client";
import { useMutation } from "@tanstack/react-query";
import { nanoid } from "nanoid";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const ANIMALS = ["wolf", "tiger", "lion"];
const STORAGE_KEY = "chat_username";
const generateUsername = (): string => {
  const word = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  return `Anonymous ${word}-${nanoid(5)}`;
};

export default function Home() {
  const [username, setUsername] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setUsername(stored);
      return;
    }
    const generated = generateUsername();
    window.localStorage.setItem(STORAGE_KEY, generated);
    setUsername(generated);
  }, []);

  const { mutate: createRoom } = useMutation({
    mutationFn: async () => {
      const res = await client.room.create.post();
      if (res?.status === 200 && res.data?.roomId) {
        router.push(`/room/${res.data.roomId}`);
      }
      return res;
    },
  });

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full md:w-md space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-green-500">
            anon_chat
          </h1>
          <p className="text-zinc-500">
            A dark chamber for self-erasing conversations
          </p>
        </div>
        <div className="border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur-md">
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="flex items-center text-zinc-500">
                Your Identity
              </label>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-zinc-950 border border-zinc-800 p-3 text-sm text-zinc-400 font-mono">
                  {username || "Generating..."}
                </div>
              </div>
            </div>
            <button
              onClick={() => createRoom()}
              className="w-full bg-zinc-100 text-black p-3 text-sm font-bold hover:bg-zinc-50 hover:text-black transition-colors mt-2 cursor-pointer disabled:opacity-50"
            >
              CREATE A SECURE ROOM
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
