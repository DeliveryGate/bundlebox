import "dotenv/config";

const SHOP = process.env.SHOPIFY_STORE_DOMAIN;
const TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;

async function graphql(query, variables = {}) {
  const res = await fetch(`https://${SHOP}/admin/api/2026-01/graphql.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": TOKEN },
    body: JSON.stringify({ query, variables }),
  });
  return res.json();
}

async function main() {
  console.log("Creating BundleBox metaobject definition...");

  const mutation = `
    mutation CreateMetaobjectDefinition($definition: MetaobjectDefinitionCreateInput!) {
      metaobjectDefinitionCreate(definition: $definition) {
        metaobjectDefinition { id type }
        userErrors { field message code }
      }
    }
  `;

  const result = await graphql(mutation, {
    definition: {
      type: "bundlebox_bundle",
      name: "BundleBox Bundle",
      fieldDefinitions: [
        { key: "name", name: "Bundle Name", type: "single_line_text_field" },
        { key: "handle", name: "Handle", type: "single_line_text_field" },
        { key: "type", name: "Type", type: "single_line_text_field", validations: [{ name: "choices", value: '["fixed","mix_match","volume"]' }] },
        { key: "status", name: "Status", type: "single_line_text_field", validations: [{ name: "choices", value: '["active","draft"]' }] },
        { key: "product_ids", name: "Product IDs", type: "list.single_line_text_field" },
        { key: "collection_id", name: "Collection ID", type: "single_line_text_field" },
        { key: "discount_type", name: "Discount Type", type: "single_line_text_field" },
        { key: "discount_value", name: "Discount Value", type: "number_decimal" },
        { key: "min_quantity", name: "Min Quantity", type: "number_integer" },
        { key: "original_price", name: "Original Price", type: "number_decimal" },
        { key: "bundle_price", name: "Bundle Price", type: "number_decimal" },
        { key: "volume_tiers", name: "Volume Tiers", type: "json" },
      ],
    },
  });

  const errors = result.data?.metaobjectDefinitionCreate?.userErrors || [];
  if (errors.length > 0) {
    if (errors.some(e => e.code === "TAKEN")) {
      console.log("Metaobject definition already exists — skipping");
    } else {
      console.error("Errors:", errors);
    }
  } else {
    console.log("Created:", result.data.metaobjectDefinitionCreate.metaobjectDefinition);
  }
}

main().catch(console.error);
