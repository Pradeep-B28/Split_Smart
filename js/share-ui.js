// Share UI module: manages WhatsApp sharing, copy summary, and copy link with feedback.

import { CONFIG } from "../config.js";
import { shareText } from "./engine/split.js";
import { buildShareLink, buildWhatsAppShareUrl } from "./links.js";
import { t } from "./copy.js";

function createSvg(tag, attrs = {}) {
  const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const [k, v] of Object.entries(attrs)) {
    el.setAttribute(k, v);
  }
  return el;
}

// Copy to clipboard with fallback
async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (e) {
    // Clipboard API blocked, try fallback
  }

  try {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    textArea.style.top = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand("copy");
    document.body.removeChild(textArea);
    return successful;
  } catch (e) {
    return false;
  }
}

export function renderShareCard(container, { group, result }) {
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }

  const root = document.createElement("div");
  root.className = "share-ui-wrapper";

  const link = CONFIG.features.shareLink ? buildShareLink(group) : "";

  // Error alert area
  const copyNotice = document.createElement("div");
  copyNotice.className = "share-copy-notice";
  copyNotice.setAttribute("aria-live", "polite");

  // Actions Container
  const actionsGrid = document.createElement("div");
  actionsGrid.className = "share-actions-grid";

  // 1. WhatsApp Button
  const waBtn = document.createElement("a");
  waBtn.className = "btn btn-primary share-btn whatsapp-share-btn";
  waBtn.href = buildWhatsAppShareUrl(group, result, link);
  waBtn.target = "_blank";
  waBtn.rel = "noopener noreferrer";

  const waSvg = createSvg("svg", {
    viewBox: "0 0 24 24",
    width: "18",
    height: "18",
    fill: "currentColor",
    "aria-hidden": "true"
  });
  const waPath = createSvg("path", {
    d: "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"
  });
  waSvg.appendChild(waPath);

  const waText = document.createElement("span");
  waText.textContent = t("share.whatsApp");

  waBtn.appendChild(waSvg);
  waBtn.appendChild(waText);
  actionsGrid.appendChild(waBtn);

  // Helper for copy button micro-interaction
  function triggerCopySuccess(btn, originalText) {
    btn.textContent = "\u2713 " + t("share.copied");
    setTimeout(function () {
      btn.textContent = originalText;
    }, 1500);
  }

  // 2. Copy Summary Button
  const copySummaryBtn = document.createElement("button");
  copySummaryBtn.type = "button";
  copySummaryBtn.className = "btn btn-secondary share-btn";
  copySummaryBtn.textContent = t("share.copyText");

  copySummaryBtn.addEventListener("click", async function () {
    copyNotice.textContent = "";
    const text = shareText(group, result, link);
    const ok = await copyToClipboard(text);
    if (ok) {
      triggerCopySuccess(copySummaryBtn, t("share.copyText"));
    } else {
      copyNotice.textContent = t("share.copyFailed");
    }
  });
  actionsGrid.appendChild(copySummaryBtn);

  // 3. Copy Link Button (features.shareLink)
  if (CONFIG.features.shareLink) {
    const copyLinkBtn = document.createElement("button");
    copyLinkBtn.type = "button";
    copyLinkBtn.className = "btn btn-secondary share-btn";
    copyLinkBtn.textContent = t("share.copyLink");

    copyLinkBtn.addEventListener("click", async function () {
      copyNotice.textContent = "";
      const ok = await copyToClipboard(link);
      if (ok) {
        triggerCopySuccess(copyLinkBtn, t("share.copyLink"));
      } else {
        copyNotice.textContent = t("share.copyFailed");
      }
    });
    actionsGrid.appendChild(copyLinkBtn);
  }

  root.appendChild(actionsGrid);
  root.appendChild(copyNotice);

  // Note under buttons
  const linkNote = document.createElement("p");
  linkNote.className = "share-link-note";
  linkNote.textContent = t("share.linkNote");
  root.appendChild(linkNote);

  container.appendChild(root);
}
