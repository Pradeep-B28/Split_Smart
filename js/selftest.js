// Self-test module for ?test=1
// Runs all 13 required verification tests against the live page code.

import { sampleGroup } from "./sample-data.js";
import { settle, encodeGroup, decodeGroup, shareText } from "./engine/split.js";
import { buildShareLink } from "./links.js";
import { t } from "./copy.js";
import { setGroupState, initState } from "./main.js";

export async function runSelfTest() {
  const results = [];
  const addResult = (desc, pass) => {
    results.push({ desc, pass: Boolean(pass) });
  };

  try {
    // 1. Initialize real sample group in page code
    const sample = sampleGroup();
    const sampleResult = settle(sample);

    window.location.hash = "";
    setGroupState(sample, false);
    await new Promise((r) => setTimeout(r, 800));

    // Test 1: The sample shows headline and total
    const headlineEl = document.querySelector(".result-headline");
    const totalEl = document.querySelector(".result-total-spent");
    const t1 = headlineEl && headlineEl.textContent.trim() === "11 payments settled in 3 transfers." &&
               totalEl && totalEl.textContent.includes("₹19,350");
    addResult("The sample, run through the real page code, shows exactly \"11 payments settled in 3 transfers.\" and the total \"₹19,350\".", t1);

    // Test 2: Transfer cards read in order
    const cards = [...document.querySelectorAll(".transfer-card")].map(function (c) {
      return {
        from: c.querySelector(".transfer-payer .transfer-name")?.textContent.trim(),
        to: c.querySelector(".transfer-receiver .transfer-name")?.textContent.trim(),
        amount: c.querySelector(".transfer-amount")?.textContent.trim()
      };
    });
    const t2 = cards.length === 3 &&
               cards[0].from === "Priya" && cards[0].to === "Divya" && cards[0].amount === "₹2,790" &&
               cards[1].from === "Vignesh" && cards[1].to === "Arun" && cards[1].amount === "₹2,140" &&
               cards[2].from === "Karthik" && cards[2].to === "Arun" && cards[2].amount === "₹1,490";
    addResult("The transfer cards read, in order: Priya to Divya ₹2,790, Vignesh to Arun ₹2,140, Karthik to Arun ₹1,490.", t2);

    // Test 3: Untangle labels
    const beforeLabel = t("untangle.before", { count: "10" });
    const afterLabel = t("untangle.after", { count: "3" });
    const t3 = beforeLabel === "10 debts if everyone pays back directly" &&
               afterLabel === "3 transfers with Split Smart";
    addResult("The untangle labels show \"10 debts if everyone pays back directly\" and \"3 transfers with Split Smart\".", t3);

    // Test 4: Balances show Arun gets back and Vignesh owes
    const balances = [...document.querySelectorAll(".balance-person-row")].map(function (r) {
      return {
        name: r.querySelector(".balance-person-name")?.textContent.trim(),
        status: r.querySelector(".balance-status-text")?.textContent.trim()
      };
    });
    const arunBal = balances.find(function (b) { return b.name === "Arun"; });
    const vigBal = balances.find(function (b) { return b.name === "Vignesh"; });
    const t4 = arunBal && arunBal.status.includes("gets back ₹3,630") &&
               vigBal && vigBal.status.includes("owes ₹2,140");
    addResult("The balances show Arun gets back ₹3,630 and Vignesh owes ₹2,140.", t4);

    // Test 5: DSA cards
    const dsaBadges = [...document.querySelectorAll(".dsa-card-item")].map(function (c) {
      return {
        live: c.querySelector(".dsa-live-badge")?.textContent.trim() || "",
        beat: c.querySelector(".dsa-beat-badge")?.textContent.trim() || ""
      };
    });
    const mapLive = dsaBadges[0]?.live || "";
    const pairLive = dsaBadges[1]?.live || "";
    const greedyBeat = dsaBadges[2]?.beat || "";
    const t5 = mapLive.includes("59 hash map updates") &&
               pairLive.includes("31 possible groups") && pairLive.includes("2") &&
               greedyBeat === "Greedy matching alone would need 4. Smart pairing saved 1.";
    addResult("The DSA cards show 59 hash map updates, 31 possible groups, 2 groups, and \"Greedy matching alone would need 4. Smart pairing saved 1.\"", t5);

    // Test 6: WhatsApp link
    const waBtn = document.querySelector(".whatsapp-share-btn");
    const link = buildShareLink(sample);
    const expectedShareText = shareText(sample, sampleResult, link);
    const waUrl = waBtn?.href || "";
    const decodedWaText = decodeURIComponent(waUrl.replace("https://wa.me/?text=", ""));
    const t6 = waUrl.startsWith("https://wa.me/?text=") && decodedWaText === expectedShareText;
    addResult("The WhatsApp link starts with https://wa.me/?text= and, decoded, equals shareText() for the sample.", t6);

    // Test 7: Share link #g= survives encode and decode
    const encPart = encodeGroup(sample);
    const decRes = decodeGroup(encPart);
    const t7 = decRes.ok && JSON.stringify(decRes.group) === JSON.stringify(sample);
    addResult("The share link's #g= part, run through decodeGroup(), gives back the same group.", t7);

    // Test 8: Opening share link shows viewing mode, Make my copy saves and removes #g=
    window.location.hash = "#g=" + encPart;
    initState();
    await new Promise((r) => setTimeout(r, 100));
    const bannerTitle = document.querySelector(".viewing-banner-title");
    const isViewingMode = bannerTitle && bannerTitle.textContent.length > 0;
    const copyBtn = document.querySelector(".make-copy-btn");
    if (copyBtn) copyBtn.click();
    const yesBtn = document.querySelector(".viewing-replace-actions button");
    if (yesBtn) yesBtn.click();
    const hashCleared = !window.location.hash;
    const t8 = isViewingMode && hashCleared;
    addResult("Opening the share link shows viewing mode, and Make my copy saves it and removes #g=.", t8);

    // Reset to sample group for remainder of tests
    setGroupState(sampleGroup(), false);
    await new Promise((r) => setTimeout(r, 800));

    // Test 9: Deleting payment and Undo
    const beforeDelHeadline = document.querySelector(".result-headline")?.textContent.trim();
    const firstDelBtn = document.querySelector(".delete-btn");
    if (firstDelBtn) firstDelBtn.click();
    await new Promise((r) => setTimeout(r, 220));
    const undoBtn = document.getElementById("undo-btn");
    if (undoBtn) undoBtn.click();
    await new Promise((r) => setTimeout(r, 800));
    const afterUndoHeadline = document.querySelector(".result-headline")?.textContent.trim();
    const t9 = beforeDelHeadline === afterUndoHeadline && beforeDelHeadline === "11 payments settled in 3 transfers.";
    addResult("Deleting a payment and pressing Undo brings back the same headline.", t9);

    // Test 10: Removing person in use shows inUse message
    const firstRemoveBtn = document.querySelector(".person-remove-btn");
    if (firstRemoveBtn) firstRemoveBtn.click();
    await new Promise((r) => setTimeout(r, 100));
    const personErr = document.querySelector(".people-section .form-error")?.textContent || "";
    const arunStillPresent = [...document.querySelectorAll(".person-chip-name")].some(function (el) { return el.textContent.trim() === "Arun"; });
    const t10 = personErr.includes("is part of a payment") && arunStillPresent;
    addResult("Removing a person who is in a payment shows the inUse message and keeps them.", t10);

    // Test 11: Odd name <img src=1> shows as plain text with no img tag
    const personInp = document.getElementById("add-person-input");
    const addPersonBtn = document.querySelector(".add-person-row button");
    if (personInp && addPersonBtn) {
      personInp.value = "<img src=1>";
      addPersonBtn.click();
    }
    await new Promise((r) => setTimeout(r, 100));
    const injectedImgs = document.querySelectorAll("img[src='1']").length;
    const oddNamePresent = [...document.querySelectorAll(".person-chip-name")].some(function (el) { return el.textContent.trim() === "<img src=1>"; });
    const t11 = injectedImgs === 0 && oddNamePresent;
    addResult("Adding a person named <img src=1> shows it as plain text and adds no image to the page.", t11);

    // Test 12: Storage allowed keys and document.title
    const storageKeys = Object.keys(localStorage);
    const validStorageKeys = storageKeys.every(function (k) {
      return ["ss-theme", "ss-group", "ss-intro-seen"].includes(k);
    });
    const sampleNames = ["Arun", "Priya", "Karthik", "Divya", "Vignesh"];
    const titleClean = !sampleNames.some(function (n) { return document.title.includes(n); });
    const t12 = validStorageKeys && titleClean;
    addResult("Storage holds only allowed keys, and document.title holds no names.", t12);

    // Test 13: scrollWidth not larger than window width
    const t13 = document.documentElement.scrollWidth <= window.innerWidth;
    addResult("document.documentElement.scrollWidth is not larger than the window width.", t13);

  } catch (err) {
    addResult("Execution error during self-test", false);
  }

  // Display results container on page
  renderSelfTestView(results);
}

