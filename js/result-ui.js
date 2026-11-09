// Result UI module: renders the settle-up headline with count-up, transfer cards, and manages the mobile sticky bar.

import { fmtMoney } from "./engine/split.js";
import { t } from "./copy.js";
import { animateCountUp, isReducedMotion } from "./motion.js";

function createSvg(tag, attrs = {}) {
  const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const [k, v] of Object.entries(attrs)) {
    el.setAttribute(k, v);
  }
  return el;
}

function getInitials(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return [...parts[0]].slice(0, 2).join("").toUpperCase();
  const first = [...parts[0]][0] || "";
  const last = [...parts[parts.length - 1]][0] || "";
  return (first + last).toUpperCase();
}

let lastRenderedHeadline = "";
let stickyObserver = null;

export function renderResultCard(container, {
  group,
  result,
  onHoverTransfer = null,
  isViewing = false
}) {
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }

  const root = document.createElement("div");
  root.className = "result-ui-wrapper";

  // Empty State: Drawn SVG of tangled lines becoming clean arrows + text
  if (result.empty) {
    const emptyWrapper = document.createElement("div");
    emptyWrapper.className = "result-empty-wrapper";

    const emptySvg = createSvg("svg", {
      viewBox: "0 0 120 72",
      width: "96",
      height: "58",
      fill: "none",
      class: "result-empty-svg",
      "aria-hidden": "true"
    });

    // Tangled looping path transitioning into two clean arrows
    const tanglePath = createSvg("path", {
      d: "M16 28 C28 48 38 12 50 40 C62 60 74 24 88 28 L104 28",
      stroke: "var(--tangle)",
      "stroke-width": "2.5",
      "stroke-linecap": "round",
      "stroke-dasharray": "4 4"
    });

    const cleanArrow1 = createSvg("path", {
      d: "M20 48 L96 48",
      stroke: "var(--brand)",
      "stroke-width": "3",
      "stroke-linecap": "round"
    });
    const head1 = createSvg("path", {
      d: "M90 42 L98 48 L90 54",
      stroke: "var(--brand)",
      "stroke-width": "3",
      "stroke-linecap": "round",
      "stroke-linejoin": "round"
    });

    emptySvg.appendChild(tanglePath);
    emptySvg.appendChild(cleanArrow1);
    emptySvg.appendChild(head1);

    const emptyTitle = document.createElement("h3");
    emptyTitle.className = "result-empty-title";
    emptyTitle.textContent = t("result.empty");

    const emptySub = document.createElement("p");
    emptySub.className = "result-empty-sub";
    emptySub.textContent = t("result.emptySub");

    emptyWrapper.appendChild(emptySvg);
    emptyWrapper.appendChild(emptyTitle);
    emptyWrapper.appendChild(emptySub);
    root.appendChild(emptyWrapper);
    container.appendChild(root);

    updateStickyBar(group, result);
    return;
  }

  // Active Results View
  // 1. Headline (at least 36px laptop, 26px phone, weight 800)
  const headlineEl = document.createElement("h3");
  headlineEl.className = "result-headline";

  if (lastRenderedHeadline !== result.headline) {
    animateCountUp(headlineEl, result.headline);
    lastRenderedHeadline = result.headline;
  } else {
    headlineEl.textContent = result.headline;
  }
  root.appendChild(headlineEl);

  // 2. Everyone is even (settled = true)
  if (result.settled) {
    const evenBox = document.createElement("div");
    evenBox.className = "result-even-box";

    const tickSvg = createSvg("svg", {
      viewBox: "0 0 32 32",
      width: "28",
      height: "28",
      fill: "none",
      "aria-hidden": "true"
    });
    const tickCircle = createSvg("circle", {
      cx: "16", cy: "16", r: "14",
      fill: "var(--brand-soft)",
      stroke: "var(--brand)",
      "stroke-width": "2"
    });
    const tickCheck = createSvg("path", {
      d: "M10 16 L14 20 L22 12",
      stroke: "var(--brand-strong)",
      "stroke-width": "3",
      "stroke-linecap": "round",
      "stroke-linejoin": "round"
    });
    tickSvg.appendChild(tickCircle);
    tickSvg.appendChild(tickCheck);

    const evenText = document.createElement("span");
    evenText.className = "result-even-text";
    evenText.textContent = t("result.even");

    evenBox.appendChild(tickSvg);
    evenBox.appendChild(evenText);
    root.appendChild(evenBox);
  } else {
    // 3. Who pays whom: Transfer Cards
    const transfersSection = document.createElement("div");
    transfersSection.className = "transfers-section";

    const transfersTitle = document.createElement("h4");
    transfersTitle.className = "transfers-heading";
    transfersTitle.textContent = t("result.transfersHeading");
    transfersSection.appendChild(transfersTitle);

    const cardsList = document.createElement("div");
    cardsList.className = "transfer-cards-list";

    const peopleIndexMap = new Map(group.people.map(function (p, i) { return [p.id, i]; }));

    result.transfers.forEach(function (trans, idx) {
      const card = document.createElement("div");
      card.className = "transfer-card";
      card.dataset.from = String(trans.from);
      card.dataset.to = String(trans.to);

      if (!isReducedMotion()) {
        card.style.animationDelay = (idx * 60) + "ms";
      }

      // Left: Payer
      const payerCol = document.createElement("div");
      payerCol.className = "transfer-party transfer-payer";

      const fromIdx = peopleIndexMap.get(trans.from) ?? 0;
      const payerAv = document.createElement("span");
      payerAv.className = "avatar av-" + ((fromIdx % 8) + 1);
      payerAv.textContent = getInitials(trans.fromName);

      const payerName = document.createElement("span");
      payerName.className = "transfer-name truncate";
      payerName.textContent = trans.fromName;

      payerCol.appendChild(payerAv);
      payerCol.appendChild(payerName);

      // Middle: Arrow and Amount
      const middleCol = document.createElement("div");
      middleCol.className = "transfer-middle";

      const amountLabel = document.createElement("span");
      amountLabel.className = "transfer-amount tabular-nums";
      amountLabel.textContent = fmtMoney(trans.amount);

      const arrowSvg = createSvg("svg", {
        viewBox: "0 0 64 16",
        width: "56",
        height: "14",
        fill: "none",
        class: "transfer-arrow-svg",
        "aria-hidden": "true"
      });
      const arrowLine = createSvg("path", {
        d: "M2 8 L58 8",
        stroke: "url(#brand-line-grad)",
        "stroke-width": "2.5",
        "stroke-linecap": "round",
        class: "transfer-arrow-line"
      });
      const arrowHead = createSvg("path", {
        d: "M52 3 L59 8 L52 13",
        stroke: "var(--brand)",
        "stroke-width": "2.5",
        "stroke-linecap": "round",
        "stroke-linejoin": "round"
      });
      arrowSvg.appendChild(arrowLine);
      arrowSvg.appendChild(arrowHead);

      middleCol.appendChild(amountLabel);
      middleCol.appendChild(arrowSvg);

      // Right: Receiver
      const receiverCol = document.createElement("div");
      receiverCol.className = "transfer-party transfer-receiver";

      const toIdx = peopleIndexMap.get(trans.to) ?? 1;
      const receiverAv = document.createElement("span");
      receiverAv.className = "avatar av-" + ((toIdx % 8) + 1);
      receiverAv.textContent = getInitials(trans.toName);

      const receiverName = document.createElement("span");
      receiverName.className = "transfer-name truncate";
      receiverName.textContent = trans.toName;

      receiverCol.appendChild(receiverAv);
      receiverCol.appendChild(receiverName);

      card.appendChild(payerCol);
      card.appendChild(middleCol);
      card.appendChild(receiverCol);

      // Hover link with untangle diagram
      if (onHoverTransfer) {
        card.addEventListener("mouseenter", function () {
          onHoverTransfer(trans.from, trans.to);
        });
        card.addEventListener("mouseleave", function () {
          onHoverTransfer(null, null);
        });
      }

      cardsList.appendChild(card);
    });

    transfersSection.appendChild(cardsList);
    root.appendChild(transfersSection);
  }

  // 4. Bottom Summary: Total Spent & Saved note
  const summaryRow = document.createElement("div");
  summaryRow.className = "result-summary-row";

  const totalSpentEl = document.createElement("span");
  totalSpentEl.className = "result-total-spent";
  totalSpentEl.textContent = t("result.total") + ": " + fmtMoney(result.total);
  summaryRow.appendChild(totalSpentEl);

  if (!isViewing) {
    const savedEl = document.createElement("span");
    savedEl.className = "result-saved-badge";

    const devSvg = createSvg("svg", {
      viewBox: "0 0 24 24",
      width: "14",
      height: "14",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "2",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      "aria-hidden": "true"
    });
    const rect = createSvg("rect", {
      x: "5", y: "2", width: "14", height: "20", rx: "2", ry: "2"
    });
    const dot = createSvg("line", {
      x1: "12", y1: "18", x2: "12.01", y2: "18"
    });
    devSvg.appendChild(rect);
    devSvg.appendChild(dot);

    const savedText = document.createElement("span");
    savedText.textContent = t("result.saved");

    savedEl.appendChild(devSvg);
    savedEl.appendChild(savedText);
    summaryRow.appendChild(savedEl);
  }

  root.appendChild(summaryRow);
  container.appendChild(root);

  updateStickyBar(group, result);
}

// Phone sticky bottom bar coordinator
function updateStickyBar(group, result) {
  const bar = document.getElementById("phone-sticky-bar");
  const countEl = document.getElementById("phone-sticky-count");
  const btn = document.getElementById("phone-sticky-btn");
  const resultCard = document.getElementById("result-card");

  if (!bar || !countEl || !btn || !resultCard) return;

  if (group.expenses.length === 0) {
    bar.classList.remove("active");
    if (stickyObserver) stickyObserver.disconnect();
    return;
  }

  const T = result.transfers.length;
  countEl.textContent = T === 0 ? t("result.even") : (T === 1 ? "1 transfer" : T + " transfers");

  btn.onclick = function () {
    resultCard.scrollIntoView({
      behavior: isReducedMotion() ? "auto" : "smooth",
      block: "start"
    });
  };

  if (typeof IntersectionObserver !== "undefined") {
    if (stickyObserver) stickyObserver.disconnect();
    stickyObserver = new IntersectionObserver(function (entries) {
      const entry = entries[0];
      if (!entry.isIntersecting && window.innerWidth < 1024) {
        bar.classList.add("active");
      } else {
        bar.classList.remove("active");
      }
    }, { threshold: 0.15 });

    stickyObserver.observe(resultCard);
  }
}
