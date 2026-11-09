// LOCKED. Run with: node tools/verify.mjs
// Must end with RESULT: ALL PASS at the start of every phase and before deploy.
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const E = await import("../js/engine/split.js");
const { SAMPLE, sampleGroup } = await import("../js/sample-data.js");
const { CONFIG } = await import("../config.js");
const { COPY, t } = await import("../js/copy.js");

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
let fails = 0, passes = 0;
const check = (ok, name) => {
  if (ok) passes++;
  else { fails++; if (fails <= 40) console.log("FAIL  " + name); }
};
const read = (p) => readFileSync(join(ROOT, p), "utf8");
const sha = (s) => createHash("sha256").update(s).digest("hex");
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// 1. Locked files have not changed. Line endings are ignored so Windows is fine.
const HASHES = {
  "js/engine/split.js": "da341eea0bfebea6d3efa4739ee5b21963bc48d66f9ba95ab8a5d15a8c6ffafe",
  "js/sample-data.js": "67942d8dec24371df3560fdc4988d2646127de0f3b6c97793a81a29d6a6053e3",
  "vercel.json": "ba4d7641ff1671722cefdaea29f7ce12d5341129eb068f2b324259f5e03cca85"
};
for (const [file, hash] of Object.entries(HASHES)) {
  check(sha(read(file).replace(/\r/g, "")) === hash, `Locked file was changed: ${file}`);
}

// 2. The sample trip: the exact numbers the site and the reel show.
const G = sampleGroup();
const R = E.settle(G);
check(G.people.length === 5 && G.expenses.length === 11 && G.name === "Pondy weekend", "sample builds 5 people and 11 payments");
check(R.headline === "11 payments settled in 3 transfers.", `sample headline is "${R.headline}"`);
check(R.total === 1935000 && E.fmtMoney(R.total) === "₹19,350", `sample total ${R.total}`);
check(same(R.counts, { people: 5, payments: 11, transfers: 3, directDebts: 10, plainGreedy: 4 }), `sample counts ${JSON.stringify(R.counts)}`);
check(same(R.dsa, { mapUpdates: 59, openBalances: 5, zeroGroups: 2, exactPairs: 1, subsetsChecked: 31, greedySteps: 3 }), `sample DSA ${JSON.stringify(R.dsa)}`);
check(same(R.balances.map((b) => [b.name, b.paid, b.share, b.net]), [
  ["Arun", 657000, 294000, 363000], ["Priya", 177000, 456000, -279000], ["Karthik", 286000, 435000, -149000],
  ["Divya", 735000, 456000, 279000], ["Vignesh", 80000, 294000, -214000]
]), "sample balances");
check(R.direct.length === 10 && R.direct.every((x) => x.amount > 0 && x.fromName && x.toName), "sample direct debts");
check(same(R.transfers.map((x) => `${x.fromName}>${x.toName}:${x.amount}`), ["Priya>Divya:279000", "Vignesh>Arun:214000", "Karthik>Arun:149000"]), "sample transfers");
const SHARE = "Pondy weekend: 11 payments settled in 3 transfers.\n\n1. Priya pays Divya ₹2,790\n2. Vignesh pays Arun ₹2,140\n3. Karthik pays Arun ₹1,490\n\nTotal spent: ₹19,350\nSee the full split: https://x.test/#g=abc\n\nMade with Split Smart by Wrench Wise";
check(E.shareText(G, R, "https://x.test/#g=abc") === SHARE, "sample share text");
check(!E.shareText(G, R).includes("See the full split"), "share text without a link");
const ENC = E.encodeGroup(G);
check(same(E.decodeGroup(ENC).group, G), "sample survives encode and decode");
check(ENC.length < 600, `sample link part is short (${ENC.length})`);

