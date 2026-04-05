import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Page, Layout, Card, TextField, Select, Button, Toast, Frame, Text, BlockStack, InlineStack, Box, Badge, Divider, Banner } from "@shopify/polaris";

const TYPES = [
  { value: "fixed", label: "Fixed Bundle", desc: "Sell specific products together at a set price" },
  { value: "mix_match", label: "Mix & Match", desc: "Let customers pick any X items from a collection" },
  { value: "volume", label: "Volume Bundle", desc: "Reward customers who buy more" },
];

export default function NewBundle() {
  const nav = useNavigate();
  const shop = new URLSearchParams(window.location.search).get("shop") || "";
  const [step, setStep] = useState(1);
  const [type, setType] = useState("");
  const [name, setName] = useState("");
  const [discountValue, setDiscountValue] = useState("10");
  const [minQty, setMinQty] = useState("3");
  const [bundlePrice, setBundlePrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [collectionId, setCollectionId] = useState("");
  const [collections, setCollections] = useState([]);
  const [productSearch, setProductSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [volumeTiers, setVolumeTiers] = useState([{ quantity: 3, discount_percentage: 10 }, { quantity: 5, discount_percentage: 15 }, { quantity: 10, discount_percentage: 20 }]);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => { if (type === "mix_match") fetch(`/api/collections?shop=${shop}`).then(r => r.json()).then(setCollections); }, [type, shop]);

  const searchProducts = async (q) => {
    setProductSearch(q);
    if (q.length < 2) return;
    const res = await fetch(`/api/products/search?shop=${shop}&q=${encodeURIComponent(q)}`);
    setSearchResults(await res.json());
  };

  const addProduct = (p) => {
    if (!selectedProducts.find(sp => sp.id === p.id)) setSelectedProducts([...selectedProducts, p]);
    setProductSearch(""); setSearchResults([]);
  };

  const handleSave = async () => {
    setSaving(true);
    const body = { name, type, discount_type: "percentage", discount_value: parseFloat(discountValue), min_quantity: parseInt(minQty) };
    if (type === "fixed") { body.product_ids = selectedProducts.map(p => p.id); body.bundle_price = parseFloat(bundlePrice) || 0; body.original_price = parseFloat(originalPrice) || 0; }
    if (type === "mix_match") { body.collection_id = collectionId; }
    if (type === "volume") { body.product_ids = selectedProducts.map(p => p.id); body.volume_tiers = volumeTiers; }

    const res = await fetch(`/api/bundles?shop=${shop}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setSaving(false);
    if (res.ok) { setToast("Bundle created!"); setTimeout(() => nav(`/bundles?shop=${shop}`), 1000); }
    else { const d = await res.json(); setToast(d.error?.toString() || "Failed to create"); }
  };

  return (
    <Frame>
      <Page title="Create Bundle" backAction={{ content: "Bundles", onAction: () => nav(`/bundles?shop=${shop}`) }}>
        {step === 1 && (
          <Layout>
            <Layout.Section><Text variant="headingMd">Choose bundle type</Text></Layout.Section>
            {TYPES.map(t => (
              <Layout.Section variant="oneThird" key={t.value}>
                <Card>
                  <BlockStack gap="300">
                    <Text variant="headingMd">{t.label}</Text>
                    <Text variant="bodySm" tone="subdued">{t.desc}</Text>
                    <Button variant={type === t.value ? "primary" : "secondary"} onClick={() => { setType(t.value); setStep(2); }}>{type === t.value ? "Selected" : "Select"}</Button>
                  </BlockStack>
                </Card>
              </Layout.Section>
            ))}
          </Layout>
        )}

        {step === 2 && (
          <Layout>
            <Layout.Section>
              <Card><BlockStack gap="400">
                <Text variant="headingMd">{TYPES.find(t => t.value === type)?.label} Details</Text>
                <TextField label="Bundle name" value={name} onChange={setName} autoComplete="off" />

                {(type === "fixed" || type === "volume") && (
                  <>
                    <TextField label="Search products" value={productSearch} onChange={searchProducts} autoComplete="off" />
                    {searchResults.length > 0 && <BlockStack gap="100">{searchResults.slice(0, 5).map(p => <Button key={p.id} size="slim" onClick={() => addProduct(p)}>{p.title}</Button>)}</BlockStack>}
                    {selectedProducts.length > 0 && <BlockStack gap="100"><Text variant="headingSm">Selected:</Text>{selectedProducts.map(p => <InlineStack key={p.id} gap="200" blockAlign="center"><Text>{p.title}</Text><Button size="slim" tone="critical" onClick={() => setSelectedProducts(selectedProducts.filter(sp => sp.id !== p.id))}>Remove</Button></InlineStack>)}</BlockStack>}
                  </>
                )}

                {type === "fixed" && (
                  <InlineStack gap="300">
                    <Box minWidth="150px"><TextField label="Original price" type="number" value={originalPrice} onChange={setOriginalPrice} autoComplete="off" /></Box>
                    <Box minWidth="150px"><TextField label="Bundle price" type="number" value={bundlePrice} onChange={setBundlePrice} autoComplete="off" /></Box>
                    {originalPrice && bundlePrice && <Text variant="bodySm" tone="success">Customers save: ${(parseFloat(originalPrice) - parseFloat(bundlePrice)).toFixed(2)}</Text>}
                  </InlineStack>
                )}

                {type === "mix_match" && (
                  <>
                    <Select label="Collection" options={[{ label: "Select...", value: "" }, ...collections.map(c => ({ label: c.title, value: c.id }))]} value={collectionId} onChange={setCollectionId} />
                    <TextField label="Minimum items" type="number" value={minQty} onChange={setMinQty} autoComplete="off" />
                    <TextField label="Discount %" type="number" value={discountValue} onChange={setDiscountValue} autoComplete="off" />
                  </>
                )}

                {type === "volume" && (
                  <BlockStack gap="300">
                    <Text variant="headingSm">Volume Tiers</Text>
                    {volumeTiers.map((tier, i) => (
                      <InlineStack key={i} gap="200" blockAlign="end">
                        <Box minWidth="120px"><TextField label="Min qty" type="number" value={String(tier.quantity)} onChange={v => { const t = [...volumeTiers]; t[i].quantity = parseInt(v) || 0; setVolumeTiers(t); }} autoComplete="off" /></Box>
                        <Box minWidth="120px"><TextField label="Discount %" type="number" value={String(tier.discount_percentage)} onChange={v => { const t = [...volumeTiers]; t[i].discount_percentage = parseInt(v) || 0; setVolumeTiers(t); }} autoComplete="off" /></Box>
                        <Button size="slim" tone="critical" onClick={() => setVolumeTiers(volumeTiers.filter((_, j) => j !== i))}>Remove</Button>
                      </InlineStack>
                    ))}
                    <Button onClick={() => setVolumeTiers([...volumeTiers, { quantity: 0, discount_percentage: 0 }])}>Add tier</Button>
                  </BlockStack>
                )}

                <Divider />
                <InlineStack gap="200">
                  <Button onClick={() => setStep(1)}>Back</Button>
                  <Button variant="primary" loading={saving} onClick={handleSave} disabled={!name}>Create bundle</Button>
                </InlineStack>
              </BlockStack></Card>
            </Layout.Section>
          </Layout>
        )}

        {toast && <Toast content={toast} onDismiss={() => setToast(null)} />}
      </Page>
    </Frame>
  );
}
