import type { RunInput, FunctionRunResult, Bundle, CartLine } from "../generated/api";

const EMPTY: FunctionRunResult = { discountApplicationStrategy: "MAXIMUM", discounts: [] };

export function run(input: RunInput): FunctionRunResult {
  const configRaw = input.discountNode.metafield?.value;
  if (!configRaw) return EMPTY;

  let config;
  try { config = JSON.parse(configRaw); } catch { return EMPTY; }

  const bundles: Bundle[] = (config.bundles || []).filter((b: Bundle) => b.status === "active");
  if (bundles.length === 0) return EMPTY;

  const discounts: FunctionRunResult["discounts"] = [];

  for (const bundle of bundles) {
    if (bundle.type === "fixed") {
      const result = applyFixedBundle(bundle, input.cart.lines);
      if (result) discounts.push(result);
    } else if (bundle.type === "mix_match") {
      const result = applyMixMatchBundle(bundle, input.cart.lines);
      if (result) discounts.push(result);
    } else if (bundle.type === "volume") {
      const results = applyVolumeBundle(bundle, input.cart.lines);
      discounts.push(...results);
    }
  }

  if (discounts.length === 0) return EMPTY;
  return { discountApplicationStrategy: "MAXIMUM", discounts };
}

function applyFixedBundle(bundle: Bundle, lines: CartLine[]) {
  const cartProductIds = new Set<string>();
  const variantTargets: { productVariant: { id: string } }[] = [];

  for (const line of lines) {
    if (line.merchandise.__typename !== "ProductVariant") continue;
    cartProductIds.add(line.merchandise.product.id);
    if (bundle.productIds.includes(line.merchandise.product.id)) {
      variantTargets.push({ productVariant: { id: line.merchandise.id } });
    }
  }

  const allPresent = bundle.productIds.every(pid => cartProductIds.has(pid));
  if (!allPresent || variantTargets.length === 0) return null;

  if (bundle.discountType === "percentage") {
    return {
      targets: variantTargets,
      value: { percentage: { value: String(bundle.discountValue) } },
      message: `${bundle.name} — Bundle Price Applied`,
    };
  }

  // Fixed amount discount split across items
  const perItem = (bundle.discountValue / variantTargets.length).toFixed(2);
  return {
    targets: variantTargets,
    value: { fixedAmount: { amount: perItem } },
    message: `${bundle.name} — Bundle Price Applied`,
  };
}

function applyMixMatchBundle(bundle: Bundle, lines: CartLine[]) {
  // Count qualifying items (items with bundlebox-mix tag)
  let qualifyingQty = 0;
  const targets: { productVariant: { id: string } }[] = [];

  for (const line of lines) {
    if (line.merchandise.__typename !== "ProductVariant") continue;
    if (line.merchandise.product.hasAnyTag) {
      qualifyingQty += line.quantity;
      targets.push({ productVariant: { id: line.merchandise.id } });
    }
  }

  if (qualifyingQty < bundle.minQuantity || targets.length === 0) return null;

  return {
    targets,
    value: { percentage: { value: String(bundle.discountValue) } },
    message: `Mix & Match — ${bundle.discountValue}% off any ${bundle.minQuantity} items`,
  };
}

function applyVolumeBundle(bundle: Bundle, lines: CartLine[]) {
  const results: FunctionRunResult["discounts"] = [];
  const tiers = (bundle.volumeTiers || []).sort((a, b) => b.quantity - a.quantity);

  for (const line of lines) {
    if (line.merchandise.__typename !== "ProductVariant") continue;
    if (!bundle.productIds.includes(line.merchandise.product.id)) continue;

    const tier = tiers.find(t => line.quantity >= t.quantity);
    if (!tier) continue;

    results.push({
      targets: [{ productVariant: { id: line.merchandise.id } }],
      value: { percentage: { value: String(tier.discount_percentage) } },
      message: `Volume saving — ${tier.discount_percentage}% off`,
    });
  }

  return results;
}
