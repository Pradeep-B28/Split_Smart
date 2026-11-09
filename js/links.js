// Link building utilities with UTM parameters and share links.

import { CONFIG } from "../config.js";
import { encodeGroup, shareText } from "./engine/split.js";

export function getBaseUrl() {
  if (CONFIG.siteUrl) return CONFIG.siteUrl.replace(/\/+$/, "");
  if (typeof window !== "undefined" && window.location) {
    return window.location.origin + window.location.pathname;
  }
  return "";
}

export function buildShareLink(group) {
  if (!CONFIG.features.shareLink) return "";
  const base = getBaseUrl();
  return base + "#g=" + encodeGroup(group);
}

export function buildWhatsAppShareUrl(group, result, link = "") {
  const text = shareText(group, result, link);
  return "https://wa.me/?text=" + encodeURIComponent(text);
}

export function buildProgramUrl() {
  const base = CONFIG.program.page || CONFIG.website || "https://wrench-wise.com";
  const url = new URL(base);
  if (CONFIG.utm) {
    for (const [k, v] of Object.entries(CONFIG.utm)) {
      if (v) url.searchParams.set("utm_" + k, v);
    }
  }
  return url.toString();
}

export function buildSalesWhatsAppUrl() {
  if (!CONFIG.salesWhatsApp) return "";
  const template = CONFIG.whatsAppText || "Hi, I tried Split Smart. I want to know more about the {program}.";
  const text = template.replace("{program}", CONFIG.program.name);
  return "https://wa.me/" + CONFIG.salesWhatsApp.replace(/\D/g, "") + "?text=" + encodeURIComponent(text);
}
