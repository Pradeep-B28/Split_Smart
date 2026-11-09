// Main entry point for Split Smart.
// Coordinates state, rendering, events, theme, and animations.

import { CONFIG } from "../config.js";
import { COPY, t } from "./copy.js";
import { newGroup, settle, decodeGroup, removeExpense } from "./engine/split.js";
import { getTheme, setTheme, loadGroup, saveGroup } from "./store.js";
import { renderGroupCard } from "./group-ui.js";
import { renderPaymentCard } from "./payment-ui.js";
import { renderPaymentsList } from "./list-ui.js";

// State
let group = newGroup("");
let previousGroup = null;
let editingId = null;
let lastPayerId = null;
let isViewing = false;
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
  if (resultCardTitle) resultCardTitle.textContent = t("result.empty");

  const untangleCardTitle = document.getElementById("untangle-card-title");
  if (untangleCardTitle) untangleCardTitle.textContent = t("untangle.after", { count: "0" }) || "Untangle";

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

// Updates group after a change
function handleUpdateGroup(newGrp, payerId = null) {
  group = newGrp;
  if (payerId) lastPayerId = payerId;
  if (!isViewing) saveGroup(group);
  render();
}

// Handles payment edit trigger
function handleEditExpense(id) {
  if (isViewing) return;
  editingId = id;
  render();
  const paymentCard = document.getElementById("payment-card");
  if (paymentCard) {
    paymentCard.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

// Handles payment edit cancel
function handleCancelEdit() {
  editingId = null;
  render();
}

// Handles payment delete with Undo
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

// Main render coordinator
export function render() {
  const groupBody = document.getElementById("group-card-body");
  const paymentBody = document.getElementById("payment-card-body");
  const listBody = document.getElementById("list-card-body");

  // Render Group Card
  if (groupBody) {
    renderGroupCard(groupBody, {
      group,
      onUpdateGroup: handleUpdateGroup,
      isViewing
    });
  }

  // Render Payment Card
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

  // Render Payments List
  if (listBody) {
    renderPaymentsList(listBody, {
      group,
      onEditExpense: handleEditExpense,
      onDeleteExpense: handleDeleteExpense,
      isViewing
    });
  }

  // Update Result Card preview (Rule 5: settle() for results)
  const result = settle(group);
  const resultCardTitle = document.getElementById("result-card-title");
  if (resultCardTitle) {
    resultCardTitle.textContent = group.expenses.length > 0 ? result.headline : t("result.empty");
  }

  // Update polite aria-live region (Rule 7: only announce result.headline)
  const ariaLive = document.getElementById("aria-live");
  if (ariaLive) {
    ariaLive.textContent = result.headline;
  }
}

// Initialize state from storage or share link
function initState() {
  // Check share hash #g=
  const hash = window.location.hash;
  if (hash.startsWith("#g=")) {
    const encoded = hash.slice(3);
    const decoded = decodeGroup(encoded);
    if (decoded.ok) {
      group = decoded.group;
      isViewing = true;
      render();
      return;
    }
  }

  // Otherwise load saved group from storage
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
