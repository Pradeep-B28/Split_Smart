// Every setting lives here. Change values here, never in other files.

export const CONFIG = {
  version: "1.0.0",

  // The live address. Set in Phase 4 (deploy). Used for share links and link previews.
  siteUrl: "",

  // Sales WhatsApp: digits only, country code first. Empty hides the "Talk to us" button.
  salesWhatsApp: "",
  whatsAppText: "Hi, I tried Split Smart. I want to know more about the {program}.",

  // The program the CTA sells. Always use the full name. page is its page on wrench-wise.com, or "" for the main site.
  program: {
    name: "Certification Program in AI-Powered Software Engineering & DSA",
    page: ""
  },

  website: "https://wrench-wise.com",
  utm: { source: "split-smart", medium: "web-project", campaign: "split-smart" },

  countUpMs: 700,  // headline numbers count up for this long
  untangleMs: 1400, // the tangle-to-transfers animation
  loaderMs: 800,   // the loader never runs longer than this
  undoMs: 5000,    // how long the Undo toast stays after deleting a payment

  // Switches. false hides the feature completely, with no errors.
  features: {
    darkTheme: true,
    untangle: true,
    balances: true,
    editPayment: true,
    shareLink: true,
    underTheHood: true
  }
};
