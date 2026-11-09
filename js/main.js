// Main entry point for Split Smart.
// Coordinates state, rendering, events, theme, and animations.

import { CONFIG } from "../config.js";
import { COPY, t } from "./copy.js";
import { newGroup, settle, decodeGroup, removeExpense } from "./engine/split.js";
import { getTheme, setTheme, loadGroup, saveGroup } from "./store.js";
import { renderGroupCard } from "./group-ui.js";
import { renderPaymentCard } from "./payment-ui.js";
import { renderPaymentsList } from "./list-ui.js";
import { renderResultCard } from "./result-ui.js";
import { renderUntangleCard, highlightTransferArrow } from "./untangle-ui.js";
import { renderBalancesCard } from "./balances-ui.js";
import { renderShareCard } from "./share-ui.js";
import { renderViewingBanner } from "./view-ui.js";
import { renderHowItWorks, renderPrivacyStrip, renderDsaSection, renderCtaCard } from "./sections-ui.js";
import { initScrollReveal } from "./motion.js";

// State
let group = newGroup("");
let previousGroup = null;
let editingId = null;
let lastPayerId = null;
let isViewing = false;
let badLink = false;
let undoTimeout = null;

// Initialize text content from COPY dictionary
function initStaticCopy() {
  const heroEyebrow = document.getElementById("hero-eyebrow");
  if (heroEyebrow) heroEyebrow.textContent = t("hero.eyebrow");

  const heroTitle = document.getElementById("hero-title");
  if (heroTitle) heroTitle.textContent = t("hero.title");

  const heroSub = document.getElementById("hero-sub");
  if (heroSub) heroSub.textContent = t("hero.sub");

  const groupCardTitle = document.getElementById("group-card-title");
  if (groupCardTitle) groupCardTitle.textContent = t("group.label");

  const paymentCardTitle = document.getElementById("payment-card-title");
  if (paymentCardTitle) paymentCardTitle.textContent = t("payment.heading");

  const listCardTitle = document.getElementById("list-card-title");
  if (listCardTitle) listCardTitle.textContent = t("list.heading");

  const resultCardTitle = document.getElementById("result-card-title");
  if (resultCardTitle) resultCardTitle.textContent = "Settle-up plan";

  const untangleCardTitle = document.getElementById("untangle-card-title");
  if (untangleCardTitle) untangleCardTitle.textContent = "The Untangle";

  const balancesCardTitle = document.getElementById("balances-card-title");
  if (balancesCardTitle) balancesCardTitle.textContent = t("balances.heading");

  const shareCardTitle = document.getElementById("share-card-title");
  if (shareCardTitle) shareCardTitle.textContent = t("share.heading");

  const howCardTitle = document.getElementById("how-card-title");
  if (howCardTitle) howCardTitle.textContent = t("how.heading");

  const privacyStripTitle = document.getElementById("privacy-strip-title");
  if (privacyStripTitle) privacyStripTitle.textContent = t("privacy.proofTitle");

  const dsaCardTitle = document.getElementById("dsa-card-title");
  if (dsaCardTitle) dsaCardTitle.textContent = t("hood.heading");

  const ctaCardTitle = document.getElementById("cta-card-title");
  if (ctaCardTitle) ctaCardTitle.textContent = t("cta.title");

  const ctaCardBody = document.getElementById("cta-card-body");
  if (ctaCardBody) ctaCardBody.textContent = t("cta.body", { program: CONFIG.program.name });

  const footerBuilt = document.getElementById("footer-built");
  if (footerBuilt) footerBuilt.textContent = t("footer.built");

  const footerPrivacy = document.getElementById("footer-privacy");
  if (footerPrivacy) footerPrivacy.textContent = t("footer.privacy");
}

