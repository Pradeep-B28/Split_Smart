// Motion helper module: count-up, scroll reveal, and reduced motion checks.

import { CONFIG } from "../config.js";
import { fmt } from "./engine/split.js";

export function isReducedMotion() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// Animate numbers inside a text string over durationMs, ending exactly on targetText
export function animateCountUp(element, targetText, durationMs = CONFIG.countUpMs || 700) {
  if (!element) return;

  if (isReducedMotion()) {
    element.textContent = targetText;
    return;
  }

  // Find all integers in the target string
  const numbers = [];
  const regex = /\d[\d,]*/g;
  let match;
  while ((match = regex.exec(targetText)) !== null) {
    const rawDigits = match[0].replace(/,/g, "");
    numbers.push({
      start: match.index,
      length: match[0].length,
      val: parseInt(rawDigits, 10),
      raw: match[0]
    });
  }

  if (numbers.length === 0) {
    element.textContent = targetText;
    return;
  }

  const startTime = performance.now();

  function step(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / durationMs, 1);
    // Ease-out curve
    const ease = 1 - Math.pow(1 - progress, 3);

    if (progress >= 1) {
      element.textContent = targetText;
      return;
    }

    // Reconstruct string with interpolated numbers
    let result = "";
    let lastIdx = 0;
    for (const num of numbers) {
      result += targetText.slice(lastIdx, num.start);
      const currentVal = Math.round(num.val * ease);
      result += fmt(currentVal);
      lastIdx = num.start + num.length;
    }
    result += targetText.slice(lastIdx);

    element.textContent = result;
    requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}

// Single-pass Scroll reveal observer
let revealObserver = null;

export function initScrollReveal() {
  if (typeof window === "undefined" || !window.IntersectionObserver || isReducedMotion()) {
    document.querySelectorAll(".reveal-on-scroll").forEach(function (el) {
      el.classList.add("revealed");
    });
    return;
  }

  if (revealObserver) {
    revealObserver.disconnect();
  }

  revealObserver = new IntersectionObserver(function (entries, observer) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add("revealed");
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: "0px 0px -40px 0px"
  });

  document.querySelectorAll(".reveal-on-scroll:not(.revealed)").forEach(function (el) {
    revealObserver.observe(el);
  });
}
