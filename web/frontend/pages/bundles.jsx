import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Page, Card, DataTable, Badge, Button, Filters, Toast, Frame, Text, BlockStack, InlineStack, Box } from "@shopify/polaris";

const TYPE_TONES = { fixed: "info", mix_match: undefined, volume: "success" };
const STATUS_TONES = { active: "success", draft: undefined, paused: "warning" };

export default function Bundles() {
  const nav = useNavigate();
  const shop = new URLSearchParams(window.location.search).get("shop") || "";
  const [bundles, setBundles] = useState([]);
  const [typeFilter, setTypeFilter] = useState("");
  const [toast, setToast] = useState(null);

  const fetchBundles = () => fetch(`/api/bundles?shop=${shop}`).then(r => r.json()).then(setBundles);
  useEffect(() => { fetchBundles(); }, [shop]);

  const handleDelete = async (id) => { await fetch(`/api/bundles/${id}?shop=${shop}`, { method: "DELETE" }); setToast("Bundle deleted"); fetchBundles(); };
  const handleDuplicate = async (id) => { await fetch(`/api/bundles/${id}/duplicate?shop=${shop}`, { method: "POST" }); setToast("Bundle duplicated"); fetchBundles(); };
  const handleToggle = async (id, currentStatus) => {
    const newStatus = currentStatus === "active" ? "draft" : "active";
    await fetch(`/api/bundles/${id}?shop=${shop}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: newStatus }) });
    fetchBundles();
  };

  const filtered = typeFilter ? bundles.filter(b => b.type === typeFilter) : bundles;
  const rows = filtered.map(b => [
    b.name || "Untitled",
    <Badge key="t" tone={TYPE_TONES[b.type]}>{(b.type || "").replace("_", " ")}</Badge>,
    <Badge key="s" tone={STATUS_TONES[b.status]}>{b.status || "draft"}</Badge>,
    b.product_ids ? (Array.isArray(b.product_ids) ? b.product_ids : JSON.parse(b.product_ids || "[]")).length : 0,
    b.discount_value ? `${b.discount_value}%` : "—",
    <InlineStack gap="100" key={b.id}>
      <Button size="slim" onClick={() => nav(`/bundles/${encodeURIComponent(b.id)}?shop=${shop}`)}>Edit</Button>
      <Button size="slim" onClick={() => handleDuplicate(b.id)}>Duplicate</Button>
      <Button size="slim" onClick={() => handleToggle(b.id, b.status)}>{b.status === "active" ? "Pause" : "Activate"}</Button>
      <Button size="slim" tone="critical" onClick={() => handleDelete(b.id)}>Delete</Button>
    </InlineStack>,
  ]);

  return (
    <Frame>
      <Page title="Bundles" backAction={{ content: "Dashboard", onAction: () => nav(`/?shop=${shop}`) }} primaryAction={{ content: "Create bundle", onAction: () => nav(`/bundles/new?shop=${shop}`) }}>
        <Card>
          <BlockStack gap="400">
            <Filters queryValue="" onQueryChange={() => {}} onQueryClear={() => {}} filters={[{ key: "type", label: "Type", filter: null }]} />
            <DataTable columnContentTypes={["text", "text", "text", "numeric", "text", "text"]} headings={["Name", "Type", "Status", "Products", "Discount", "Actions"]} rows={rows} />
          </BlockStack>
        </Card>
        {toast && <Toast content={toast} onDismiss={() => setToast(null)} />}
      </Page>
    </Frame>
  );
}
