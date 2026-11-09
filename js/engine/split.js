// LOCKED. Do not edit. Split Smart engine: no DOM, no network, no storage.
// Money is always whole paise (integers), so there are no rounding errors.
// Groups are never changed in place. Every change returns a new group, which makes undo easy.

export const LIMITS = {
  people: 15,
  expenses: 200,
  nameLength: 20,
  groupNameLength: 40,
  labelLength: 40,
  maxAmount: 100000000, // Rs 10,00,000 in paise, per payment
  linkLength: 20000
};

export const PERSON_REASONS = ["empty", "long", "duplicate", "full", "inUse", "unknown"];
export const EXPENSE_REASONS = ["amount", "payer", "split", "long", "full", "unknown"];
export const AMOUNT_REASONS = ["empty", "invalid", "zero", "decimals", "max"];

const fail = (reason) => ({ ok: false, reason });
const HIDDEN = /[\u0000-\u001F\u007F-\u009F​-‏‪-‮⁠-⁩﻿]/g;
const length = (s) => [...s].length;

// Trims, removes hidden characters and squeezes spaces.
export function cleanText(text) {
  return String(text ?? "").replace(HIDDEN, "").replace(/\s+/g, " ").trim();
}

// Indian grouping by hand, so every browser shows the same text.
export function fmt(n) {
  const s = String(Math.trunc(Math.abs(n)));
  const g = s.length <= 3 ? s : s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + s.slice(-3);
  return (n < 0 ? "-" : "") + g;
}

// 150000 -> "₹1,500". 33333 -> "₹333.33". Paise show only when there are some.
export function fmtMoney(paise) {
  const a = Math.abs(Math.round(paise));
  const rupees = Math.floor(a / 100);
  const p = a % 100;
  return (paise < 0 ? "-" : "") + "₹" + fmt(rupees) + (p ? "." + String(p).padStart(2, "0") : "");
}

// "1,250.50", "₹1250", "Rs 1250" -> paise. Returns { ok, paise } or { ok: false, reason }.
export function parseAmount(text) {
  const s = String(text ?? "").trim().replace(/^(₹|rs\.?|inr)\s*/i, "").replace(/[,\s]/g, "");
  if (!s) return fail("empty");
  if (!/^(\d+(\.\d*)?|\.\d+)$/.test(s)) return fail("invalid");
  const [whole, dec = ""] = s.split(".");
  if (dec.length > 2) return fail("decimals");
  if (whole.replace(/^0+/, "").length > 9) return fail("max");
  const paise = Number(whole || "0") * 100 + Number((dec + "00").slice(0, 2));
  if (paise === 0) return fail("zero");
  if (paise > LIMITS.maxAmount) return fail("max");
  return { ok: true, paise };
}

export function newGroup(name = "") {
  const clean = cleanText(name);
  return {
    v: 1,
    name: length(clean) > LIMITS.groupNameLength ? [...clean].slice(0, LIMITS.groupNameLength).join("") : clean,
    people: [],
    expenses: [],
    nextId: 1
  };
}

const copy = (g) => ({
  v: 1,
  name: g.name,
  people: g.people.map((p) => ({ ...p })),
  expenses: g.expenses.map((e) => ({ ...e, split: [...e.split] })),
  nextId: g.nextId
});

export function renameGroup(group, name) {
  const clean = cleanText(name);
  if (length(clean) > LIMITS.groupNameLength) return fail("long");
  const g = copy(group);
  g.name = clean;
  return { ok: true, group: g };
}

export function addPerson(group, name) {
  const clean = cleanText(name);
  if (!clean) return fail("empty");
  if (length(clean) > LIMITS.nameLength) return fail("long");
  if (group.people.length >= LIMITS.people) return fail("full");
  const key = clean.toLowerCase();
  if (group.people.some((p) => p.name.toLowerCase() === key)) return fail("duplicate");
  const g = copy(group);
  const person = { id: g.nextId++, name: clean };
  g.people.push(person);
  return { ok: true, group: g, person };
}

// A person can be removed only when no payment uses them.
export function removePerson(group, id) {
  if (!group.people.some((p) => p.id === id)) return fail("unknown");
  if (group.expenses.some((e) => e.paidBy === id || e.split.includes(id))) return fail("inUse");
  const g = copy(group);
  g.people = g.people.filter((p) => p.id !== id);
  return { ok: true, group: g };
}

function checkExpense(group, { label = "", amount, paidBy, split }) {
  const clean = cleanText(label);
  if (length(clean) > LIMITS.labelLength) return fail("long");
  if (!Number.isInteger(amount) || amount < 1 || amount > LIMITS.maxAmount) return fail("amount");
  const ids = new Set(group.people.map((p) => p.id));
  if (!ids.has(paidBy)) return fail("payer");
  if (!Array.isArray(split) || split.length === 0) return fail("split");
  const chosen = new Set(split);
  if (chosen.size !== split.length || ![...chosen].every((id) => ids.has(id))) return fail("split");
  // Keep the split in the same order as the people list.
  const ordered = group.people.map((p) => p.id).filter((id) => chosen.has(id));
  return { ok: true, label: clean, amount, paidBy, split: ordered };
}

