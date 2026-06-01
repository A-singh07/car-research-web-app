"use server";

import { prisma } from "@/lib/prisma";
import type { User } from "@/app/generated/prisma/client";

export async function getOrCreateAnonymousUser(clientUuid: string): Promise<User> {
  const email = `anon-${clientUuid}@local`;
  return prisma.user.upsert({
    where: { email },
    update: {},
    create: { email },
  });
}