// Logo image fallback
function initLogoFallback() {
  const handleLogoError = function (img) {
    if (!img) return;
    const span = document.createElement("span");
    span.className = img.className.includes("loader") ? "loader-logo-fallback" : "brand-logo-fallback";
    span.textContent = COPY.brand;
    img.replaceWith(span);
  };

  const headerLogo = document.getElementById("header-logo-img");
  if (headerLogo) {
    headerLogo.addEventListener("error", function () {
      handleLogoError(headerLogo);
    });
  }

  const loaderLogo = document.getElementById("loader-logo-img");
  if (loaderLogo) {
    loaderLogo.addEventListener("error", function () {
      handleLogoError(loaderLogo);
    });
  }
}

// Theme toggle
function initThemeToggle() {
  const toggleBtn = document.getElementById("theme-toggle-btn");
  if (!toggleBtn) return;

  toggleBtn.addEventListener("click", function () {
    const isDark = document.documentElement.classList.contains("dark");
    if (isDark) {
      document.documentElement.classList.remove("dark");
      setTheme("light");
    } else {
      document.documentElement.classList.add("dark");
      setTheme("dark");
    }
  });
}

// Loader animation dismissal
function initLoader() {
  const loader = document.getElementById("app-loader");
  if (!loader) return;

  const hasLoaderClass = document.documentElement.classList.contains("has-loader");
  const prefersReduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!hasLoaderClass || prefersReduced) {
    if (loader.parentNode) loader.parentNode.removeChild(loader);
    document.documentElement.classList.add("hero-visible");
    return;
  }

  const duration = Math.min(CONFIG.loaderMs || 800, 800);
  setTimeout(function () {
    loader.classList.add("loader-dismissed");
    document.documentElement.classList.add("hero-visible");
    setTimeout(function () {
      if (loader.parentNode) loader.parentNode.removeChild(loader);
    }, 260);
  }, duration);
}

// Undo Toast Management
function showUndoToast() {
  const toast = document.getElementById("undo-toast");
  const msgEl = document.getElementById("undo-msg");
  const btnEl = document.getElementById("undo-btn");
  const timerLine = document.getElementById("undo-timer-line");

  if (!toast || !msgEl || !btnEl) return;

  if (undoTimeout) {
    clearTimeout(undoTimeout);
    undoTimeout = null;
  }

  msgEl.textContent = t("list.deleted");
  btnEl.textContent = t("list.undo");

  btnEl.onclick = function () {
    if (previousGroup) {
      group = previousGroup;
      previousGroup = null;
      if (!isViewing) saveGroup(group);
      hideUndoToast();
      render();
    }
  };

  if (timerLine) {
    timerLine.classList.remove("undo-timer-anim");
    void timerLine.offsetWidth;
    timerLine.classList.add("undo-timer-anim");
  }

  toast.classList.add("active");

  undoTimeout = setTimeout(function () {
    hideUndoToast();
  }, CONFIG.undoMs || 5000);
}

function hideUndoToast() {
  const toast = document.getElementById("undo-toast");
  if (toast) toast.classList.remove("active");
  if (undoTimeout) {
    clearTimeout(undoTimeout);
    undoTimeout = null;
  }
}

// Group updates handler
function handleUpdateGroup(newGrp, payerId = null) {
  group = newGrp;
  if (payerId) lastPayerId = payerId;
  if (!isViewing) saveGroup(group);
  render();
}