// fields: { label, amount (paise), paidBy (person id), split (person ids, at least 1) }
export function addExpense(group, fields) {
  if (group.expenses.length >= LIMITS.expenses) return fail("full");
  const c = checkExpense(group, fields);
  if (!c.ok) return c;
  const g = copy(group);
  const expense = { id: g.nextId++, label: c.label, amount: c.amount, paidBy: c.paidBy, split: c.split };
  g.expenses.push(expense);
  return { ok: true, group: g, expense };
}

export function updateExpense(group, id, fields) {
  const i = group.expenses.findIndex((e) => e.id === id);
  if (i < 0) return fail("unknown");
  const c = checkExpense(group, { ...group.expenses[i], ...fields });
  if (!c.ok) return c;
  const g = copy(group);
  g.expenses[i] = { id, label: c.label, amount: c.amount, paidBy: c.paidBy, split: c.split };
  return { ok: true, group: g, expense: g.expenses[i] };
}

export function removeExpense(group, id) {
  if (!group.expenses.some((e) => e.id === id)) return fail("unknown");
  const g = copy(group);
  g.expenses = g.expenses.filter((e) => e.id !== id);
  return { ok: true, group: g };
}

// Equal shares in paise. Leftover paise go to the payer first (if they share it),
// then down the people list, so nobody is asked for an extra paisa because of rounding.
export function shares(expense) {
  const n = expense.split.length;
  const base = Math.floor(expense.amount / n);
  let extra = expense.amount - base * n;
  const order = expense.split.includes(expense.paidBy)
    ? [expense.paidBy, ...expense.split.filter((id) => id !== expense.paidBy)]
    : expense.split;
  const out = new Map(expense.split.map((id) => [id, base]));
  for (const id of order) {
    if (extra === 0) break;
    out.set(id, out.get(id) + 1);
    extra--;
  }
  return out;
}

// Biggest debtor pays biggest creditor, as much as possible, until everyone is even.
// Ties go to whoever is higher in the people list. Each step settles at least one person.
function greedy(items) {
  const left = items.map((x) => ({ ...x }));
  const steps = [];
  for (;;) {
    let d = null, c = null;
    for (const x of left) {
      if (x.net < 0 && (!d || -x.net > -d.net)) d = x;
      if (x.net > 0 && (!c || x.net > c.net)) c = x;
    }
    if (!d || !c) break;
    const amount = Math.min(-d.net, c.net);
    steps.push({ from: d.id, to: c.id, amount });
    d.net += amount;
    c.net -= amount;
  }
  return steps;
}

// The one function the website uses for results. Every number on screen comes from here.
export function settle(group) {
  const people = group.people;
  const name = new Map(people.map((p) => [p.id, p.name]));
  const paid = new Map(people.map((p) => [p.id, 0]));   // hash map: person -> paid
  const share = new Map(people.map((p) => [p.id, 0]));  // hash map: person -> fair share
  const direct = new Map();                              // "a:b" -> what a owes b, before netting
  let mapUpdates = 0, total = 0;

  for (const e of group.expenses) {
    total += e.amount;
    paid.set(e.paidBy, paid.get(e.paidBy) + e.amount);
    mapUpdates++;
    for (const [id, s] of shares(e)) {
      share.set(id, share.get(id) + s);
      mapUpdates++;
      if (id === e.paidBy) continue;
      const lo = Math.min(id, e.paidBy), hi = Math.max(id, e.paidBy);
      const key = lo + ":" + hi;
      direct.set(key, (direct.get(key) ?? 0) + (id === lo ? s : -s));
    }
  }

  const balances = people.map((p) => ({
    id: p.id, name: p.name, paid: paid.get(p.id), share: share.get(p.id), net: paid.get(p.id) - share.get(p.id)
  }));
  const open = balances.filter((b) => b.net !== 0).map((b) => ({ id: b.id, net: b.net }));
  const k = open.length;

  // Fewest transfers: split the open balances into as many groups as possible whose amounts add up to zero
  // (the first ones found are exact pairs, like +900 and -900). Each group of size s needs s - 1 transfers.
  const full = (1 << k) - 1;
  const sum = new Array(full + 1).fill(0);
  const best = new Array(full + 1).fill(0);
  const pick = new Array(full + 1).fill(-1);
  for (let mask = 1; mask <= full; mask++) {
    const low = 31 - Math.clz32(mask & -mask);
    sum[mask] = sum[mask & (mask - 1)] + open[low].net;
    let top = -1;
    for (let i = 0; i < k; i++) {
      if (!(mask & (1 << i))) continue;
      if (best[mask ^ (1 << i)] > top) { top = best[mask ^ (1 << i)]; pick[mask] = i; }
    }
    best[mask] = top + (sum[mask] === 0 ? 1 : 0);
  }
  const groups = [];
  let current = [], mask = full;
  while (mask) {
    const i = pick[mask];
    current.push(open[i]);
    mask ^= 1 << i;
    if (sum[mask] === 0) { groups.push(current); current = []; }
  }

  const order = new Map(people.map((p, i) => [p.id, i]));
  const transfers = groups
    .flatMap((g) => greedy(g.sort((a, b) => order.get(a.id) - order.get(b.id))))
    .sort((a, b) => b.amount - a.amount || order.get(a.from) - order.get(b.from) || order.get(a.to) - order.get(b.to))
    .map((t) => ({ ...t, fromName: name.get(t.from), toName: name.get(t.to) }));

  // What each person would owe each payer if everyone paid back directly (two-way debts netted). Drawn as the "tangle".
  const directList = [...direct.entries()]
    .filter(([, v]) => v !== 0)
    .map(([key, v]) => {
      const [lo, hi] = key.split(":").map(Number);
      return v > 0 ? { from: lo, to: hi, amount: v } : { from: hi, to: lo, amount: -v };
    })
    .sort((x, y) => order.get(x.from) - order.get(y.from) || order.get(x.to) - order.get(y.to))
    .map((d) => ({ ...d, fromName: name.get(d.from), toName: name.get(d.to) }));

  const payments = group.expenses.length;
  const T = transfers.length;
  const headline = payments === 0
    ? "Add a payment to see who owes whom."
    : T === 0
      ? `${fmt(payments)} ${payments === 1 ? "payment" : "payments"}, and everyone is even.`
      : `${fmt(payments)} ${payments === 1 ? "payment" : "payments"} settled in ${T} ${T === 1 ? "transfer" : "transfers"}.`;

  return {
    headline,
    empty: payments === 0,
    settled: T === 0,
    total,
    counts: {
      people: people.length,
      payments,
      transfers: T,
      directDebts: directList.length,
      plainGreedy: greedy(open.sort((a, b) => order.get(a.id) - order.get(b.id))).length
    },
    balances,
    transfers,
    direct: directList,
    dsa: {
      mapUpdates,
      openBalances: k,
      zeroGroups: groups.length,
      exactPairs: groups.filter((g) => g.length === 2).length,
      subsetsChecked: full,
      greedySteps: T
    }
  };
}

