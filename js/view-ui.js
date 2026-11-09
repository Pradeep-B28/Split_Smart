// Shared Link View banner and "Make my copy" management.

import { t } from "./copy.js";
import { loadGroup, saveGroup } from "./store.js";

export function renderViewingBanner(container, {
  isViewing,
  badLink = false,
  group,
  onMakeCopy
}) {
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }

  if (badLink) {
    const errorBanner = document.createElement("div");
    errorBanner.className = "viewing-banner banner-error";

    const msg = document.createElement("p");
    msg.className = "viewing-banner-msg";
    msg.textContent = t("reasons.badLink");
    errorBanner.appendChild(msg);

    container.appendChild(errorBanner);
    return;
  }

  if (!isViewing) return;

  const banner = document.createElement("div");
  banner.className = "viewing-banner";

  const contentCol = document.createElement("div");
  contentCol.className = "viewing-banner-content";

  const title = document.createElement("p");
  title.className = "viewing-banner-title";
  title.textContent = t("viewing.banner");

  const sub = document.createElement("p");
  sub.className = "viewing-banner-sub";
  sub.textContent = t("viewing.sub");

  contentCol.appendChild(title);
  contentCol.appendChild(sub);
  banner.appendChild(contentCol);

  // "Make my copy" button & inline confirm
  const actionsCol = document.createElement("div");
  actionsCol.className = "viewing-banner-actions";

  const copyBtn = document.createElement("button");
  copyBtn.type = "button";
  copyBtn.className = "btn btn-primary btn-sm make-copy-btn";
  copyBtn.textContent = t("viewing.copy");

  const replaceConfirmBox = document.createElement("div");
  replaceConfirmBox.className = "viewing-replace-box hidden";

  const replaceMsg = document.createElement("p");
  replaceMsg.className = "viewing-replace-msg";
  replaceMsg.textContent = t("viewing.replace");

  const replaceBtns = document.createElement("div");
  replaceBtns.className = "viewing-replace-actions";

  const yesBtn = document.createElement("button");
  yesBtn.type = "button";
  yesBtn.className = "btn btn-primary btn-sm";
  yesBtn.textContent = t("viewing.replaceYes");

  const noBtn = document.createElement("button");
  noBtn.type = "button";
  noBtn.className = "btn btn-secondary btn-sm";
  noBtn.textContent = t("viewing.replaceNo");

  replaceBtns.appendChild(yesBtn);
  replaceBtns.appendChild(noBtn);
  replaceConfirmBox.appendChild(replaceMsg);
  replaceConfirmBox.appendChild(replaceBtns);

  copyBtn.addEventListener("click", function () {
    const saved = loadGroup();
    if (saved && saved.expenses && saved.expenses.length > 0) {
      // Saved group with payments exists, show confirm first
      replaceConfirmBox.classList.remove("hidden");
    } else {
      executeMakeCopy();
    }
  });

  yesBtn.addEventListener("click", function () {
    executeMakeCopy();
  });

  noBtn.addEventListener("click", function () {
    replaceConfirmBox.classList.add("hidden");
  });

  function executeMakeCopy() {
    saveGroup(group);
    if (typeof window !== "undefined" && window.history && window.history.replaceState) {
      const cleanUrl = window.location.pathname + window.location.search;
      window.history.replaceState(null, "", cleanUrl);
    }
    onMakeCopy();
  }

  actionsCol.appendChild(copyBtn);
  actionsCol.appendChild(replaceConfirmBox);
  banner.appendChild(actionsCol);

  container.appendChild(banner);
}
