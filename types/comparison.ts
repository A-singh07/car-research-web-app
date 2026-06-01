import type { VariantWithModel } from "./car";
import type { BuyerPersona } from "./persona";

export interface ComparisonData {
  shareToken: string;
  variants: VariantWithModel[];
  persona: BuyerPersona | null;
  createdAt: Date;
}