// 3. Exact cases.
const people = (...names) => names.reduce((g, n) => E.addPerson(g, n).group, E.newGroup("Test"));
let g3 = people("A", "B", "C");
const [a, b, c] = g3.people.map((p) => p.id);
check(same([...E.shares({ amount: 100000, paidBy: b, split: [a, b, c] })], [[a, 33333], [b, 33334], [c, 33333]]), "leftover paisa goes to the payer");
check(same([...E.shares({ amount: 100001, paidBy: a, split: [b, c] })], [[b, 50001], [c, 50000]]), "leftover goes down the list when the payer does not share");
check(same([...E.shares({ amount: 2, paidBy: c, split: [a, b, c] })], [[a, 1], [b, 0], [c, 1]]), "tiny amount shares");
check(E.settle(g3).headline === "Add a payment to see who owes whom.", "no payments headline");
check(E.settle(g3).empty === true, "no payments is empty");
g3 = E.addExpense(g3, { label: "Tea", amount: 9000, paidBy: a, split: [a, b, c] }).group;
check(E.settle(g3).headline === "1 payment settled in 2 transfers.", "one payment wording");
const even = E.addExpense(people("A", "B"), { amount: 5000, paidBy: 1, split: [1] }).group;
check(E.settle(even).headline === "1 payment, and everyone is even.", "even wording");
check(E.settle(even).settled === true, "even is settled");
const one = E.addExpense(people("A", "B"), { amount: 5000, paidBy: 1, split: [2] }).group;
check(E.settle(one).headline === "1 payment settled in 1 transfer.", "one transfer wording");
check(same(E.settle(one).transfers.map((x) => [x.from, x.to, x.amount]), [[2, 1, 5000]]), "one transfer amount");

check(E.addPerson(g3, "  ").reason === "empty", "empty name");
check(E.addPerson(g3, "a").reason === "duplicate", "duplicate name ignores capitals");
check(E.addPerson(g3, "Abcdefghijklmnopqrstu").reason === "long", "long name");
check(E.addPerson(g3, "  Ravi   Kumar ").person.name === "Ravi Kumar", "names are tidied");
check(E.addPerson(g3, "தமிழ்செல்வன்").ok === true, "Tamil name works");
check(E.removePerson(g3, a).reason === "inUse", "cannot remove a person in a payment");
check(E.removePerson(g3, 999).reason === "unknown", "unknown person");
let full = E.newGroup();
for (let i = 0; i < 15; i++) full = E.addPerson(full, "P" + i).group;
check(E.addPerson(full, "P15").reason === "full", "15 people limit");
check(E.addExpense(g3, { amount: 0, paidBy: a, split: [a] }).reason === "amount", "zero amount");
check(E.addExpense(g3, { amount: 10.5, paidBy: a, split: [a] }).reason === "amount", "amount must be whole paise");
check(E.addExpense(g3, { amount: 100000001, paidBy: a, split: [a] }).reason === "amount", "amount limit");
check(E.addExpense(g3, { amount: 100, paidBy: 999, split: [a] }).reason === "payer", "unknown payer");
check(E.addExpense(g3, { amount: 100, paidBy: a, split: [] }).reason === "split", "empty split");
check(E.addExpense(g3, { amount: 100, paidBy: a, split: [a, a] }).reason === "split", "repeated split");
check(E.addExpense(g3, { amount: 100, paidBy: a, split: [999] }).reason === "split", "unknown split");
check(E.addExpense(g3, { label: "x".repeat(41), amount: 100, paidBy: a, split: [a] }).reason === "long", "long label");
check(same(E.addExpense(g3, { amount: 100, paidBy: a, split: [c, a] }).expense.split, [a, c]), "split is kept in people order");
const before = JSON.stringify(g3);
const up = E.updateExpense(g3, g3.expenses[0].id, { amount: 12000 });
check(up.ok && up.group.expenses[0].amount === 12000 && up.group.expenses[0].label === "Tea", "update changes only what is given");
check(E.updateExpense(g3, 999, { amount: 1 }).reason === "unknown", "update unknown payment");
check(E.removeExpense(g3, g3.expenses[0].id).group.expenses.length === 0, "remove payment");
E.addPerson(g3, "Zed"); E.renameGroup(g3, "New"); E.removeExpense(g3, g3.expenses[0].id);
check(JSON.stringify(g3) === before, "groups are never changed in place");
check(E.renameGroup(g3, "x".repeat(41)).reason === "long", "long group name");

