import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Page, Layout, Card, Banner, Button, Text, BlockStack, InlineStack, Badge, ProgressBar, Spinner, Box } from "@shopify/polaris";

export default function Dashboard() {
  const nav = useNavigate();
  const shop = new URLSearchParams(window.location.search).get("shop") || "";
  const [billing, setBilling] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetch(`/api/billing/status?shop=${shop}`).then(r => r.json()).then(setBilling).finally(() => setLoading(false)); }, [shop]);

  if (loading) return <Page title="BundleBox"><Card><Box padding="800"><InlineStack align="center"><Spinner size="large" /></InlineStack></Box></Card></Page>;

  const { plan, bundleCount, bundleLimit } = billing;
  const limitNum = bundleLimit === "unlimited" ? Infinity : bundleLimit;
  const pct = limitNum === Infinity ? 0 : Math.round((bundleCount / limitNum) * 100);

  return (
    <Page title="BundleBox" primaryAction={{ content: "Create bundle", onAction: () => nav(`/bundles/new?shop=${shop}`) }}>
      <Layout>
        {plan === "free" && bundleCount >= 1 && <Layout.Section><Banner title="Free plan limit reached" tone="warning" action={{ content: "Upgrade", onAction: () => nav(`/bundles?shop=${shop}`) }}>Upgrade to create more bundles.</Banner></Layout.Section>}

        <Layout.Section variant="oneThird"><Card><BlockStack gap="200"><Text variant="headingSm">Active Bundles</Text><Text variant="headingXl">{bundleCount}</Text>{limitNum !== Infinity && <ProgressBar progress={pct} size="small" />}<Text variant="bodySm" tone="subdued">of {bundleLimit}</Text></BlockStack></Card></Layout.Section>
        <Layout.Section variant="oneThird"><Card><BlockStack gap="200"><Text variant="headingSm">Plan</Text><Badge tone={plan === "pro" ? "success" : plan === "starter" ? "info" : undefined}>{plan.charAt(0).toUpperCase() + plan.slice(1)}</Badge><Text variant="bodySm" tone="subdued">{billing.price === 0 ? "Free" : `$${billing.price}/mo`}</Text></BlockStack></Card></Layout.Section>
        <Layout.Section variant="oneThird"><Card><BlockStack gap="200"><Text variant="headingSm">Quick Actions</Text><Button onClick={() => nav(`/bundles?shop=${shop}`)}>View bundles</Button><Button onClick={() => nav(`/analytics?shop=${shop}`)}>Analytics</Button></BlockStack></Card></Layout.Section>
      </Layout>
    </Page>
  );
}
