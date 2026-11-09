// Balances UI module: renders the net standing of each person with bidirectional bars and detail breakdown.

import { CONFIG } from "../config.js";
import { fmtMoney } from "./engine/split.js";
import { t } from "./copy.js";

function getInitials(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return [...parts[0]].slice(0, 2).join("").toUpperCase();
  const first = [...parts[0]][0] || "";
  const last = [...parts[parts.length - 1]][0] || "";
  return (first + last).toUpperCase();
}

export function renderBalancesCard(container, { group, result }) {
  const cardElem = document.getElementById("balances-card");

  if (!CONFIG.features.balances || result.empty || group.people.length === 0) {
    if (cardElem) cardElem.classList.add("hidden");
    return;
  }
  if (cardElem) cardElem.classList.remove("hidden");

  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }

  const root = document.createElement("div");
  root.className = "balances-wrapper";

  const maxNet = Math.max(...result.balances.map(function (b) { return Math.abs(b.net); }), 1);

  result.balances.forEach(function (personBalance, i) {
    const row = document.createElement("div");
    row.className = "balance-person-row";

    // Top line: avatar + name (left), status text (right)
    const headerLine = document.createElement("div");
    headerLine.className = "balance-person-header";

    const leftPart = document.createElement("div");
    leftPart.className = "balance-person-identity";

    const avatar = document.createElement("span");
    avatar.className = "avatar avatar-sm av-" + ((i % 8) + 1);
    avatar.textContent = getInitials(personBalance.name);

    const nameText = document.createElement("span");
    nameText.className = "balance-person-name truncate";
    nameText.textContent = personBalance.name;

    leftPart.appendChild(avatar);
    leftPart.appendChild(nameText);

    const statusText = document.createElement("span");
    statusText.className = "balance-status-text tabular-nums";

    if (personBalance.net > 0) {
      statusText.classList.add("status-gets");
      statusText.textContent = t("balances.getsBack", { amount: fmtMoney(personBalance.net) });
    } else if (personBalance.net < 0) {
      statusText.classList.add("status-owes");
      statusText.textContent = t("balances.owes", { amount: fmtMoney(Math.abs(personBalance.net)) });
    } else {
      statusText.classList.add("status-even");
      statusText.textContent = t("balances.even");
    }

    headerLine.appendChild(leftPart);
    headerLine.appendChild(statusText);
    row.appendChild(headerLine);

    // Middle: Bidirectional Bar track with center mark
    const barTrack = document.createElement("div");
    barTrack.className = "balance-bar-track";

    const centerLine = document.createElement("div");
    centerLine.className = "balance-bar-center";
    barTrack.appendChild(centerLine);

    const barFill = document.createElement("div");
    barFill.className = "balance-bar-fill";

    const ratio = Math.min(Math.abs(personBalance.net) / maxNet, 1);
    const halfWidthPct = ratio * 50; // max 50% of track from center

    if (personBalance.net > 0) {
      barFill.classList.add("bar-gets");
      barFill.style.left = "50%";
      barFill.style.width = halfWidthPct + "%";
    } else if (personBalance.net < 0) {
      barFill.classList.add("bar-owes");
      barFill.style.right = "50%";
      barFill.style.width = halfWidthPct + "%";
    }

    barTrack.appendChild(barFill);
    row.appendChild(barTrack);

    // Bottom: Detail line "Paid ₹X, share ₹Y"
    const detailLine = document.createElement("div");
    detailLine.className = "balance-detail-line tabular-nums";
    detailLine.textContent = t("balances.detail", {
      paid: fmtMoney(personBalance.paid),
      share: fmtMoney(personBalance.share)
    });
    row.appendChild(detailLine);

    root.appendChild(row);
  });

  container.appendChild(root);
}
