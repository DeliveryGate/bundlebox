import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Page, Layout, Card, DataTable, Text, BlockStack, Badge } from "@shopify/polaris";

export default function Analytics() {
  const nav = useNavigate();
  const shop = new URLSearchParams(window.location.search).get("shop") || "";
  const [bundles, setBundles] = useState([]);

  useEffect(() => { fetch(`/api/bundles?shop=${shop}`).then(r => r.json()).then(setBundles); }, [shop]);

  const active = bundles.filter(b => b.status === "active").length;
  const types = { fixed: 0, mix_match: 0, volume: 0 };
  bundles.forEach(b => { if (types[b.type] !== undefined) types[b.type]++; });

  return (
    <Page title="Analytics" backAction={{ content: "Dashboard", onAction: () => nav(`/?shop=${shop}`) }}>
      <Layout>
        <Layout.Section variant="oneThird"><Card><BlockStack gap="200"><Text variant="headingSm">Active Bundles</Text><Text variant="headingXl">{active}</Text></BlockStack></Card></Layout.Section>
        <Layout.Section variant="oneThird"><Card><BlockStack gap="200"><Text variant="headingSm">Fixed Bundles</Text><Text variant="headingXl">{types.fixed}</Text></BlockStack></Card></Layout.Section>
        <Layout.Section variant="oneThird"><Card><BlockStack gap="200"><Text variant="headingSm">Volume Bundles</Text><Text variant="headingXl">{types.volume}</Text></BlockStack></Card></Layout.Section>

        <Layout.Section><Card><BlockStack gap="300"><Text variant="headingMd">All Bundles</Text>
          <DataTable columnContentTypes={["text", "text", "text", "text"]} headings={["Name", "Type", "Status", "Discount"]}
            rows={bundles.map(b => [b.name || "—", b.type || "—", b.status || "—", b.discount_value ? `${b.discount_value}%` : "—"])} />
        </BlockStack></Card></Layout.Section>
      </Layout>
    </Page>
  );
}