const AMOUNTS = [
  ["1250", 125000], ["1,250.50", 125050], ["₹1,250", 125000], ["₹ 2,000 ", 200000], ["Rs. 99", 9900], ["inr 5", 500],
  [".5", 50], ["10,00,000", 100000000], ["0", "zero"], ["0.00", "zero"], ["", "empty"], ["12.345", "decimals"],
  ["-5", "invalid"], ["1e5", "invalid"], ["abc", "invalid"], ["10,00,000.01", "max"], ["9999999999", "max"]
];
for (const [text, want] of AMOUNTS) {
  const r = E.parseAmount(text);
  check(typeof want === "number" ? r.ok && r.paise === want : !r.ok && r.reason === want, `parseAmount(${JSON.stringify(text)}) gave ${JSON.stringify(r)}`);
}
check(same([0, 5, 50, 100, 33333, 150000, 1234567, 100000000, -90000].map(E.fmtMoney),
  ["₹0", "₹0.05", "₹0.50", "₹1", "₹333.33", "₹1,500", "₹12,345.67", "₹10,00,000", "-₹900"]), "money format");
check(E.fmt(1240) === "1,240" && E.fmt(100000) === "1,00,000" && E.fmt(32767) === "32,767", "Indian number grouping");

// 4. 3,000 random groups. Every result is checked against an independent answer.
function fewest(values) {
  const v = values.filter((x) => x !== 0);
  const go = (i) => {
    while (i < v.length && v[i] === 0) i++;
    if (i === v.length) return 0;
    let best = Infinity;
    for (let j = i + 1; j < v.length; j++) {
      if (v[i] * v[j] >= 0) continue;
      v[j] += v[i];
      best = Math.min(best, 1 + go(i + 1));
      v[j] -= v[i];
    }
    return best;
  };
  return go(0);
}
let seed = 2026;
const rnd = (n) => { seed = (seed * 1103515245 + 12345) % 2147483648; return Math.floor((seed / 2147483648) * n); };
let beatGreedy = 0;
for (let i = 0; i < 3000; i++) {
  const n = 2 + rnd(8);
  let g = E.newGroup("G" + i);
  for (let k = 0; k < n; k++) g = E.addPerson(g, "Person " + k).group;
  const ids = g.people.map((p) => p.id);
  const m = 1 + rnd(20);
  for (let k = 0; k < m; k++) {
    let split = ids.filter(() => rnd(3) > 0);
    if (!split.length) split = [ids[rnd(n)]];
    const amount = rnd(2) ? (1 + rnd(30)) * 10000 : 1 + rnd(500000);
    g = E.addExpense(g, { amount, paidBy: ids[rnd(n)], split }).group;
  }
  const r = E.settle(g);
  const net = new Map(ids.map((id) => [id, 0]));
  let total = 0;
  for (const e of g.expenses) {
    total += e.amount;
    net.set(e.paidBy, net.get(e.paidBy) + e.amount);
    const base = Math.floor(e.amount / e.split.length);
    let extra = e.amount % e.split.length;
    const order = e.split.includes(e.paidBy) ? [e.paidBy, ...e.split.filter((x) => x !== e.paidBy)] : e.split;
    for (const id of order) { net.set(id, net.get(id) - base - (extra > 0 ? 1 : 0)); extra--; }
  }
  const tag = `group ${i}`;
  check(r.total === total, `${tag}: total`);
  check(same(r.balances.map((x) => x.net), ids.map((id) => net.get(id))), `${tag}: balances match an independent count`);
  check(r.balances.every((x) => x.net === x.paid - x.share), `${tag}: net is paid minus share`);
  const left = new Map(net);
  const senders = new Set(), receivers = new Set();
  for (const x of r.transfers) {
    check(Number.isInteger(x.amount) && x.amount > 0 && x.from !== x.to, `${tag}: transfer shape`);
    left.set(x.from, left.get(x.from) + x.amount);
    left.set(x.to, left.get(x.to) - x.amount);
    senders.add(x.from); receivers.add(x.to);
  }
  check([...left.values()].every((v) => v === 0), `${tag}: transfers settle everyone exactly`);
  const left2 = new Map(net);
  for (const x of r.direct) { left2.set(x.from, left2.get(x.from) + x.amount); left2.set(x.to, left2.get(x.to) - x.amount); }
  check([...left2.values()].every((v) => v === 0) && r.direct.length === r.counts.directDebts && r.direct.every((x) => x.amount > 0), `${tag}: direct debts add up`);
  check(![...senders].some((id) => receivers.has(id)), `${tag}: nobody both pays and receives`);
  const open = [...net.values()].filter((v) => v !== 0).length;
  if (n <= 9) check(r.transfers.length === fewest([...net.values()]), `${tag}: fewest transfers (${r.transfers.length} vs ${fewest([...net.values()])})`);
  check(r.transfers.length <= Math.max(0, open - 1) && r.transfers.length <= r.counts.plainGreedy, `${tag}: never more than greedy alone`);
  if (r.counts.plainGreedy > r.transfers.length) beatGreedy++;
  check(r.dsa.subsetsChecked === 2 ** open - 1 && r.dsa.openBalances === open, `${tag}: DSA numbers`);
  check(r.transfers.every((x, j) => j === 0 || r.transfers[j - 1].amount >= x.amount), `${tag}: transfers sorted biggest first`);
  check(same(E.decodeGroup(E.encodeGroup(g)).group, g), `${tag}: encode and decode`);
}
check(beatGreedy >= 0, "greedy comparison ran");