// The WhatsApp and Copy summary text. link is the share link, or "".
export function shareText(group, result, link = "") {
  const lines = [`${group.name || "Our split"}: ${result.headline}`, ""];
  if (result.empty) lines.push("No payments added yet.");
  else if (result.settled) lines.push("Everyone is even. Nothing to pay.");
  else result.transfers.forEach((t, i) => lines.push(`${i + 1}. ${t.fromName} pays ${t.toName} ${fmtMoney(t.amount)}`));
  if (!result.empty) lines.push("", `Total spent: ${fmtMoney(result.total)}`);
  if (link) lines.push(`See the full split: ${link}`);
  lines.push("", "Made with Split Smart by Wrench Wise");
  return lines.join("\n");
}

// Share links and saved groups use this compact form: people by position, splits as bitmasks.
export function encodeGroup(group) {
  const pos = new Map(group.people.map((p, i) => [p.id, i]));
  const data = [1, group.name, group.people.map((p) => p.name),
    group.expenses.map((e) => [e.label, pos.get(e.paidBy), e.amount, e.split.reduce((m, id) => m | (1 << pos.get(id)), 0)])];
  const bytes = new TextEncoder().encode(JSON.stringify(data));
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// Never throws. Anything odd returns { ok: false, reason: "invalid" }.
// The group is rebuilt with the same checks as typing it in, so a link can never hold more than the page allows.
export function decodeGroup(text) {
  const bad = { ok: false, reason: "invalid" };
  try {
    const s = String(text ?? "");
    if (!s || s.length > LIMITS.linkLength || !/^[A-Za-z0-9_-]+$/.test(s)) return bad;
    const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
    const bytes = Uint8Array.from(bin, (ch) => ch.charCodeAt(0));
    const data = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
    if (!Array.isArray(data) || data.length !== 4 || data[0] !== 1) return bad;
    const [, gname, names, rows] = data;
    if (typeof gname !== "string" || !Array.isArray(names) || !Array.isArray(rows)) return bad;
    if (names.length > LIMITS.people || rows.length > LIMITS.expenses) return bad;
    let r = renameGroup(newGroup(), gname);
    if (!r.ok) return bad;
    let g = r.group;
    for (const n of names) {
      if (typeof n !== "string") return bad;
      r = addPerson(g, n);
      if (!r.ok) return bad;
      g = r.group;
    }
    const n = g.people.length;
    for (const row of rows) {
      if (!Array.isArray(row) || row.length !== 4) return bad;
      const [label, payer, amount, mask] = row;
      if (typeof label !== "string" || !Number.isInteger(payer) || payer < 0 || payer >= n) return bad;
      if (!Number.isInteger(mask) || mask < 1 || mask >= 1 << n) return bad;
      const split = g.people.filter((p, i) => mask & (1 << i)).map((p) => p.id);
      r = addExpense(g, { label, amount, paidBy: g.people[payer].id, split });
      if (!r.ok) return bad;
      g = r.group;
    }
    return { ok: true, group: g };
  } catch {
    return bad;
  }
}