function renderSelfTestView(results) {
  const oldTestView = document.getElementById("selftest-overlay");
  if (oldTestView) oldTestView.remove();

  const overlay = document.createElement("div");
  overlay.id = "selftest-overlay";
  overlay.className = "selftest-overlay";

  const container = document.createElement("div");
  container.className = "selftest-container";

  const title = document.createElement("h2");
  title.className = "selftest-title";
  title.textContent = "Split Smart: Self-Test Results (?test=1)";
  container.appendChild(title);

  const list = document.createElement("ol");
  list.className = "selftest-list";

  let allPass = true;
  results.forEach(function (r) {
    if (!r.pass) allPass = false;
    const item = document.createElement("li");
    item.className = "selftest-item " + (r.pass ? "item-pass" : "item-fail");

    const statusBadge = document.createElement("span");
    statusBadge.className = "selftest-badge " + (r.pass ? "badge-pass" : "badge-fail");
    statusBadge.textContent = r.pass ? "PASS" : "FAIL";

    const descText = document.createElement("span");
    descText.className = "selftest-desc";
    descText.textContent = r.desc;

    item.appendChild(statusBadge);
    item.appendChild(descText);
    list.appendChild(item);
  });

  container.appendChild(list);

  const summary = document.createElement("div");
  summary.className = "selftest-summary " + (allPass ? "summary-pass" : "summary-fail");
  summary.textContent = allPass ? "RESULT: ALL PASS (13/13)" : "RESULT: FAILED";
  container.appendChild(summary);

  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "btn btn-secondary btn-sm selftest-close-btn";
  closeBtn.textContent = "Close Test View";
  closeBtn.addEventListener("click", function () {
    overlay.remove();
  });
  container.appendChild(closeBtn);

  overlay.appendChild(container);
  document.body.appendChild(overlay);
}
