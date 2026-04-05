import { describe, it, expect } from "vitest";
import { run } from "./index";
import type { RunInput } from "../generated/api";

function makeLine(productId: string, variantId: string, quantity: number, hasTag = true): any {
  return { quantity, cost: { amountPerQuantity: { amount: "10.00", currencyCode: "GBP" } }, merchandise: { __typename: "ProductVariant", id: variantId, product: { id: productId, inAnyCollection: { value: true }, hasAnyTag: { value: hasTag } } } };
}

function makeInput(lines: any[], bundles: any[]): RunInput {
  return { cart: { lines }, discountNode: { metafield: { value: JSON.stringify({ bundles }) } } };
}

describe("Bundle Discount Function", () => {
  it("returns no discount when no config", () => {
    const input: RunInput = { cart: { lines: [] }, discountNode: { metafield: null } };
    expect(run(input).discounts).toHaveLength(0);
  });

  describe("Fixed bundles", () => {
    const bundle = { id: "1", name: "Starter Kit", type: "fixed", status: "active", productIds: ["p1", "p2", "p3"], discountType: "percentage", discountValue: 15, minQuantity: 1 };

    it("applies discount when all products present", () => {
      const input = makeInput([makeLine("p1", "v1", 1), makeLine("p2", "v2", 1), makeLine("p3", "v3", 1)], [bundle]);
      const result = run(input);
      expect(result.discounts).toHaveLength(1);
      expect(result.discounts[0].message).toContain("Starter Kit");
    });

    it("no discount when missing a product", () => {
      const input = makeInput([makeLine("p1", "v1", 1), makeLine("p2", "v2", 1)], [bundle]);
      expect(run(input).discounts).toHaveLength(0);
    });
  });

  describe("Mix and match", () => {
    const bundle = { id: "2", name: "Pick 3", type: "mix_match", status: "active", productIds: [], discountType: "percentage", discountValue: 20, minQuantity: 3 };

    it("applies discount at minimum quantity", () => {
      const input = makeInput([makeLine("p1", "v1", 2), makeLine("p2", "v2", 1)], [bundle]);
      const result = run(input);
      expect(result.discounts).toHaveLength(1);
      expect(result.discounts[0].message).toContain("20%");
    });

    it("no discount below minimum", () => {
      const input = makeInput([makeLine("p1", "v1", 1), makeLine("p2", "v2", 1)], [bundle]);
      expect(run(input).discounts).toHaveLength(0);
    });
  });

  describe("Volume bundles", () => {
    const bundle = { id: "3", name: "Volume", type: "volume", status: "active", productIds: ["p1"], discountType: "percentage", discountValue: 0, minQuantity: 3, volumeTiers: [{ quantity: 10, discount_percentage: 20 }, { quantity: 5, discount_percentage: 15 }, { quantity: 3, discount_percentage: 10 }] };

    it("applies correct tier for quantity 3", () => {
      const input = makeInput([makeLine("p1", "v1", 3)], [bundle]);
      const result = run(input);
      expect(result.discounts).toHaveLength(1);
      expect(result.discounts[0].value.percentage.value).toBe("10");
    });

    it("applies correct tier for quantity 5", () => {
      const input = makeInput([makeLine("p1", "v1", 5)], [bundle]);
      expect(run(input).discounts[0].value.percentage.value).toBe("15");
    });

    it("applies correct tier for quantity 10", () => {
      const input = makeInput([makeLine("p1", "v1", 10)], [bundle]);
      expect(run(input).discounts[0].value.percentage.value).toBe("20");
    });

    it("no discount below minimum tier", () => {
      const input = makeInput([makeLine("p1", "v1", 2)], [bundle]);
      expect(run(input).discounts).toHaveLength(0);
    });

    it("ignores non-matching products", () => {
      const input = makeInput([makeLine("p2", "v2", 10)], [bundle]);
      expect(run(input).discounts).toHaveLength(0);
    });
  });

  it("ignores draft bundles", () => {
    const bundle = { id: "4", name: "Draft", type: "fixed", status: "draft", productIds: ["p1"], discountType: "percentage", discountValue: 10, minQuantity: 1 };
    const input = makeInput([makeLine("p1", "v1", 1)], [bundle]);
    expect(run(input).discounts).toHaveLength(0);
  });
});
