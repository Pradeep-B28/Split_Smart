// Sections UI module: How it works, Privacy strip, DSA Under the Hood, and CTA.

import { CONFIG } from "../config.js";
import { fmt } from "./engine/split.js";
import { t } from "./copy.js";
import { buildProgramUrl, buildSalesWhatsAppUrl } from "./links.js";

function createSvg(tag, attrs = {}) {
  const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const [k, v] of Object.entries(attrs)) {
    el.setAttribute(k, v);
  }
  return el;
}

// 1. How It Works Section
export function renderHowItWorks(container) {
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }

  const root = document.createElement("div");
  root.className = "how-steps-grid";

  const steps = [
    { num: "1", text: t("how.one"), icon: "users" },
    { num: "2", text: t("how.two"), icon: "receipt" },
    { num: "3", text: t("how.three"), icon: "check" }
  ];

  steps.forEach(function (step) {
    const card = document.createElement("div");
    card.className = "how-step-card";

    const numBadge = document.createElement("span");
    numBadge.className = "how-step-badge";
    numBadge.textContent = step.num;

    const desc = document.createElement("p");
    desc.className = "how-step-text";
    desc.textContent = step.text;

    card.appendChild(numBadge);
    card.appendChild(desc);
    root.appendChild(card);
  });

  container.appendChild(root);
}

// 2. Privacy Strip Section
export function renderPrivacyStrip(container) {
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }

  const root = document.createElement("div");
  root.className = "privacy-strip-content";

  const shieldSvg = createSvg("svg", {
    viewBox: "0 0 24 24",
    width: "36",
    height: "36",
    fill: "none",
    stroke: "var(--brand)",
    "stroke-width": "2",
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
    class: "privacy-shield-svg",
    "aria-hidden": "true"
  });
  const shieldPath = createSvg("path", {
    d: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
  });
  const checkPath = createSvg("path", {
    d: "M9 12l2 2 4-4"
  });
  shieldSvg.appendChild(shieldPath);
  shieldSvg.appendChild(checkPath);

  const textCol = document.createElement("div");
  textCol.className = "privacy-strip-text-col";

  const line = document.createElement("p");
  line.className = "privacy-line";
  line.textContent = t("privacy.line");

  const proof = document.createElement("p");
  proof.className = "privacy-proof";
  proof.textContent = t("privacy.proof");

  textCol.appendChild(line);
  textCol.appendChild(proof);

  root.appendChild(shieldSvg);
  root.appendChild(textCol);
  container.appendChild(root);
}

// 3. DSA Section (Under the Hood)
export function renderDsaSection(container, { group, result }) {
  const cardElem = document.getElementById("dsa-card");

  if (!CONFIG.features.underTheHood) {
    if (cardElem) cardElem.classList.add("hidden");
    return;
  }
  if (cardElem) cardElem.classList.remove("hidden");

  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }

  const root = document.createElement("div");
  root.className = "dsa-cards-grid";

  const hasPayments = group.expenses.length > 0;

  // 1. Hash Map Card
  const mapCard = document.createElement("div");
  mapCard.className = "dsa-card-item";

  const mapTitle = document.createElement("h4");
  mapTitle.className = "dsa-card-title";
  mapTitle.textContent = t("hood.mapTitle");

  const mapBody = document.createElement("p");
  mapBody.className = "dsa-card-body";
  mapBody.textContent = t("hood.map");

  mapCard.appendChild(mapTitle);
  mapCard.appendChild(mapBody);

  if (hasPayments) {
    const mapLive = document.createElement("div");
    mapLive.className = "dsa-live-badge tabular-nums";
    mapLive.textContent = t("hood.mapLive", { updates: fmt(result.dsa.mapUpdates) });
    mapCard.appendChild(mapLive);
  }
  root.appendChild(mapCard);

  // 2. Smart Pairing Card
  const pairCard = document.createElement("div");
  pairCard.className = "dsa-card-item";

  const pairTitle = document.createElement("h4");
  pairTitle.className = "dsa-card-title";
  pairTitle.textContent = t("hood.pairTitle");

  const pairBody = document.createElement("p");
  pairBody.className = "dsa-card-body";
  pairBody.textContent = t("hood.pair");

  pairCard.appendChild(pairTitle);
  pairCard.appendChild(pairBody);

  if (hasPayments) {
    const pairLive = document.createElement("div");
    pairLive.className = "dsa-live-badge tabular-nums";
    pairLive.textContent = t("hood.pairLive", {
      subsets: fmt(result.dsa.subsetsChecked),
      groups: fmt(result.dsa.zeroGroups)
    });
    pairCard.appendChild(pairLive);
  }
  root.appendChild(pairCard);

  // 3. Greedy Matching Card
  const greedyCard = document.createElement("div");
  greedyCard.className = "dsa-card-item";

  const greedyTitle = document.createElement("h4");
  greedyTitle.className = "dsa-card-title";
  greedyTitle.textContent = t("hood.greedyTitle");

  const greedyBody = document.createElement("p");
  greedyBody.className = "dsa-card-body";
  greedyBody.textContent = t("hood.greedy");

  greedyCard.appendChild(greedyTitle);
  greedyCard.appendChild(greedyBody);

  if (hasPayments) {
    const greedyLive = document.createElement("div");
    greedyLive.className = "dsa-live-badge tabular-nums";
    greedyLive.textContent = t("hood.greedyLive", {
      transfers: fmt(result.counts.transfers),
      direct: fmt(result.counts.directDebts)
    });
    greedyCard.appendChild(greedyLive);

    // Show greedyBeat only when plainGreedy > transfers
    if (result.counts.plainGreedy > result.counts.transfers) {
      const savedDiff = result.counts.plainGreedy - result.counts.transfers;
      const beatBadge = document.createElement("div");
      beatBadge.className = "dsa-beat-badge tabular-nums";
      beatBadge.textContent = t("hood.greedyBeat", {
        plain: fmt(result.counts.plainGreedy),
        saved: fmt(savedDiff)
      });
      greedyCard.appendChild(beatBadge);
    }
  }
  root.appendChild(greedyCard);

  container.appendChild(root);
}

// 4. CTA Card Section
export function renderCtaCard(container) {
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }

  const programUrl = buildProgramUrl();
  const salesWaUrl = buildSalesWhatsAppUrl();

  const programBtn = document.createElement("a");
  programBtn.className = "btn btn-primary cta-btn";
  programBtn.href = programUrl;
  programBtn.target = "_blank";
  programBtn.rel = "noopener noreferrer";
  programBtn.textContent = t("cta.button");
  container.appendChild(programBtn);

  if (salesWaUrl) {
    const waBtn = document.createElement("a");
    waBtn.className = "btn btn-secondary cta-btn";
    waBtn.href = salesWaUrl;
    waBtn.target = "_blank";
    waBtn.rel = "noopener noreferrer";
    waBtn.textContent = t("cta.whatsApp");
    container.appendChild(waBtn);
  }
}
