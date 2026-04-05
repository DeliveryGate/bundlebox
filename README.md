# BundleBox — Product Bundles and Kits

Create product bundles to increase average order value. Three bundle types: fixed bundles (specific products at a set price), mix & match (pick X items from a collection), and volume bundles (buy more save more).

## Architecture

- **Shopify Function** (`extensions/bundle-discount-function/`) — Discount logic for all three bundle types
- **Theme Extension** (`extensions/bundlebox-block/`) — Bundle display, mix & match selector, volume pricing table
- **Admin Dashboard** (`web/frontend/`) — Bundle creator, manager, analytics (React + Polaris)
- **Backend** (`web/index.js`) — Express API, metaobject CRUD, billing

## Billing

| Plan | Price | Bundles | Features |
|------|-------|---------|----------|
| Free | $0 | 1 | All types |
| Starter | $12.99/mo | 10 | All types, analytics |
| Pro | $24.99/mo | Unlimited | All types, analytics, duplication |

## App Store Listing

**Name:** BundleBox — Product Bundles and Kits
**Tagline:** Sell more with bundles — fixed, mix & match, and volume deals.

**Key Benefits:**
- Replace 4 apps — one bundle solution that just works
- Three bundle types: fixed kits, mix & match, and volume discounts
- Increase average order value from day one — no coding required
