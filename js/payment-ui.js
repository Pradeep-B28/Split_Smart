// Payment UI module: handles adding and editing payments, live share hint, and person pickers.

import { parseAmount, fmtMoney, shares, cleanText, addExpense, updateExpense } from "./engine/split.js";
import { t } from "./copy.js";

// Helper to get initials
function getInitials(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return [...parts[0]].slice(0, 2).join("").toUpperCase();
  const first = [...parts[0]][0] || "";
  const last = [...parts[parts.length - 1]][0] || "";
  return (first + last).toUpperCase();
}

export function renderPaymentCard(container, {
  group,
  editingExpense = null,
  lastPayerId = null,
  onUpdateGroup,
  onCancelEdit,
  isViewing = false
}) {
  const cardTitle = document.getElementById("payment-card-title");
  if (cardTitle) {
    cardTitle.textContent = editingExpense ? t("payment.editHeading") : t("payment.heading");
  }

  // Clear container
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }

  // If in viewing mode, payment card is completely hidden per Section 6-I
  const cardElem = document.getElementById("payment-card");
  if (isViewing) {
    if (cardElem) cardElem.classList.add("hidden");
    return;
  }
  if (cardElem) cardElem.classList.remove("hidden");

  // If fewer than 2 people, show disabled state with soft overlay
  const isNeedTwo = group.people.length < 2;

  const root = document.createElement("div");
  root.className = "payment-ui-wrapper" + (isNeedTwo ? " payment-disabled" : "");

  if (isNeedTwo) {
    const disabledOverlay = document.createElement("div");
    disabledOverlay.className = "payment-disabled-overlay";

    const overlayMsg = document.createElement("p");
    overlayMsg.className = "payment-disabled-msg";
    overlayMsg.textContent = t("group.needTwo");

    disabledOverlay.appendChild(overlayMsg);
    root.appendChild(disabledOverlay);
  }

  // Local state for draft
  let selectedPayerId = editingExpense
    ? editingExpense.paidBy
    : (lastPayerId && group.people.some(function (p) { return p.id === lastPayerId; }))
      ? lastPayerId
      : (group.people[0] ? group.people[0].id : null);

  let selectedSplitIds = editingExpense
    ? [...editingExpense.split]
    : group.people.map(function (p) { return p.id; });

  // 1. Amount Field
  const amountGroup = document.createElement("div");
  amountGroup.className = "form-group";

  const amountLabel = document.createElement("label");
  amountLabel.className = "form-label";
  amountLabel.htmlFor = "amount";
  amountLabel.textContent = t("payment.amount");

  const amountWrapper = document.createElement("div");
  amountWrapper.className = "amount-input-wrapper";

  const amountSymbol = document.createElement("span");
  amountSymbol.className = "amount-symbol";
  amountSymbol.setAttribute("aria-hidden", "true");
  amountSymbol.textContent = "\u20B9"; // Rupee symbol ₹

  // Must match <input id="amount" inputmode="decimal"> for Rule 13 and verify.mjs
  const amountInput = document.createElement("input");
  amountInput.id = "amount";
  amountInput.inputMode = "decimal";
  amountInput.autocomplete = "off";
  amountInput.className = "form-input amount-input";
  amountInput.placeholder = t("payment.amountPlaceholder") || "0";
  if (isNeedTwo) amountInput.disabled = true;

  if (editingExpense) {
    const r = editingExpense.amount / 100;
    amountInput.value = editingExpense.amount % 100 === 0 ? String(r) : r.toFixed(2);
  }

  const amountError = document.createElement("div");
  amountError.id = "amount-error";
  amountError.className = "form-error";
  amountError.setAttribute("aria-live", "polite");

  amountWrapper.appendChild(amountSymbol);
  amountWrapper.appendChild(amountInput);
  amountGroup.appendChild(amountLabel);
  amountGroup.appendChild(amountWrapper);
  amountGroup.appendChild(amountError);
  root.appendChild(amountGroup);

  // 2. What for (Label) Field
  const labelGroup = document.createElement("div");
  labelGroup.className = "form-group";

  const labelFieldLabel = document.createElement("label");
  labelFieldLabel.className = "form-label";
  labelFieldLabel.htmlFor = "payment-label";
  labelFieldLabel.textContent = t("payment.label");

  const labelInput = document.createElement("input");
  labelInput.id = "payment-label";
  labelInput.type = "text";
  labelInput.className = "form-input";
  labelInput.placeholder = t("payment.labelPlaceholder");
  labelInput.maxLength = 40;
  if (isNeedTwo) labelInput.disabled = true;
  if (editingExpense) labelInput.value = editingExpense.label;

  const labelError = document.createElement("div");
  labelError.className = "form-error";
  labelError.setAttribute("aria-live", "polite");

  labelGroup.appendChild(labelFieldLabel);
  labelGroup.appendChild(labelInput);
  labelGroup.appendChild(labelError);
  root.appendChild(labelGroup);

  // 3. Paid by Field (pills, single-select)
  const paidByGroup = document.createElement("div");
  paidByGroup.className = "form-group";

  const paidByLabel = document.createElement("span");
  paidByLabel.className = "form-label";
  paidByLabel.textContent = t("payment.paidBy");
  paidByGroup.appendChild(paidByLabel);

  const payerPillsContainer = document.createElement("div");
  payerPillsContainer.className = "pills-container";

  function renderPayerPills() {
    while (payerPillsContainer.firstChild) {
      payerPillsContainer.removeChild(payerPillsContainer.firstChild);
    }
    group.people.forEach(function (person, index) {
      const isSelected = person.id === selectedPayerId;
      const pill = document.createElement("button");
      pill.type = "button";
      pill.className = "pill payer-pill" + (isSelected ? " selected" : "");
      pill.setAttribute("aria-pressed", isSelected ? "true" : "false");
      if (isNeedTwo) pill.disabled = true;

      const avatar = document.createElement("span");
      avatar.className = "avatar av-" + ((index % 8) + 1);
      avatar.textContent = getInitials(person.name);

      const nameSpan = document.createElement("span");
      nameSpan.className = "truncate";
      nameSpan.textContent = person.name;

      pill.appendChild(avatar);
      pill.appendChild(nameSpan);

      pill.addEventListener("click", function () {
        selectedPayerId = person.id;
        renderPayerPills();
        updateShareHint();
      });

      payerPillsContainer.appendChild(pill);
    });
  }

  renderPayerPills();
  paidByGroup.appendChild(payerPillsContainer);
  root.appendChild(paidByGroup);

  // 4. Split between Field (chips, multi-select, plus Everyone chip)
  const splitGroup = document.createElement("div");
  splitGroup.className = "form-group";

  const splitLabel = document.createElement("span");
  splitLabel.className = "form-label";
  splitLabel.textContent = t("payment.splitWith");
  splitGroup.appendChild(splitLabel);

  const splitChipsContainer = document.createElement("div");
  splitChipsContainer.className = "chips-container";

  // Everyone Chip
  const everyoneChip = document.createElement("button");
  everyoneChip.type = "button";
  everyoneChip.className = "chip everyone-chip";
  everyoneChip.textContent = t("payment.everyone");
  if (isNeedTwo) everyoneChip.disabled = true;

  function updateEveryoneChip() {
    const isAll = group.people.length > 0 && selectedSplitIds.length === group.people.length;
    everyoneChip.setAttribute("aria-pressed", isAll ? "true" : "false");
    if (isAll) {
      everyoneChip.classList.add("selected");
    } else {
      everyoneChip.classList.remove("selected");
    }
  }

  everyoneChip.addEventListener("click", function () {
    const isAll = group.people.length > 0 && selectedSplitIds.length === group.people.length;
    if (isAll) {
      selectedSplitIds = [];
    } else {
      selectedSplitIds = group.people.map(function (p) { return p.id; });
    }
    renderSplitChips();
    updateShareHint();
  });

  const personChipsContainer = document.createElement("div");
  personChipsContainer.className = "person-split-chips";

  function renderSplitChips() {
    updateEveryoneChip();
    while (personChipsContainer.firstChild) {
      personChipsContainer.removeChild(personChipsContainer.firstChild);
    }
    group.people.forEach(function (person, index) {
      const isSelected = selectedSplitIds.includes(person.id);
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "chip split-chip" + (isSelected ? " selected" : "");
      chip.setAttribute("aria-pressed", isSelected ? "true" : "false");
      if (isNeedTwo) chip.disabled = true;

      const avatar = document.createElement("span");
      avatar.className = "avatar av-" + ((index % 8) + 1);
      avatar.textContent = getInitials(person.name);

      const nameSpan = document.createElement("span");
      nameSpan.className = "truncate";
      nameSpan.textContent = person.name;

      chip.appendChild(avatar);
      chip.appendChild(nameSpan);

      chip.addEventListener("click", function () {
        if (selectedSplitIds.includes(person.id)) {
          selectedSplitIds = selectedSplitIds.filter(function (id) { return id !== person.id; });
        } else {
          selectedSplitIds.push(person.id);
        }
        renderSplitChips();
        updateShareHint();
      });

      personChipsContainer.appendChild(chip);
    });
  }

  splitChipsContainer.appendChild(everyoneChip);
  splitChipsContainer.appendChild(personChipsContainer);
  splitGroup.appendChild(splitChipsContainer);

  // Live Hint from shares()
  const hintEl = document.createElement("div");
  hintEl.className = "share-hint tabular-nums";
  hintEl.setAttribute("aria-live", "polite");

  function updateShareHint() {
    if (selectedSplitIds.length === 0) {
      hintEl.textContent = "";
      return;
    }
    const parsed = parseAmount(amountInput.value);
    if (!parsed.ok || parsed.paise <= 0) {
      hintEl.textContent = "";
      return;
    }
    const sMap = shares({
      amount: parsed.paise,
      paidBy: selectedPayerId || (group.people[0] && group.people[0].id) || 1,
      split: selectedSplitIds
    });
    const vals = [...sMap.values()];
    if (vals.length === 0) {
      hintEl.textContent = "";
      return;
    }
    const allEqual = vals.every(function (v) { return v === vals[0]; });
    if (allEqual) {
      hintEl.textContent = t("payment.each", { amount: fmtMoney(vals[0]) });
    } else {
      hintEl.textContent = t("payment.eachAbout", { amount: fmtMoney(vals[0]) });
    }
  }

  amountInput.addEventListener("input", updateShareHint);
  renderSplitChips();
  updateShareHint();

  const splitError = document.createElement("div");
  splitError.className = "form-error";
  splitError.setAttribute("aria-live", "polite");

  splitGroup.appendChild(hintEl);
  splitGroup.appendChild(splitError);
  root.appendChild(splitGroup);

  // 5. Action Buttons (Add payment or Save + Cancel)
  const actionsGroup = document.createElement("div");
  actionsGroup.className = "payment-actions";

  const submitBtn = document.createElement("button");
  submitBtn.type = "button";
  submitBtn.id = editingExpense ? "save-payment-btn" : "add-payment-btn";
  submitBtn.className = "btn btn-primary";
  submitBtn.textContent = editingExpense ? t("payment.save") : t("payment.add");
  if (isNeedTwo) submitBtn.disabled = true;

  const handleSubmit = function () {
    if (isNeedTwo) return;

    amountError.textContent = "";
    labelError.textContent = "";
    splitError.textContent = "";

    const parsed = parseAmount(amountInput.value);
    if (!parsed.ok) {
      amountError.textContent = t("reasons.amount." + parsed.reason);
      amountInput.classList.remove("field-shake");
      void amountInput.offsetWidth;
      amountInput.classList.add("field-shake");
      amountInput.focus();
      return;
    }

    if (selectedSplitIds.length === 0) {
      splitError.textContent = t("reasons.expense.split");
      return;
    }

    const rawLabel = cleanText(labelInput.value);
    if (rawLabel.length > 40) {
      labelError.textContent = t("reasons.expense.long");
      labelInput.classList.remove("field-shake");
      void labelInput.offsetWidth;
      labelInput.classList.add("field-shake");
      return;
    }

    const payer = selectedPayerId || (group.people[0] && group.people[0].id);

    let res;
    if (editingExpense) {
      res = updateExpense(group, editingExpense.id, {
        label: rawLabel,
        amount: parsed.paise,
        paidBy: payer,
        split: selectedSplitIds
      });
    } else {
      res = addExpense(group, {
        label: rawLabel,
        amount: parsed.paise,
        paidBy: payer,
        split: selectedSplitIds
      });
    }

    if (!res.ok) {
      const errMap = {
        amount: amountError,
        payer: amountError,
        split: splitError,
        long: labelError
      };
      const target = errMap[res.reason] || amountError;
      target.textContent = t("reasons.expense." + res.reason);
      return;
    }

    // Success micro-interaction
    submitBtn.textContent = "\u2713"; // quick tick
    setTimeout(function () {
      if (editingExpense) {
        onCancelEdit();
        onUpdateGroup(res.group, payer);
      } else {
        amountInput.value = "";
        labelInput.value = "";
        hintEl.textContent = "";
        submitBtn.textContent = t("payment.add");
        amountInput.focus();
        onUpdateGroup(res.group, payer);
      }
    }, 200);
  };

  submitBtn.addEventListener("click", handleSubmit);

  amountInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  });

  labelInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  });

  actionsGroup.appendChild(submitBtn);

  if (editingExpense) {
    const cancelBtn = document.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.id = "cancel-payment-btn";
    cancelBtn.className = "btn btn-secondary";
    cancelBtn.textContent = t("payment.cancel");
    cancelBtn.addEventListener("click", function () {
      onCancelEdit();
    });
    actionsGroup.appendChild(cancelBtn);
  }

  root.appendChild(actionsGroup);
  container.appendChild(root);
}
