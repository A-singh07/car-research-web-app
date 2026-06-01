import type { FuelType, Transmission, BodyType, Segment, ServiceTier } from "@/app/generated/prisma/enums";
import type { Prisma } from "@/app/generated/prisma/client";

export type { FuelType, Transmission, BodyType, Segment, ServiceTier };

export type VariantWithModel = Prisma.VariantGetPayload<{
  include: {
    model: { include: { make: true } };
    ownershipCost: true;
  };
}>;

export interface MatchedCar {
  variant: VariantWithModel;
  matchScore: number;
  matchReason: string;
  rank: number;
}

export interface ComparisonSectionVerdict {
  section: string;
  winnerId: string | null;
  winnerName: string | null;
  verdict: string;
}
