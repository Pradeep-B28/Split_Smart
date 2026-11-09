// All words on the site. Do not reword unless I ask. Use t("hero.title") to read one.
// {name} parts are filled in by t(key, { name: value }).

export const COPY = {
  brand: "Wrench Wise",
  hero: {
    eyebrow: "Free bill splitter",
    title: "Split any trip. Settle in the fewest payments.",
    sub: "Add your friends and who paid what. Split Smart works out who owes whom, with as few transfers as possible."
  },
  group: {
    label: "Group name",
    placeholder: "Pondy weekend",
    people: "People",
    personPlaceholder: "Add a name",
    add: "Add",
    remove: "Remove {name}",
    count: "{count} of {max} people",
    needTwo: "Add at least 2 people to start.",
    sample: "Try a sample trip",
    reset: "Start a new group",
    resetConfirm: "Clear this group from this device?",
    resetYes: "Yes, clear it",
    resetNo: "Keep it"
  },
  payment: {
    heading: "Add a payment",
    editHeading: "Edit payment",
    label: "What for",
    labelPlaceholder: "Dinner",
    amount: "Amount",
    amountPlaceholder: "0",
    paidBy: "Paid by",
    splitWith: "Split between",
    everyone: "Everyone",
    each: "{amount} each",
    eachAbout: "About {amount} each",
    add: "Add payment",
    save: "Save changes",
    cancel: "Cancel",
    untitled: "Payment"
  },
  list: {
    heading: "Payments",
    empty: "No payments yet. Add the first one above.",
    row: "{payer} paid {amount}",
    sharedBy: "Split between {count}",
    sharedByAll: "Split between everyone",
    edit: "Edit",
    delete: "Delete",
    deleted: "Payment deleted.",
    undo: "Undo",
    total: "Total spent: {amount}"
  },
  reasons: {
    person: {
      empty: "Type a name first.",
      long: "Keep names to 20 letters or fewer.",
      duplicate: "{name} is already in the group.",
      full: "A group can have up to 15 people.",
      inUse: "{name} is part of a payment. Delete or edit that payment first.",
      unknown: "That person is not in the group."
    },
    amount: {
      empty: "Enter an amount.",
      invalid: "Use numbers only, like 1250 or 1,250.50.",
      zero: "The amount must be more than zero.",
      decimals: "Use at most 2 digits after the point.",
      max: "One payment can be at most ₹10,00,000."
    },
    expense: {
      amount: "Enter a valid amount.",
      payer: "Choose who paid.",
      split: "Pick at least one person to split with.",
      long: "Keep it to 40 letters or fewer.",
      full: "A group can have up to 200 payments.",
      unknown: "That payment no longer exists."
    },
    groupName: "Keep the group name to 40 letters or fewer.",
    badLink: "This share link is damaged or incomplete, so it could not be opened."
  },
  result: {
    empty: "Your settle-up plan shows up here.",
    emptySub: "Add people and payments, or try the sample trip.",
    transfersHeading: "Who pays whom",
    pays: "pays",
    total: "Total spent",
    perPerson: "Payments",
    even: "Everyone is even. Nothing to pay.",
    saved: "Saved on this device"
  },
  untangle: {
    before: "{count} debts if everyone pays back directly",
    after: "{count} transfers with Split Smart",
    replay: "Play again"
  },
  balances: {
    heading: "Where everyone stands",
    getsBack: "gets back {amount}",
    owes: "owes {amount}",
    even: "is even",
    detail: "Paid {paid}, share {share}"
  },
  share: {
    heading: "Send it to the group",
    whatsApp: "Share on WhatsApp",
    copyText: "Copy summary",
    copyLink: "Copy link",
    copied: "Copied",
    copyFailed: "Copy did not work. Select the text and copy it by hand.",
    linkNote: "The link holds the whole split, so anyone who opens it sees the same result. Nothing is stored on a server."
  },
  viewing: {
    banner: "You opened a shared split.",
    sub: "This is a view of someone else's group. Make a copy to add or change payments.",
    copy: "Make my copy",
    replace: "This replaces the group saved on this device.",
    replaceYes: "Replace it",
    replaceNo: "Cancel"
  },
  privacy: {
    line: "Your group is saved only on this device. No account, no server.",
    proofTitle: "Check it yourself",
    proof: "Load this page, turn on airplane mode, and it still works."
  },
  how: {
    heading: "How it works",
    one: "Add the people in your group.",
    two: "Add each payment: what for, how much, who paid and who shared it.",
    three: "Get the shortest list of who pays whom, and send it on WhatsApp."
  },
  hood: {
    heading: "The DSA behind this page",
    mapTitle: "Hash map",
    map: "One pass over the payments keeps a running total for each person in a hash map: what they paid minus their fair share. Plus means they get money back. Minus means they owe.",
    mapLive: "Your group needed {updates} hash map updates.",
    pairTitle: "Smart pairing",
    pair: "Before matching, the page looks for people whose amounts cancel out exactly, like +₹900 and -₹900, or small groups that add up to zero. Each one is settled on its own.",
    pairLive: "It checked {subsets} possible groups and found {groups} that settle on their own.",
    greedyTitle: "Greedy matching",
    greedy: "Inside each group, the person who owes the most pays the person owed the most, as much as possible. Each step settles at least one person.",
    greedyLive: "{transfers} transfers instead of {direct} direct debts.",
    greedyBeat: "Greedy matching alone would need {plain}. Smart pairing saved {saved}."
  },
  cta: {
    title: "Want to build tools like this?",
    body: "This page is built with a hash map, greedy matching and plain JavaScript. Learn these skills step by step in the {program}.",
    button: "Explore the program",
    whatsApp: "Talk to us on WhatsApp"
  },
  footer: {
    built: "Built by Wrench Wise",
    privacy: "Your group stays on your device."
  },
  noScript: "This page needs JavaScript to run."
};

export function t(key, values = {}) {
  const found = key.split(".").reduce((node, part) => node?.[part], COPY);
  if (typeof found !== "string") return "";
  return found.replace(/\{(\w+)\}/g, (all, name) => values[name] ?? all);
}
