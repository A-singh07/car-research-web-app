import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";
import { ServiceTier, BodyType, Segment, FuelType, Transmission } from "../app/generated/prisma/enums";
import data from "./seed-data/cars.json";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

type SeedMake = { name: string; countryOfOrigin: string; serviceNetworkTier: string };
type SeedModel = { makeName: string; name: string; bodyType: string; segment: string };
type SeedVariant = {
  makeName: string; modelName: string; name: string;
  fuelType: string; transmission: string;
  priceExshowroom: number; priceOnroadEstimate?: number;
  seatingCapacity: number; bootSpaceLitres?: number;
  mileageKmpl?: number; rangeKm?: number;
  powerBhp?: number; torqueNm?: number;
  groundClearanceMm?: number; turningRadiusM?: number;
  ncapRating?: number | null; airbagCount?: number;
  featuresList?: string[]; useCaseTags?: string[];
};
type SeedOwnershipCost = {
  makeName: string; variantName: string;
  serviceCostPerVisit: number; serviceIntervalKm: number;
  tyreReplacementCost: number; depreciationYear1: number;
  depreciationAnnual: number; insuranceIdvEstimate: number;
};

async function main() {
  console.log("🌱 Seeding car data...");

  // ── Makes ──────────────────────────────────────────
  const makeMap = new Map<string, string>();
  for (const make of data.makes as SeedMake[]) {
    const record = await prisma.make.upsert({
      where: { name: make.name },
      update: { countryOfOrigin: make.countryOfOrigin, serviceNetworkTier: make.serviceNetworkTier as ServiceTier },
      create: { name: make.name, countryOfOrigin: make.countryOfOrigin, serviceNetworkTier: make.serviceNetworkTier as ServiceTier },
    });
    makeMap.set(make.name, record.id);
  }
  console.log(`  ✓ ${makeMap.size} makes`);

  // ── Models ─────────────────────────────────────────
  const modelMap = new Map<string, string>();
  for (const model of data.models as SeedModel[]) {
    const makeId = makeMap.get(model.makeName);
    if (!makeId) throw new Error(`Make not found: ${model.makeName}`);
    const record = await prisma.model.upsert({
      where: { makeId_name: { makeId, name: model.name } },
      update: { bodyType: model.bodyType as BodyType, segment: model.segment as Segment },
      create: { makeId, name: model.name, bodyType: model.bodyType as BodyType, segment: model.segment as Segment },
    });
    modelMap.set(`${model.makeName}__${model.name}`, record.id);
  }
  console.log(`  ✓ ${modelMap.size} models`);

  // ── Variants ───────────────────────────────────────
  const variantMap = new Map<string, string>();
  for (const variant of data.variants as SeedVariant[]) {
    const modelId = modelMap.get(`${variant.makeName}__${variant.modelName}`);
    if (!modelId) throw new Error(`Model not found: ${variant.makeName} ${variant.modelName}`);
    const record = await prisma.variant.upsert({
      where: { modelId_name: { modelId, name: variant.name } },
      update: {
        fuelType: variant.fuelType as FuelType,
        transmission: variant.transmission as Transmission,
        priceExshowroom: variant.priceExshowroom,
        priceOnroadEstimate: variant.priceOnroadEstimate ?? null,
        seatingCapacity: variant.seatingCapacity,
        bootSpaceLitres: variant.bootSpaceLitres ?? null,
        mileageKmpl: variant.mileageKmpl ?? null,
        rangeKm: variant.rangeKm ?? null,
        powerBhp: variant.powerBhp ?? null,
        torqueNm: variant.torqueNm ?? null,
        groundClearanceMm: variant.groundClearanceMm ?? null,
        turningRadiusM: variant.turningRadiusM ?? null,
        ncapRating: variant.ncapRating ?? null,
        airbagCount: variant.airbagCount ?? null,
        featuresList: variant.featuresList ?? [],
        useCaseTags: variant.useCaseTags ?? [],
      },
      create: {
        modelId,
        name: variant.name,
        fuelType: variant.fuelType as FuelType,
        transmission: variant.transmission as Transmission,
        priceExshowroom: variant.priceExshowroom,
        priceOnroadEstimate: variant.priceOnroadEstimate ?? null,
        seatingCapacity: variant.seatingCapacity,
        bootSpaceLitres: variant.bootSpaceLitres ?? null,
        mileageKmpl: variant.mileageKmpl ?? null,
        rangeKm: variant.rangeKm ?? null,
        powerBhp: variant.powerBhp ?? null,
        torqueNm: variant.torqueNm ?? null,
        groundClearanceMm: variant.groundClearanceMm ?? null,
        turningRadiusM: variant.turningRadiusM ?? null,
        ncapRating: variant.ncapRating ?? null,
        airbagCount: variant.airbagCount ?? null,
        featuresList: variant.featuresList ?? [],
        useCaseTags: variant.useCaseTags ?? [],
      },
    });
    variantMap.set(`${variant.makeName}__${variant.name}`, record.id);
  }
  console.log(`  ✓ ${variantMap.size} variants`);

  // ── Ownership Costs ────────────────────────────────
  let costCount = 0;
  for (const cost of data.ownershipCosts as SeedOwnershipCost[]) {
    const variantId = variantMap.get(`${cost.makeName}__${cost.variantName}`);
    if (!variantId) {
      console.warn(`  ⚠ Variant not found for ownership cost: ${cost.makeName} ${cost.variantName}`);
      continue;
    }
    await prisma.ownershipCost.upsert({
      where: { variantId },
      update: {
        serviceCostPerVisit: cost.serviceCostPerVisit,
        serviceIntervalKm: cost.serviceIntervalKm,
        tyreReplacementCost: cost.tyreReplacementCost,
        depreciationYear1: cost.depreciationYear1,
        depreciationAnnual: cost.depreciationAnnual,
        insuranceIdvEstimate: cost.insuranceIdvEstimate,
      },
      create: {
        variantId,
        serviceCostPerVisit: cost.serviceCostPerVisit,
        serviceIntervalKm: cost.serviceIntervalKm,
        tyreReplacementCost: cost.tyreReplacementCost,
        depreciationYear1: cost.depreciationYear1,
        depreciationAnnual: cost.depreciationAnnual,
        insuranceIdvEstimate: cost.insuranceIdvEstimate,
      },
    });
    costCount++;
  }
  console.log(`  ✓ ${costCount} ownership cost records`);

  console.log("✅ Seed complete.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
