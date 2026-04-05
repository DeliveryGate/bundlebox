export interface RunInput {
  cart: {
    lines: CartLine[];
  };
  discountNode: {
    metafield: { value: string } | null;
  };
}

export interface CartLine {
  quantity: number;
  cost: {
    amountPerQuantity: { amount: string; currencyCode: string };
  };
  merchandise: ProductVariantMerchandise | OtherMerchandise;
}

export interface ProductVariantMerchandise {
  __typename: "ProductVariant";
  id: string;
  product: {
    id: string;
    inAnyCollection: { value: boolean };
    hasAnyTag: { value: boolean };
  };
}

export interface OtherMerchandise {
  __typename: string;
}

export interface BundleConfig {
  bundles: Bundle[];
}

export interface Bundle {
  id: string;
  name: string;
  type: "fixed" | "mix_match" | "volume";
  status: "active" | "draft";
  productIds: string[];
  collectionId?: string;
  discountType: "percentage" | "fixed_amount";
  discountValue: number;
  minQuantity: number;
  maxQuantity?: number;
  bundlePrice?: number;
  originalPrice?: number;
  volumeTiers?: VolumeTier[];
}

export interface VolumeTier {
  quantity: number;
  discount_percentage: number;
}

export interface FunctionRunResult {
  discountApplicationStrategy: "FIRST" | "MAXIMUM";
  discounts: Discount[];
}

export interface Discount {
  targets: DiscountTarget[];
  value: DiscountValue;
  message: string;
}

export interface DiscountTarget {
  productVariant: { id: string };
}

export interface DiscountValue {
  percentage?: { value: string };
  fixedAmount?: { amount: string };
}
