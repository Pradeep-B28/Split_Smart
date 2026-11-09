// Untangle UI module: visualizes the tangled direct debts transforming into the minimal transfers.

import { CONFIG } from "../config.js";
import { fmtMoney, fmt } from "./engine/split.js";
import { t } from "./copy.js";
import { isReducedMotion } from "./motion.js";

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

let untangleTimer = null;

export function renderUntangleCard(container, { group, result }) {
  const cardElem = document.getElementById("untangle-card");

  // Hidden when there are no payments or if disabled
  if (!CONFIG.features.untangle || result.empty || group.expenses.length === 0) {
    if (cardElem) cardElem.classList.add("hidden");
    return;
  }
  if (cardElem) cardElem.classList.remove("hidden");

  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }

  const root = document.createElement("div");
  root.className = "untangle-wrapper";

  // Label row
  const headerRow = document.createElement("div");
  headerRow.className = "untangle-header-row";

  const statusLabel = document.createElement("div");
  statusLabel.className = "untangle-status-label";
  headerRow.appendChild(statusLabel);

  const replayBtn = document.createElement("button");
  replayBtn.type = "button";
  replayBtn.className = "btn btn-ghost btn-sm untangle-replay-btn";
  replayBtn.textContent = t("untangle.replay");
  headerRow.appendChild(replayBtn);

  root.appendChild(headerRow);

  // SVG Diagram
  const SIZE = 360;
  const CENTER = SIZE / 2;
  const RADIUS = 118;
  const AVATAR_R = 16;
  const N = group.people.length;

  const svg = createSvg("svg", {
    viewBox: `0 0 ${SIZE} ${SIZE}`,
    class: "untangle-svg",
    "aria-label": "Untangle transfers diagram"
  });

  // Gradient definition
  const defs = createSvg("defs");
  const grad = createSvg("linearGradient", {
    id: "untangle-brand-grad",
    x1: "0%", y1: "0%", x2: "100%", y2: "100%"
  });
  grad.appendChild(createSvg("stop", { offset: "0%", "stop-color": "#059669" }));
  grad.appendChild(createSvg("stop", { offset: "50%", "stop-color": "#0D9488" }));
  grad.appendChild(createSvg("stop", { offset: "100%", "stop-color": "#06B6D4" }));
  defs.appendChild(grad);

  // Arrow markers
  const markerTangle = createSvg("marker", {
    id: "marker-tangle",
    viewBox: "0 0 10 10",
    refX: "7", refY: "5",
    markerWidth: "6", markerHeight: "6",
    orient: "auto-start-reverse"
  });
  markerTangle.appendChild(createSvg("path", {
    d: "M0 1 L8 5 L0 9 Z",
    fill: "var(--tangle)"
  }));
  defs.appendChild(markerTangle);

  const markerBrand = createSvg("marker", {
    id: "marker-brand",
    viewBox: "0 0 10 10",
    refX: "7", refY: "5",
    markerWidth: "6", markerHeight: "6",
    orient: "auto-start-reverse"
  });
  markerBrand.appendChild(createSvg("path", {
    d: "M0 1 L8 5 L0 9 Z",
    fill: "#059669"
  }));
  defs.appendChild(markerBrand);

  svg.appendChild(defs);

  // Calculate coordinates for each person
  const coords = new Map();
  group.people.forEach(function (person, i) {
    const angle = (2 * Math.PI * i) / Math.max(N, 1) - Math.PI / 2;
    const x = CENTER + RADIUS * Math.cos(angle);
    const y = CENTER + RADIUS * Math.sin(angle);
    coords.set(person.id, { x, y, angle, index: i, name: person.name });
  });

  // Group for Direct Debt lines (Phase 1)
  const directGroup = createSvg("g", { class: "direct-debts-layer" });
  result.direct.forEach(function (debt) {
    const from = coords.get(debt.from);
    const to = coords.get(debt.to);
    if (!from || !to) return;

    // Shorten line slightly to not overlap avatar circle
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dist = Math.hypot(dx, dy) || 1;
    const x1 = from.x + (dx / dist) * AVATAR_R;
    const y1 = from.y + (dy / dist) * AVATAR_R;
    const x2 = to.x - (dx / dist) * (AVATAR_R + 4);
    const y2 = to.y - (dy / dist) * (AVATAR_R + 4);

    const path = createSvg("line", {
      x1: String(x1), y1: String(y1),
      x2: String(x2), y2: String(y2),
      stroke: "var(--tangle)",
      "stroke-width": "1.5",
      "stroke-dasharray": "3 2",
      "marker-end": "url(#marker-tangle)",
      class: "direct-line"
    });
    directGroup.appendChild(path);
  });
  svg.appendChild(directGroup);

  // Group for Minimal Transfer lines (Phase 2)
  const transferGroup = createSvg("g", { class: "transfer-debts-layer" });
  const transferLinesMap = [];

  result.transfers.forEach(function (trans) {
    const from = coords.get(trans.from);
    const to = coords.get(trans.to);
    if (!from || !to) return;

    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dist = Math.hypot(dx, dy) || 1;
    const x1 = from.x + (dx / dist) * AVATAR_R;
    const y1 = from.y + (dy / dist) * AVATAR_R;
    const x2 = to.x - (dx / dist) * (AVATAR_R + 6);
    const y2 = to.y - (dy / dist) * (AVATAR_R + 6);

    const gTrans = createSvg("g", {
      class: "transfer-arrow-group",
      "data-from": String(trans.from),
      "data-to": String(trans.to)
    });

    const line = createSvg("line", {
      x1: String(x1), y1: String(y1),
      x2: String(x2), y2: String(y2),
      stroke: "url(#untangle-brand-grad)",
      "stroke-width": "3",
      "marker-end": "url(#marker-brand)",
      class: "transfer-arrow-path"
    });

    // Amount pill in middle of line
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;

    const pillBg = createSvg("rect", {
      x: String(midX - 28),
      y: String(midY - 9),
      width: "56",
      height: "18",
      rx: "9",
      ry: "9",
      fill: "var(--surface)",
      stroke: "var(--brand-soft)",
      "stroke-width": "1",
      class: "transfer-pill-bg"
    });

    const pillText = createSvg("text", {
      x: String(midX),
      y: String(midY + 4),
      "text-anchor": "middle",
      fill: "var(--brand-strong)",
      "font-size": "10",
      "font-weight": "700",
      class: "transfer-pill-text"
    });
    pillText.textContent = fmtMoney(trans.amount);

    gTrans.appendChild(line);
    gTrans.appendChild(pillBg);
    gTrans.appendChild(pillText);
    transferGroup.appendChild(gTrans);

    transferLinesMap.push({ from: trans.from, to: trans.to, element: gTrans });
  });
  svg.appendChild(transferGroup);

  // Group for Person Avatars and Labels
  const peopleGroup = createSvg("g", { class: "untangle-people-layer" });
  group.people.forEach(function (person, i) {
    const pt = coords.get(person.id);
    if (!pt) return;

    const gPerson = createSvg("g", {
      class: "untangle-person",
      "data-id": String(person.id)
    });

    // Avatar background circle
    const avatarCircle = createSvg("circle", {
      cx: String(pt.x),
      cy: String(pt.y),
      r: String(AVATAR_R),
      fill: `var(--av-${(i % 8) + 1})`,
      stroke: "var(--surface)",
      "stroke-width": "2",
      class: "untangle-avatar-circle"
    });

    // Initials text
    const initials = createSvg("text", {
      x: String(pt.x),
      y: String(pt.y + 4),
      "text-anchor": "middle",
      fill: "#FFFFFF",
      "font-size": "11",
      "font-weight": "800",
      class: "untangle-initials"
    });
    initials.textContent = getInitials(person.name);

    gPerson.appendChild(avatarCircle);
    gPerson.appendChild(initials);

    // Show name label outside circle when N <= 8
    if (N <= 8) {
      const labelDist = AVATAR_R + 14;
      const lx = pt.x + labelDist * Math.cos(pt.angle);
      const ly = pt.y + labelDist * Math.sin(pt.angle) + 4;

      const nameText = createSvg("text", {
        x: String(lx),
        y: String(ly),
        "text-anchor": Math.abs(Math.cos(pt.angle)) < 0.2 ? "middle" : (Math.cos(pt.angle) > 0 ? "start" : "end"),
        fill: "var(--text-2)",
        "font-size": "11",
        "font-weight": "600",
        class: "untangle-name-label"
      });
      nameText.textContent = person.name;
      gPerson.appendChild(nameText);
    } else {
      // Accessible tooltip for N > 8
      const titleEl = createSvg("title");
      titleEl.textContent = person.name;
      gPerson.appendChild(titleEl);
    }

    peopleGroup.appendChild(gPerson);
  });
  svg.appendChild(peopleGroup);

  root.appendChild(svg);
  container.appendChild(root);

  // Animation controller
  function playAnimation() {
    if (untangleTimer) clearTimeout(untangleTimer);

    if (isReducedMotion()) {
      directGroup.style.opacity = "0";
      directGroup.style.display = "none";
      transferGroup.style.opacity = "1";
      transferGroup.style.display = "block";
      statusLabel.textContent = t("untangle.after", { count: fmt(result.counts.transfers) });
      return;
    }

    // Phase 1: show thin direct debts
    directGroup.style.display = "block";
    directGroup.style.opacity = "1";
    directGroup.style.transition = "opacity 300ms var(--ease)";
    transferGroup.style.opacity = "0";
    transferGroup.style.transition = "opacity 400ms var(--ease)";
    statusLabel.textContent = t("untangle.before", { count: fmt(result.counts.directDebts) });

    // Phase 2: transition into transfers after 600ms
    untangleTimer = setTimeout(function () {
      directGroup.style.opacity = "0";
      setTimeout(function () {
        directGroup.style.display = "none";
      }, 300);

      transferGroup.style.opacity = "1";
      statusLabel.textContent = t("untangle.after", { count: fmt(result.counts.transfers) });
    }, 600);
  }

  replayBtn.addEventListener("click", playAnimation);
  playAnimation();
}

// External hook to highlight transfer arrow from result card hover
export function highlightTransferArrow(fromId, toId) {
  const groups = document.querySelectorAll(".transfer-arrow-group");
  if (!fromId && !toId) {
    groups.forEach(function (g) {
      g.classList.remove("highlighted", "dimmed");
    });
    return;
  }
  groups.forEach(function (g) {
    if (g.dataset.from === String(fromId) && g.dataset.to === String(toId)) {
      g.classList.add("highlighted");
      g.classList.remove("dimmed");
    } else {
      g.classList.add("dimmed");
      g.classList.remove("highlighted");
    }
  });
}
