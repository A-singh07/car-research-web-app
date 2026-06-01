"use server";

import { prisma } from "@/lib/prisma";
import type { BuyerPersona } from "@/types/persona";

function generateShareToken(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export async function createComparison(
  variantIds: string[],
  persona: BuyerPersona | null,
  userId: string | null,
  profileId: string | null
) {
  const shareToken = generateShareToken();

  const comparison = await prisma.comparison.create({
    data: {
      userId: userId ?? undefined,
      profileId: profileId ?? undefined,
      shareToken,
      comparisonItems: {
        create: variantIds.slice(0, 4).map((variantId, index) => ({
          variantId,
          position: index + 1,
        })),
      },
    },
    include: { comparisonItems: true },
  });

  return { shareToken: comparison.shareToken, id: comparison.id };
}

export async function getComparisonByToken(shareToken: string) {
  return prisma.comparison.findUnique({
    where: { shareToken },
    include: {
      comparisonItems: {
        orderBy: { position: "asc" },
        include: {
          variant: {
            include: { model: { include: { make: true } }, ownershipCost: true },
          },
        },
      },
      buyerProfile: true,
    },
  });
}
