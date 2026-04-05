import express from "express";
import compression from "compression";
import { PrismaClient } from "@prisma/client";
import path from "path";
import { fileURLToPath } from "url";
import serveStatic from "serve-static";
import { verifyWebhookHmac, shopifyGraphQL, PLANS, CREATE_SUBSCRIPTION } from "./shopify.js";
import { verifyRequest } from "./middleware/verify-request.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const prisma = new PrismaClient();
const app = express();
const PORT = parseInt(process.env.PORT || "3000", 10);
const IS_PROD = process.env.NODE_ENV === "production";

app.use(compression());
app.use("/api/webhooks", express.raw({ type: "application/json" }));
app.use(express.json());
app.get("/health", (req, res) => res.json({ status: "ok", app: "bundlebox" }));

// --- Webhooks ---
app.post("/api/webhooks/:topic", async (req, res) => {
  const hmac = req.headers["x-shopify-hmac-sha256"];
  if (!hmac || !verifyWebhookHmac(req.body.toString(), hmac, process.env.SHOPIFY_API_SECRET)) return res.status(401).send("Unauthorized");
  const shop = req.headers["x-shopify-shop-domain"];
  if (["app-uninstalled", "shop-redact"].includes(req.params.topic)) {
    await prisma.merchantPlan.deleteMany({ where: { shop } });
    await prisma.session.deleteMany({ where: { shop } });
  }
  res.status(200).send("OK");
});

// --- Bundle CRUD (metaobjects) ---
app.get("/api/bundles", verifyRequest, async (req, res) => {
  const { shop, accessToken } = req.shopSession;
  try {
    const result = await shopifyGraphQL(shop, accessToken, `query { metaobjects(type: "bundlebox_bundle", first: 100) { edges { node { id handle fields { key value } } } } }`);
    const bundles = result.data.metaobjects.edges.map(({ node }) => {
      const fields = {};
      node.fields.forEach(f => { fields[f.key] = f.value; });
      return { id: node.id, handle: node.handle, ...fields, volume_tiers: fields.volume_tiers ? JSON.parse(fields.volume_tiers) : [] };
    });
    res.json(bundles);
  } catch (err) { res.status(500).json({ error: "Failed to fetch bundles" }); }
});

app.post("/api/bundles", verifyRequest, async (req, res) => {
  const { shop, accessToken } = req.shopSession;
  const { name, type, product_ids, collection_id, discount_type, discount_value, min_quantity, original_price, bundle_price, volume_tiers } = req.body;

  // Check plan limit
  const merchant = await prisma.merchantPlan.findUnique({ where: { shop } });
  const plan = merchant?.plan || "free";
  const limit = PLANS[plan]?.bundleLimit || 1;
  const count = merchant?.bundleCount || 0;
  if (limit !== Infinity && count >= limit) return res.status(403).json({ error: "Bundle limit reached", plan, limit, upgrade: true });

  const handle = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  try {
    const result = await shopifyGraphQL(shop, accessToken, `
      mutation CreateMetaobject($metaobject: MetaobjectCreateInput!) {
        metaobjectCreate(metaobject: $metaobject) { metaobject { id handle } userErrors { field message } }
      }
    `, {
      metaobject: {
        type: "bundlebox_bundle",
        handle,
        fields: [
          { key: "name", value: name },
          { key: "handle", value: handle },
          { key: "type", value: type },
          { key: "status", value: "active" },
          { key: "discount_type", value: discount_type || "percentage" },
          { key: "discount_value", value: String(discount_value || 0) },
          { key: "min_quantity", value: String(min_quantity || 1) },
          ...(product_ids ? [{ key: "product_ids", value: JSON.stringify(product_ids) }] : []),
          ...(collection_id ? [{ key: "collection_id", value: collection_id }] : []),
          ...(original_price ? [{ key: "original_price", value: String(original_price) }] : []),
          ...(bundle_price ? [{ key: "bundle_price", value: String(bundle_price) }] : []),
          ...(volume_tiers ? [{ key: "volume_tiers", value: JSON.stringify(volume_tiers) }] : []),
        ],
      },
    });
    const errors = result.data.metaobjectCreate.userErrors;
    if (errors.length > 0) return res.status(400).json({ error: errors });

    await prisma.merchantPlan.upsert({ where: { shop }, create: { shop, bundleCount: 1 }, update: { bundleCount: { increment: 1 } } });
    res.json(result.data.metaobjectCreate.metaobject);
  } catch (err) { res.status(500).json({ error: "Failed to create bundle" }); }
});

app.get("/api/bundles/:id", verifyRequest, async (req, res) => {
  const { shop, accessToken } = req.shopSession;
  try {
    const result = await shopifyGraphQL(shop, accessToken, `query($id: ID!) { metaobject(id: $id) { id handle fields { key value } } }`, { id: req.params.id });
    if (!result.data.metaobject) return res.status(404).json({ error: "Not found" });
    const fields = {};
    result.data.metaobject.fields.forEach(f => { fields[f.key] = f.value; });
    res.json({ id: result.data.metaobject.id, handle: result.data.metaobject.handle, ...fields });
  } catch (err) { res.status(500).json({ error: "Failed to fetch bundle" }); }
});

