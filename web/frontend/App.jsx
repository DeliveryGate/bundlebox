import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "@shopify/polaris";
import enTranslations from "@shopify/polaris/locales/en.json";
import "@shopify/polaris/build/esm/styles.css";
import Dashboard from "./pages/index.jsx";
import Bundles from "./pages/bundles.jsx";
import NewBundle from "./pages/bundles/new.jsx";
import EditBundle from "./pages/bundles/[id].jsx";
import Analytics from "./pages/analytics.jsx";

function App() {
  return (<AppProvider i18n={enTranslations}><BrowserRouter><Routes>
    <Route path="/" element={<Dashboard />} />
    <Route path="/bundles" element={<Bundles />} />
    <Route path="/bundles/new" element={<NewBundle />} />
    <Route path="/bundles/:id" element={<EditBundle />} />
    <Route path="/analytics" element={<Analytics />} />
  </Routes></BrowserRouter></AppProvider>);
}
createRoot(document.getElementById("root")).render(<App />);