// Payment edit triggers
function handleEditExpense(id) {
  if (isViewing) return;
  editingId = id;
  render();
  const paymentCard = document.getElementById("payment-card");
  if (paymentCard) {
    paymentCard.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function handleCancelEdit() {
  editingId = null;
  render();
}

// Payment delete handler
function handleDeleteExpense(id) {
  if (isViewing) return;
  previousGroup = group;
  const res = removeExpense(group, id);
  if (res.ok) {
    group = res.group;
    if (editingId === id) editingId = null;
    if (!isViewing) saveGroup(group);
    render();
    showUndoToast();
  }
}

// Make my copy handler from shared view
function handleMakeCopy() {
  isViewing = false;
  badLink = false;
  render();
}

// Main render coordinator
export function render() {
  const viewingSlot = document.getElementById("viewing-banner-slot");
  const groupBody = document.getElementById("group-card-body");
  const paymentBody = document.getElementById("payment-card-body");
  const listBody = document.getElementById("list-card-body");
  const resultBody = document.getElementById("result-card-body");
  const untangleBody = document.getElementById("untangle-card-body");
  const balancesBody = document.getElementById("balances-card-body");
  const shareBody = document.getElementById("share-card-body");
  const howBody = document.getElementById("how-card-body");
  const privacyBody = document.getElementById("privacy-strip-body");
  const dsaBody = document.getElementById("dsa-card-body");
  const ctaActions = document.getElementById("cta-actions");

  // Calculate results once (Rule 5: settle() for results)
  const result = settle(group);

  // 1. Viewing Banner
  if (viewingSlot) {
    renderViewingBanner(viewingSlot, {
      isViewing,
      badLink,
      group,
      onMakeCopy: handleMakeCopy
    });
  }

  // 2. Group Card
  if (groupBody) {
    renderGroupCard(groupBody, {
      group,
      onUpdateGroup: handleUpdateGroup,
      isViewing
    });
  }

  // 3. Payment Card
  if (paymentBody) {
    const editingExpense = editingId !== null ? group.expenses.find(function (e) { return e.id === editingId; }) : null;
    renderPaymentCard(paymentBody, {
      group,
      editingExpense,
      lastPayerId,
      onUpdateGroup: handleUpdateGroup,
      onCancelEdit: handleCancelEdit,
      isViewing
    });
  }

  // 4. Payments List
  if (listBody) {
    renderPaymentsList(listBody, {
      group,
      onEditExpense: handleEditExpense,
      onDeleteExpense: handleDeleteExpense,
      isViewing
    });
  }

  // 5. Result Card
  if (resultBody) {
    renderResultCard(resultBody, {
      group,
      result,
      onHoverTransfer: highlightTransferArrow,
      isViewing
    });
  }

  // 6. Untangle Card
  if (untangleBody) {
    renderUntangleCard(untangleBody, {
      group,
      result
    });
  }

  // 7. Balances Card
  if (balancesBody) {
    renderBalancesCard(balancesBody, {
      group,
      result
    });
  }

  // 8. Share Card
  if (shareBody) {
    renderShareCard(shareBody, {
      group,
      result
    });
  }

  // 9. How It Works
  if (howBody) {
    renderHowItWorks(howBody);
  }

  // 10. Privacy Strip
  if (privacyBody) {
    renderPrivacyStrip(privacyBody);
  }

  // 11. DSA Under the Hood
  if (dsaBody) {
    renderDsaSection(dsaBody, {
      group,
      result
    });
  }

  // 12. CTA Card Actions
  if (ctaActions) {
    renderCtaCard(ctaActions);
  }

  // 13. Update polite aria-live region (Rule 7: only announce result.headline)
  const ariaLive = document.getElementById("aria-live");
  if (ariaLive) {
    ariaLive.textContent = result.headline;
  }

  // Trigger scroll reveal observer for newly rendered cards
  initScrollReveal();
}

// Initialize state from storage or share link
function initState() {
  const hash = window.location.hash;
  if (hash.startsWith("#g=")) {
    const encoded = hash.slice(3);
    const decoded = decodeGroup(encoded);
    if (decoded.ok) {
      group = decoded.group;
      isViewing = true;
      badLink = false;
      render();
      return;
    } else {
      badLink = true;
    }
  }

  const loaded = loadGroup();
  if (loaded) {
    group = loaded;
  } else {
    group = newGroup("");
  }

  render();
}

// DOM Ready
document.addEventListener("DOMContentLoaded", function () {
  initStaticCopy();
  initLogoFallback();
  initThemeToggle();
  initLoader();
  initState();
});
