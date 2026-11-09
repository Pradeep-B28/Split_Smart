// Theme and loader initialization script.
// Runs synchronously in <head> to prevent theme flash and manage session intro.

(function () {
  try {
    var storedTheme = localStorage.getItem("ss-theme");
    var prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    var isDark = storedTheme === "dark" || (!storedTheme && prefersDark);
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    var prefersReduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var introSeen = sessionStorage.getItem("ss-intro-seen");
    if (introSeen || prefersReduced) {
      document.documentElement.classList.add("no-loader");
    } else {
      document.documentElement.classList.add("has-loader");
      sessionStorage.setItem("ss-intro-seen", "1");
    }
  } catch (e) {
    document.documentElement.classList.add("no-loader");
  }
})();
