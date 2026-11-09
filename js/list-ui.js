// Payments List UI module: lists expenses in reverse chronological order, supports edit and delete with Undo.

import { fmtMoney, fmt, settle } from "./engine/split.js";
import { t } from "./copy.js";

// Helper to create SVG elements safely
function createSvg(tag, attrs = {}) {
  const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const [k, v] of Object.entries(attrs)) {
    el.setAttribute(k, v);
  }
  return el;
}

// Helper to get initials
function getInitials(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return [...parts[0]].slice(0, 2).join("").toUpperCase();
  const first = [...parts[0]][0] || "";
  const last = [...parts[parts.length - 1]][0] || "";
  return (first + last).toUpperCase();
}

export function renderPaymentsList(container, {
  group,
  onEditExpense,
  onDeleteExpense,
  isViewing = false
}) {
  // Update header total badge
  const totalBadge = document.getElementById("list-total-badge");
  if (totalBadge) {
    if (group.expenses.length > 0) {
      const result = settle(group);
      totalBadge.textContent = t("list.total", { amount: fmtMoney(result.total) });
    } else {
      totalBadge.textContent = "";
    }
  }

  // Clear container
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }

  const root = document.createElement("div");
  root.className = "payments-list-wrapper";

  // Empty state: drawn receipt SVG + message
  if (group.expenses.length === 0) {
    const emptyState = document.createElement("div");
    emptyState.className = "list-empty-state";

    // Drawn SVG receipt
    const receiptSvg = createSvg("svg", {
      viewBox: "0 0 64 64",
      width: "56",
      height: "56",
      fill: "none",
      class: "receipt-svg",
      "aria-hidden": "true"
    });

    const receiptBody = createSvg("path", {
      d: "M16 8 H48 V56 L42 52 L36 56 L30 52 L24 56 L16 50 Z",
      fill: "var(--surface-2)",
      stroke: "var(--border)",
      "stroke-width": "2",
      "stroke-linejoin": "round"
    });

    const line1 = createSvg("line", {
      x1: "24", y1: "20", x2: "40", y2: "20",
      stroke: "var(--muted)", "stroke-width": "2", "stroke-linecap": "round"
    });
    const line2 = createSvg("line", {
      x1: "24", y1: "28", x2: "36", y2: "28",
      stroke: "var(--muted)", "stroke-width": "2", "stroke-linecap": "round"
    });
    const line3 = createSvg("line", {
      x1: "24", y1: "36", x2: "40", y2: "36",
      stroke: "var(--brand)", "stroke-width": "2.5", "stroke-linecap": "round"
    });

    receiptSvg.appendChild(receiptBody);
    receiptSvg.appendChild(line1);
    receiptSvg.appendChild(line2);
    receiptSvg.appendChild(line3);

    const emptyMsg = document.createElement("p");
    emptyMsg.className = "list-empty-msg";
    emptyMsg.textContent = t("list.empty");

    emptyState.appendChild(receiptSvg);
    emptyState.appendChild(emptyMsg);
    root.appendChild(emptyState);
    container.appendChild(root);
    return;
  }

  // Expense rows: newest first
  const listItems = document.createElement("div");
  listItems.className = "payment-items-list";

  const reversedExpenses = [...group.expenses].reverse();
  const peopleMap = new Map(group.people.map(function (p, i) { return [p.id, { ...p, index: i }]; }));

  reversedExpenses.forEach(function (expense) {
    const payerInfo = peopleMap.get(expense.paidBy) || { name: "Someone", index: 0 };

    const row = document.createElement("div");
    row.className = "payment-row-item";
    row.dataset.id = String(expense.id);

    // Left info
    const leftInfo = document.createElement("div");
    leftInfo.className = "payment-row-info";

    const titleRow = document.createElement("div");
    titleRow.className = "payment-row-title-row";

    const labelSpan = document.createElement("span");
    labelSpan.className = "payment-row-label truncate";
    labelSpan.textContent = expense.label || t("payment.untitled");

    const amountSpan = document.createElement("span");
    amountSpan.className = "payment-row-amount tabular-nums";
    amountSpan.textContent = fmtMoney(expense.amount);

    titleRow.appendChild(labelSpan);
    titleRow.appendChild(amountSpan);

    const subRow = document.createElement("div");
    subRow.className = "payment-row-sub";

    const avatar = document.createElement("span");
    avatar.className = "avatar avatar-xs av-" + ((payerInfo.index % 8) + 1);
    avatar.textContent = getInitials(payerInfo.name);

    const payerText = document.createElement("span");
    payerText.className = "payment-payer-text truncate";
    payerText.textContent = t("list.row", {
      payer: payerInfo.name,
      amount: fmtMoney(expense.amount)
    });

    const dotDivider = document.createElement("span");
    dotDivider.className = "payment-sub-dot";
    dotDivider.textContent = "\u00B7"; // Middle dot ·

    const splitText = document.createElement("span");
    splitText.className = "payment-split-text";
    if (expense.split.length === group.people.length) {
      splitText.textContent = t("list.sharedByAll");
    } else {
      splitText.textContent = t("list.sharedBy", { count: fmt(expense.split.length) });
    }

    subRow.appendChild(avatar);
    subRow.appendChild(payerText);
    subRow.appendChild(dotDivider);
    subRow.appendChild(splitText);

    leftInfo.appendChild(titleRow);
    leftInfo.appendChild(subRow);
    row.appendChild(leftInfo);

    // Action buttons (hidden in viewing mode)
    if (!isViewing) {
      const actions = document.createElement("div");
      actions.className = "payment-row-actions";

      // Edit Button
      const editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.className = "btn-icon payment-action-btn";
      editBtn.setAttribute("aria-label", t("list.edit"));

      const editSvg = createSvg("svg", {
        viewBox: "0 0 24 24",
        width: "16",
        height: "16",
        fill: "none",
        stroke: "currentColor",
        "stroke-width": "2",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "aria-hidden": "true"
      });
      const editPath = createSvg("path", {
        d: "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
      });
      const editPoly = createSvg("path", {
        d: "M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
      });
      editSvg.appendChild(editPath);
      editSvg.appendChild(editPoly);
      editBtn.appendChild(editSvg);

      editBtn.addEventListener("click", function () {
        onEditExpense(expense.id);
      });

      // Delete Button
      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "btn-icon payment-action-btn delete-btn";
      deleteBtn.setAttribute("aria-label", t("list.delete"));

      const deleteSvg = createSvg("svg", {
        viewBox: "0 0 24 24",
        width: "16",
        height: "16",
        fill: "none",
        stroke: "currentColor",
        "stroke-width": "2",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "aria-hidden": "true"
      });
      const delPoly = createSvg("polyline", { points: "3 6 5 6 21 6" });
      const delPath = createSvg("path", {
        d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
      });
      deleteSvg.appendChild(delPoly);
      deleteSvg.appendChild(delPath);
      deleteBtn.appendChild(deleteSvg);

      deleteBtn.addEventListener("click", function () {
        row.classList.add("payment-row-collapsing");
        setTimeout(function () {
          onDeleteExpense(expense.id);
        }, 180);
      });

      actions.appendChild(editBtn);
      actions.appendChild(deleteBtn);
      row.appendChild(actions);
    }

    listItems.appendChild(row);
  });

  root.appendChild(listItems);
  container.appendChild(root);
}