app.put("/api/bundles/:id", verifyRequest, async (req, res) => {
  const { shop, accessToken } = req.shopSession;
  const fields = [];
  for (const [key, value] of Object.entries(req.body)) {
    if (["name", "type", "status", "discount_type", "discount_value", "min_quantity", "collection_id", "original_price", "bundle_price"].includes(key)) {
      fields.push({ key, value: String(value) });
    } else if (key === "product_ids") {
      fields.push({ key, value: JSON.stringify(value) });
    } else if (key === "volume_tiers") {
      fields.push({ key, value: JSON.stringify(value) });
    }
  }
  try {
    const result = await shopifyGraphQL(shop, accessToken, `mutation($id: ID!, $metaobject: MetaobjectUpdateInput!) { metaobjectUpdate(id: $id, metaobject: $metaobject) { metaobject { id } userErrors { field message } } }`, { id: req.params.id, metaobject: { fields } });
    res.json(result.data.metaobjectUpdate.metaobject);
  } catch (err) { res.status(500).json({ error: "Failed to update" }); }
});

app.delete("/api/bundles/:id", verifyRequest, async (req, res) => {
  const { shop, accessToken } = req.shopSession;
  try {
    await shopifyGraphQL(shop, accessToken, `mutation($id: ID!) { metaobjectDelete(id: $id) { userErrors { field message } } }`, { id: req.params.id });
    await prisma.merchantPlan.update({ where: { shop }, data: { bundleCount: { decrement: 1 } } }).catch(() => {});
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: "Failed to delete" }); }
});

app.post("/api/bundles/:id/duplicate", verifyRequest, async (req, res) => {
  const { shop, accessToken } = req.shopSession;
  try {
    const orig = await shopifyGraphQL(shop, accessToken, `query($id: ID!) { metaobject(id: $id) { fields { key value } } }`, { id: req.params.id });
    const fields = orig.data.metaobject.fields.map(f => f.key === "name" ? { ...f, value: f.value + " (Copy)" } : f.key === "handle" ? { ...f, value: f.value + "-copy" } : f.key === "status" ? { ...f, value: "draft" } : f);
    const result = await shopifyGraphQL(shop, accessToken, `mutation($metaobject: MetaobjectCreateInput!) { metaobjectCreate(metaobject: $metaobject) { metaobject { id } userErrors { field message } } }`, { metaobject: { type: "bundlebox_bundle", fields } });
    res.json(result.data.metaobjectCreate.metaobject);
  } catch (err) { res.status(500).json({ error: "Failed to duplicate" }); }
});

// --- Products/Collections search ---
app.get("/api/products/search", verifyRequest, async (req, res) => {
  const { shop, accessToken } = req.shopSession;
  const q = req.query.q || "";
  const result = await shopifyGraphQL(shop, accessToken, `query($q: String) { products(first: 20, query: $q) { edges { node { id title handle featuredImage { url } priceRangeV2 { minVariantPrice { amount currencyCode } } } } } }`, { q });
  res.json(result.data.products.edges.map(({ node }) => node));
});

app.get("/api/collections", verifyRequest, async (req, res) => {
  const { shop, accessToken } = req.shopSession;
  const result = await shopifyGraphQL(shop, accessToken, `query { collections(first: 50) { edges { node { id title handle } } } }`);
  res.json(result.data.collections.edges.map(({ node }) => node));
});

// --- Billing ---
app.get("/api/billing/status", verifyRequest, async (req, res) => {
  const merchant = await prisma.merchantPlan.findUnique({ where: { shop: req.shopSession.shop } });
  const plan = merchant?.plan || "free";
  res.json({ plan, bundleCount: merchant?.bundleCount || 0, bundleLimit: PLANS[plan]?.bundleLimit === Infinity ? "unlimited" : PLANS[plan]?.bundleLimit, price: PLANS[plan]?.price });
});

app.post("/api/billing/subscribe", verifyRequest, async (req, res) => {
  const { shop, accessToken } = req.shopSession;
  const { plan } = req.body;
  if (!plan || !PLANS[plan] || plan === "free") return res.status(400).json({ error: "Invalid plan" });
  const returnUrl = `${process.env.SHOPIFY_APP_URL}/api/billing/callback?shop=${shop}&plan=${plan}`;
  try {
    const result = await shopifyGraphQL(shop, accessToken, CREATE_SUBSCRIPTION, { name: `BundleBox ${PLANS[plan].name}`, returnUrl, test: !IS_PROD, lineItems: [{ plan: { appRecurringPricingDetails: { price: { amount: PLANS[plan].price, currencyCode: "USD" }, interval: "EVERY_30_DAYS" } } }] });
    res.json({ confirmationUrl: result.data.appSubscriptionCreate.confirmationUrl });
  } catch { res.status(500).json({ error: "Subscription failed" }); }
});

app.get("/api/billing/callback", async (req, res) => {
  const { shop, plan, charge_id } = req.query;
  if (charge_id && plan) await prisma.merchantPlan.upsert({ where: { shop }, create: { shop, plan, subscriptionId: charge_id }, update: { plan, subscriptionId: charge_id } });
  res.redirect(`/?shop=${shop}`);
});

// --- Static ---
if (IS_PROD) { app.use(serveStatic(path.join(__dirname, "frontend", "dist"))); app.get("*", (req, res) => res.sendFile(path.join(__dirname, "frontend", "dist", "index.html"))); }
app.listen(PORT, () => console.log(`BundleBox backend running on port ${PORT}`));
