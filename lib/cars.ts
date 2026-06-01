"use server";

import { prisma } from "@/lib/prisma";
import type { VariantWithModel } from "@/types/car";
import type { BuyerPersona } from "@/types/persona";
import { scoreVariants } from "@/lib/scoring";
import type { MatchedCar } from "@/types/car";

const INCLUDE_FULL = {
  model: { include: { make: true } },
  ownershipCost: true,
} as const;

export async function getAllActiveVariants(): Promise<VariantWithModel[]> {
  return prisma.variant.findMany({
    where: { isActive: true },
    include: INCLUDE_FULL,
    orderBy: { priceExshowroom: "asc" },
  }) as Promise<VariantWithModel[]>;
}

export async function getVariantById(id: string): Promise<VariantWithModel | null> {
  return prisma.variant.findUnique({
    where: { id },
    include: INCLUDE_FULL,
  }) as Promise<VariantWithModel | null>;
}

export async function getVariantsByIds(ids: string[]): Promise<VariantWithModel[]> {
  return prisma.variant.findMany({
    where: { id: { in: ids }, isActive: true },
    include: INCLUDE_FULL,
  }) as Promise<VariantWithModel[]>;
}

export async function getShortlistForPersona(persona: BuyerPersona): Promise<MatchedCar[]> {
  const variants = await getAllActiveVariants();
  return scoreVariants(variants, persona);
}
