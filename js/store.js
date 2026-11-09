// Safe storage module.
// Wraps localStorage and sessionStorage with try/catch.
// Only holds ss-theme, ss-group, and ss-intro-seen.

import { encodeGroup, decodeGroup } from "./engine/split.js";

export function loadGroup() {
  try {
    const raw = localStorage.getItem("ss-group");
    if (!raw) return null;
    const res = decodeGroup(raw);
    if (res.ok) return res.group;
    return null;
  } catch (e) {
    return null;
  }
}

export function saveGroup(group) {
  try {
    const encoded = typeof group === "string" ? group : encodeGroup(group);
    localStorage.setItem("ss-group", encoded);
    return true;
  } catch (e) {
    return false;
  }
}

export function clearGroup() {
  try {
    localStorage.removeItem("ss-group");
    return true;
  } catch (e) {
    return false;
  }
}

export function getTheme() {
  try {
    return localStorage.getItem("ss-theme");
  } catch (e) {
    return null;
  }
}

export function setTheme(theme) {
  try {
    if (theme) {
      localStorage.setItem("ss-theme", theme);
    } else {
      localStorage.removeItem("ss-theme");
    }
    return true;
  } catch (e) {
    return false;
  }
}

export function hasSeenIntro() {
  try {
    return sessionStorage.getItem("ss-intro-seen") === "1";
  } catch (e) {
    return true;
  }
}

export function markIntroSeen() {
  try {
    sessionStorage.setItem("ss-intro-seen", "1");
  } catch (e) {
    // Storage blocked or unavailable
  }
}