// 5. Damaged or hand-made links never break the page.
const encodeRaw = (data) => {
  const bytes = new TextEncoder().encode(JSON.stringify(data));
  let bin = "";
  for (const x of bytes) bin += String.fromCharCode(x);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};
const BAD = [
  "", "abc", "!!!!", "a".repeat(20001), ENC.slice(0, ENC.length - 7), ENC + "x", ENC.replace(/[A-Z]/, "*"),
  encodeRaw(null), encodeRaw([2, "x", [], []]), encodeRaw([1, "x", ["A", "A"], []]), encodeRaw([1, "x", ["A"], [["t", 0, 100, 0]]]),
  encodeRaw([1, "x", ["A", "B"], [["t", 2, 100, 1]]]), encodeRaw([1, "x", ["A", "B"], [["t", 0, 100, 4]]]),
  encodeRaw([1, "x", ["A", "B"], [["t", 0, 0, 1]]]), encodeRaw([1, "x", ["A", "B"], [["t", 0, 1.5, 1]]]),
  encodeRaw([1, "x", ["A", "B"], [["t", 0, 100]]]), encodeRaw([1, "x".repeat(41), [], []]),
  encodeRaw([1, "x", Array.from({ length: 16 }, (_, k) => "P" + k), []]), encodeRaw([1, "x", ["<img src=1>", 5], []]),
  encodeRaw({ 0: 1, length: 4 }), encodeRaw([1, "x", ["A"], [["t", 0, 100, 1, "extra"]]])
];
for (const s of BAD) {
  let r;
  try { r = E.decodeGroup(s); } catch { r = "threw"; }
  check(r !== "threw" && r.ok === false && r.reason === "invalid", `bad link rejected: ${s.slice(0, 40)}`);
}
check(E.decodeGroup(encodeRaw([1, "x", ["<img src=1>"], []])).ok === true, "odd names stay plain text and are allowed");
for (let i = 0; i < 2000; i++) {
  let s = "";
  for (let k = rnd(60); k > 0; k--) s += "ABCxyz0189_-=+/!".charAt(rnd(16));
  let r;
  try { r = E.decodeGroup(s); } catch { r = "threw"; }
  check(r !== "threw" && (r.ok === false || (r.group.people.length <= 15 && r.group.expenses.length <= 200)), `random link ${s}`);
}

// 6. Biggest group the page allows.
let big = E.newGroup("Big");
for (let k = 0; k < 15; k++) big = E.addPerson(big, "P" + k).group;
for (let k = 0; k < 200; k++) {
  const split = big.people.filter(() => rnd(3) > 0).map((p) => p.id);
  big = E.addExpense(big, { amount: 1 + rnd(5000000), paidBy: big.people[k % 15].id, split: split.length ? split : [big.people[0].id] }).group;
}
const t0 = performance.now();
const BR = E.settle(big);
check(BR.transfers.length <= 14, "15 people settle in at most 14 transfers");
check(big.expenses.length === 200 && E.addExpense(big, { amount: 100, paidBy: big.people[0].id, split: [big.people[0].id] }).reason === "full", "200 payments limit");
check(performance.now() - t0 < 1000, "biggest group settles quickly");

