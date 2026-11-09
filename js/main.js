// Main entry point for Split Smart.
// Coordinates state, rendering, events, theme, and animations.

import { CONFIG } from "../config.js";
import { COPY, t } from "./copy.js";
import { getTheme, setTheme } from "./store.js";

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

// Logo image fallback: show "Wrench Wise" as plain text if logo image fails
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

// Theme toggle logic
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

// Initialize on DOM ready
document.addEventListener("DOMContentLoaded", function () {
  initStaticCopy();
  initLogoFallback();
  initThemeToggle();
  initLoader();
});
