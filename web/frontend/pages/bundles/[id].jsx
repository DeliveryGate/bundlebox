import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Page, Layout, Card, TextField, Select, Button, Toast, Frame, Text, BlockStack, InlineStack, Box, Badge, Divider, Spinner } from "@shopify/polaris";

export default function EditBundle() {
  const { id } = useParams();
  const nav = useNavigate();
  const shop = new URLSearchParams(window.location.search).get("shop") || "";
  const [bundle, setBundle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [name, setName] = useState("");
  const [status, setStatus] = useState("active");
  const [discountValue, setDiscountValue] = useState("");
  const [bundlePrice, setBundlePrice] = useState("");
  const [minQty, setMinQty] = useState("");

  useEffect(() => {
    fetch(`/api/bundles/${encodeURIComponent(id)}?shop=${shop}`).then(r => r.json()).then(b => {
      setBundle(b); setName(b.name || ""); setStatus(b.status || "active");
      setDiscountValue(b.discount_value || ""); setBundlePrice(b.bundle_price || ""); setMinQty(b.min_quantity || "");
    }).finally(() => setLoading(false));
  }, [id, shop]);

  const handleSave = async () => {
    setSaving(true);
    const res = await fetch(`/api/bundles/${encodeURIComponent(id)}?shop=${shop}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, status, discount_value: discountValue, bundle_price: bundlePrice, min_quantity: minQty }) });
    setSaving(false);
    setToast(res.ok ? "Bundle updated" : "Failed to update");
  };

  if (loading) return <Page title="Edit Bundle"><Card><Box padding="800"><InlineStack align="center"><Spinner size="large" /></InlineStack></Box></Card></Page>;

  return (
    <Frame>
      <Page title={`Edit: ${name}`} backAction={{ content: "Bundles", onAction: () => nav(`/bundles?shop=${shop}`) }}>
        <Layout>
          <Layout.Section><Card><BlockStack gap="400">
            <InlineStack gap="200"><Text variant="headingMd">Bundle Details</Text><Badge tone={status === "active" ? "success" : undefined}>{status}</Badge></InlineStack>
            <TextField label="Name" value={name} onChange={setName} autoComplete="off" />
            <Select label="Status" options={[{ label: "Active", value: "active" }, { label: "Draft", value: "draft" }]} value={status} onChange={setStatus} />
            <TextField label="Discount value (%)" type="number" value={discountValue} onChange={setDiscountValue} autoComplete="off" />
            {bundle?.type === "fixed" && <TextField label="Bundle price" type="number" value={bundlePrice} onChange={setBundlePrice} autoComplete="off" />}
            {bundle?.type !== "fixed" && <TextField label="Min quantity" type="number" value={minQty} onChange={setMinQty} autoComplete="off" />}
            <Divider />
            <Button variant="primary" loading={saving} onClick={handleSave}>Save changes</Button>
          </BlockStack></Card></Layout.Section>
        </Layout>
        {toast && <Toast content={toast} onDismiss={() => setToast(null)} />}
      </Page>
    </Frame>
  );
}