// 7. Copy has every reason and fills values.
for (const code of E.PERSON_REASONS) check(!!COPY.reasons.person[code], `person reason copy: ${code}`);
for (const code of E.AMOUNT_REASONS) check(!!COPY.reasons.amount[code], `amount reason copy: ${code}`);
for (const code of E.EXPENSE_REASONS) check(!!COPY.reasons.expense[code], `payment reason copy: ${code}`);
check(t("untangle.after", { count: "3" }) === "3 transfers with Split Smart", "t() fills values");
check(typeof CONFIG.program.name === "string" && CONFIG.program.name.length > 10, "config program name");

// 8. Privacy and writing rules across everything built so far.
const SKIP_DIRS = new Set(["node_modules", ".git", ".vercel", "tools"]);
const walk = (dir) => readdirSync(join(ROOT, dir), { withFileTypes: true }).flatMap((e) => {
  const path = dir ? `${dir}/${e.name}` : e.name;
  if (e.isDirectory()) return SKIP_DIRS.has(e.name) ? [] : walk(path);
  return /\.(js|html|css|md|json)$/.test(e.name) ? [path] : [];
});
const files = walk("");
const NEVER = [
  ["XMLHttpRequest", /XMLHttpRequest/], ["sendBeacon", /sendBeacon/], ["WebSocket", /WebSocket/],
  ["EventSource", /EventSource/], ["innerHTML", /innerHTML|outerHTML|insertAdjacentHTML/],
  ["document.write", /document\.write/], ["eval", /\beval\(|new Function\(/],
  ["console output", /console\.\w+\(/], ["analytics", /googletagmanager|gtag\(|fbq\(|connect\.facebook|clarity\.ms|hotjar/i],
  ["outside file", /<(script|link)[^>]+(src|href)=["']https?:/i], ["web font", /fonts\.googleapis|@import\s+url\(["']?http/i],
  ["confirm or alert box", /\b(window\.)?(alert|confirm|prompt)\(/]
];
const STORAGE_FILES = new Set(["js/store.js", "js/theme-init.js", "js/selftest.js"]);
for (const file of files) {
  const body = read(file);
  if (/\.(js|html|css)$/.test(file)) {
    for (const [name, re] of NEVER) check(!re.test(body), `${file}: ${name} is not allowed`);
    if (file !== "js/selftest.js") check(!/\bfetch\(/.test(body), `${file}: fetch is not allowed`);
    if (!STORAGE_FILES.has(file)) check(!/localStorage|sessionStorage|indexedDB/.test(body), `${file}: storage is only allowed in js/store.js`);
  }
  check(!/[‒-―]/.test(body), `${file}: long dash found`);
  if (!file.endsWith(".md")) check(!/(?![©®™₹])\p{Extended_Pictographic}/u.test(body), `${file}: emoji found`);
}
for (const file of ["js/store.js", "js/theme-init.js"]) {
  if (!existsSync(join(ROOT, file))) continue;
  const keys = [...read(file).matchAll(/["'`](ss-[\w-]+)["'`]/g)].map((x) => x[1]);
  check(keys.every((k) => ["ss-theme", "ss-group", "ss-intro-seen"].includes(k)), `${file} keys: ${keys}`);
}
const CSP = JSON.parse(read("vercel.json")).headers[0].headers.find((h) => h.key === "Content-Security-Policy").value;
check(CSP.includes("connect-src 'none'") && CSP.includes("script-src 'self'"), "vercel.json lock");
if (existsSync(join(ROOT, "index.html"))) {
  const html = read("index.html");
  check(/<meta[^>]+Content-Security-Policy[^>]+connect-src 'none'/i.test(html), "index.html: CSP meta tag missing");
  check(!/\sstyle=/i.test(html), "index.html: inline style attribute is blocked by the lock");
  check(!/\son[a-z]+=/i.test(html), "index.html: inline event handler is blocked by the lock");
  check(!/<script(?![^>]*\bsrc=)[^>]*>/i.test(html), "index.html: inline script is blocked by the lock");
  check(!/<style\b/i.test(html), "index.html: style tag is blocked by the lock");
  check(/<input[^>]+id=["']amount["'][^>]*inputmode=["']decimal["']|<input[^>]+inputmode=["']decimal["'][^>]*id=["']amount["']/i.test(html), 'index.html: needs <input id="amount" inputmode="decimal">');
}

console.log(`${passes} checks passed, ${fails} failed (${files.length} files scanned)`);
console.log(fails ? "RESULT: FAILED" : "RESULT: ALL PASS");
process.exit(fails ? 1 : 0);
