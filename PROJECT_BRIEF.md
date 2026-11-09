# Split Smart: Project Brief

## 1. What we are building

A polished Wrench Wise website for PC and mobile. A visitor adds the people in their group and who paid what. The site shows who owes whom, using the fewest transfers, for example "11 payments settled in 3 transfers." They can share the result on WhatsApp as a message and a link. The group is saved only on their device.

**Who it is for:** students, friends planning trips, roommates and office groups, most of whom have never written code.

**Already done and tested for you:** the split engine (`js/engine/split.js`), a sample trip with 5 friends and 11 payments, all the words on the site (`js/copy.js`) and the settings (`config.js`). Your job is everything the visitor sees and touches.

**Time target:** 1 hour in total. Keep it simple and finish it properly.

When there is a trade-off, follow this order:
1. Every amount and transfer is exactly right.
2. It looks professional and feels instant on a phone.
3. Adding a payment takes a few taps, even for someone new.
4. The WhatsApp share works in one tap.
5. The DSA section teaches clearly.
6. The Wrench Wise CTA works in one tap.
7. It is easy to upgrade.
8. Everything else.

---

## 2. Hard rules

1. **Code.** Plain HTML, CSS and JavaScript (ES modules). No frameworks, libraries, CDNs, npm packages or web fonts. The only image files are the logo, the link preview image and app icons. Draw everything else with inline SVG and CSS.
2. **Locked files.** Never edit `js/engine/`, `js/sample-data.js`, `tools/`, `vercel.json` or `package.json`. Change `js/copy.js` and `config.js` only if I ask, except `siteUrl` in Phase 4. At the start of every phase, run `node tools/verify.mjs`. It must end with `RESULT: ALL PASS`. If you think a locked file is wrong, stop and tell me.
3. **No backend.** No server, database, API calls or accounts. No GA4, Meta Pixel or any other outside script. Normal links to wrench-wise.com and WhatsApp are fine.
4. **Privacy lock.** Put this as the first tag in `<head>`, after the charset:
   `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; manifest-src 'self'; connect-src 'none'; form-action 'none'; base-uri 'none'; object-src 'none'">`
   This means no inline scripts, no `<style>` tags, no `style=""` attributes and no `onclick=""` in HTML. Setting `element.style` from JavaScript is fine. Use `meta` tags for link previews, with no canonical `link` tag.
5. **One source for every number.** Every amount, count, headline, transfer and DSA number on screen comes straight from the engine: `settle()` for results, `shares()` for the "each" hint, `fmtMoney()` for every rupee amount and `fmt()` for counts. Every change to the group goes through `addPerson()`, `removePerson()`, `renameGroup()`, `addExpense()`, `updateExpense()` or `removeExpense()`. Typed amounts are read only with `parseAmount()`. Never do money maths anywhere else.
6. **Storage.** `localStorage` may hold only `ss-theme` and `ss-group` (the group, saved as `encodeGroup(group)`). `sessionStorage` may hold only `ss-intro-seen`. Use them only in `js/store.js` and `js/theme-init.js`, wrapped in try and catch. The site must work when storage is blocked. A saved group is read back only with `decodeGroup()`. If that fails, start a new group.
7. **Group data stays out of places it does not belong.** Never put names, labels or amounts in the page title, a log, an error message or the `aria-live` region. The only place group data goes into a URL is the share link's `#g=` part, built with `encodeGroup()`.
8. **Tone.** Calm and helpful. Never promise a job or a result. Never use these where a user can see them: stupid, dumb, useless, guarantee, placement, salary, lakh, "get hired", "seats left", "100% accurate", or any countdown to buy.
9. **Words.** All text comes from `js/copy.js` through `t()`. Program names always use the full name from `config.js`. No emojis. No em dashes.
10. **Safety.** Never use `innerHTML` or `insertAdjacentHTML`. Use `textContent`. Names and labels can contain anything, so they must never become HTML. No `console` output. No `alert()`, `confirm()` or `prompt()`. Use the inline confirms described below.
11. **No overlap.** Nothing overlaps, clips or scrolls sideways at 320, 360, 390, 768, 1280 or 1440 px wide. Long names and labels truncate with an ellipsis, never push the layout wider.
12. **No placeholder look.** No grey boxes, lorem ipsum, stock icons or unfinished sections. Remove any debug panel before Phase 4 ends.
13. **Phone inputs.** Every text input is at least 16px so phones do not zoom in. The amount box is `<input id="amount" inputmode="decimal" autocomplete="off">` with a ₹ sign drawn in front of it.

---

## 3. Keep it easy to upgrade

- The engine has no page code. Groups are never changed in place, so every change gives a new group and undo is just going back to the previous one.
- All words are in `js/copy.js`. All settings are in `config.js`.
- Each `config.features` switch set to `false` hides that feature with no errors.
- Each section has its own file and render function. A new section means one new file and one line in `main.js`.
- Colours, spacing and timing live only in `styles/tokens.css`.

---

## 4. Tech setup and file structure

ES modules need a local server. Use `npx --yes serve .` from the project folder, or Antigravity's built-in preview. Vercel needs no build command. Set up git in Phase 1 and commit at the end of every phase.

```
split-smart/
  index.html
  config.js            given
  vercel.json          given, LOCKED
  package.json         given, LOCKED
  manifest.json
  og-image.png         made in Phase 4
  assets/logo.png      I add this. If missing, show "Wrench Wise" as text
  assets/icon.svg      two arrows meeting in a tick, drawn in code
  js/
    engine/split.js    LOCKED
    sample-data.js     LOCKED. sampleGroup() builds the Pondy weekend trip
    copy.js            given
    theme-init.js      plain script in head. Sets theme and intro class before first paint
    main.js            starts everything. Holds group, viewing and editingId. One render() for all sections
    store.js           safe storage: loadGroup(), saveGroup(), clearGroup(), theme
    links.js           share link, WhatsApp share link, program and sales links with UTM
    group-ui.js        group name, people chips, add and remove people, sample, start new group
    payment-ui.js      add and edit payment form
    list-ui.js         payments list, delete with Undo
    result-ui.js       headline, count-up, transfer cards, total, phone sticky bar
    untangle-ui.js     the tangle-to-transfers SVG
    balances-ui.js     where everyone stands
    share-ui.js        WhatsApp, Copy summary, Copy link
    view-ui.js         shared link banner and Make my copy
    sections-ui.js     how it works, privacy strip, DSA section, CTA, footer
    motion.js          loader, count-up, scroll reveal, reduced motion check
    selftest.js        ?test=1
  styles/
    tokens.css  base.css  components.css  motion.css
  tools/verify.mjs     LOCKED
```

**The engine** (all money is whole paise, so ₹1,500 is `150000`)
- `newGroup(name)` gives an empty group: `{ v, name, people: [{ id, name }], expenses: [{ id, label, amount, paidBy, split }], nextId }`.
- `addPerson(group, name)`, `removePerson(group, id)`, `renameGroup(group, name)`, `addExpense(group, { label, amount, paidBy, split })`, `updateExpense(group, id, fields)` and `removeExpense(group, id)` each return `{ ok: true, group }` or `{ ok: false, reason }`. Never change a group yourself.
- Reasons have words in `copy.reasons.person`, `copy.reasons.expense` and `copy.reasons.groupName`.
- `parseAmount(text)` returns `{ ok: true, paise }` or `{ ok: false, reason }`, with words in `copy.reasons.amount`. It accepts `1250`, `1,250.50`, `₹1,250` and `Rs 1250`.
- `shares(expense)` gives a `Map` of person id to their share in paise.
- `settle(group)` returns `{ headline, empty, settled, total, counts, balances, transfers, direct, dsa }`:
  - `counts`: `{ people, payments, transfers, directDebts, plainGreedy }`.
  - `balances`: one per person in list order, `{ id, name, paid, share, net }`. Plus `net` gets money back, minus owes.
  - `transfers`: the fewest transfers, biggest first, `{ from, to, fromName, toName, amount }`.
  - `direct`: the debts if everyone paid each payer back directly, same shape. This is the tangle.
  - `dsa`: `{ mapUpdates, openBalances, zeroGroups, exactPairs, subsetsChecked, greedySteps }`.
- `shareText(group, result, link)` gives the WhatsApp and Copy summary text.
- `encodeGroup(group)` and `decodeGroup(text)` turn a group into the short text used in share links and storage, and back. `decodeGroup()` never throws and returns `{ ok: false, reason: "invalid" }` for anything damaged.
- `fmtMoney(paise)` gives `₹1,500` or `₹333.33`. `fmt(n)` gives Indian grouping, like `1,00,000`.
- `LIMITS`: 15 people, 200 payments, names 20 letters, labels and group name 40 letters, ₹10,00,000 per payment.

---

## 5. Page layout

**Laptop (1024px and up):** centred, max width 1200px. A short hero across the top. Below it two columns. Left (about 55%): group card, add payment card, payments list. Right (about 45%, sticky with `top` offset): result card with transfer cards and share buttons, then the untangle card. Below both: balances at full width, then the other sections.

**Phone:** one column in this order: short hero, group card, add payment card, payments list, result card, untangle, balances, share. When the group has at least 1 payment and the result card is off screen, a sticky bottom bar shows the transfer count and a "See plan" button that scrolls smoothly to the result card (instantly under reduced motion).

**Order of sections below the tool:** how it works, privacy strip, DSA section, CTA, footer.

---

## 6. Features

**A. Loader.** Shown on the first visit of a session. The logo in the centre, with three small coin dots that slide along curved lines and meet in a tick, and a thin brand gradient bar. It ends by `config.loaderMs` (never longer), fades in 250 ms, and the hero rises 12px into place. If JavaScript fails, a CSS animation still removes it by 2 seconds. No loader under reduced motion.

**B. Group card.**
- Group name input (`group.label`, placeholder `group.placeholder`). Save on blur and on Enter through `renameGroup()`.
- People: an input with an Add button. Enter also adds. Each person is a chip with initials in a coloured circle and an × button (`group.remove`). Show `group.count`. Show the reason under the input on failure, filled with the name where needed.
- Avatar colours: 8 brand-safe colours in `tokens.css`, picked by the person's position in the list, so the same person always has the same colour everywhere on the page.
- Under 2 people: show `group.needTwo` and keep the payment card disabled with a soft overlay.
- `group.sample` (Try a sample trip) shows only when the group has no payments. It loads `sampleGroup()`.
- `group.reset` (Start a new group) at the bottom. It opens an inline confirm (`resetConfirm`, `resetYes`, `resetNo`) that slides open under the button. Yes clears storage and starts `newGroup()`.

**C. Add payment card.**
- Fields in this order: Amount (large, ₹ in front), What for, Paid by, Split between.
- Paid by: one pill per person, one selected. Default is the person who paid last, or the first person.
- Split between: one chip per person, all selected by default, plus an Everyone chip that selects or clears all.
- Under the chips, a live hint from `shares()` on the draft: `payment.each` with the share, or `payment.eachAbout` when shares differ by a paisa.
- The Add payment button. Enter in the amount or label box also adds. Read the amount with `parseAmount()`. Show the reason under the field on failure and shake the field once.
- After adding: the form clears the amount and label, keeps Paid by and Split between, and puts focus back in the amount box, so the next payment is quick.
- Edit (`features.editPayment`): the form heading changes to `payment.editHeading`, the fields fill in, and the buttons become `payment.save` and `payment.cancel`. Uses `updateExpense()`.

**D. Payments list.** Newest first. Each row: the label (or `payment.untitled`), `list.row` (payer and amount), `list.sharedByAll` or `list.sharedBy`, and Edit and Delete icon buttons with labels for screen readers. `list.total` at the top. Empty: `list.empty` with a small drawn receipt. Delete: the row collapses, and a toast shows `list.deleted` with an Undo button for `config.undoMs`. Undo puts back the previous group.

**E. Result card.** Empty state first: a drawn SVG of tangled lines becoming two clean arrows, with `result.empty` and `result.emptySub`. Then:
- The headline from `result.headline`, at least 36px on laptop and 26px on phone, weight 800. Its numbers count up over `config.countUpMs`. The final frame must show exactly `result.headline`.
- `result.transfersHeading`, then one card per transfer: payer avatar, a drawn arrow, receiver avatar, both names and the amount with `fmtMoney()`. Cards stagger in. The arrow draws from left to right.
- When `settled` is true and there are payments, show `result.even` with a drawn tick.
- `result.total` with `fmtMoney(result.total)`, and `result.saved` with a small device icon (hidden in viewing mode).

**F. Untangle moment** (`features.untangle`). An SVG with each person as an avatar circle placed around a circle (names under them when the group has 8 people or fewer, otherwise names show on hover and focus). It first draws every `direct` debt as a thin muted arrow, with `untangle.before`. After a short pause the thin arrows fade out and the `transfers` draw in with the brand gradient and their amounts, and the label changes to `untangle.after`. It plays once each time the result changes, plus a `untangle.replay` button. Static final state under reduced motion. Hidden when there are no payments. Lines must never cover names or amounts.

**G. Balances** (`features.balances`). `balances.heading`, then one row per person: avatar, name, a bar that grows right in `--gets` for plus or left in `--owes` for minus from a centre line, and the words `balances.getsBack`, `balances.owes` or `balances.even`. Under each row in small text: `balances.detail`. Colour is never the only signal.

**H. Share.** `share.heading` and three buttons:
- Share on WhatsApp: opens `https://wa.me/?text=` plus `encodeURIComponent(shareText(group, result, link))` in a new tab.
- Copy summary: copies `shareText(group, result, link)`.
- Copy link (`features.shareLink`): copies the share link.
- The share link is `(CONFIG.siteUrl or location.origin + location.pathname) + "#g=" + encodeGroup(group)`. When `features.shareLink` is false, pass `""` as the link.
- `share.linkNote` in small text. Show `share.copyFailed` if copying is refused.

**I. Shared link view** (`features.shareLink`). If the page opens with `#g=`, run `decodeGroup()`.
- Works: show the group in viewing mode. Banner at the top with `viewing.banner`, `viewing.sub` and `viewing.copy`. The group card is read only, the payment card is hidden, and the list has no Edit or Delete. Results, untangle, balances and share all work. Nothing is saved.
- Make my copy: if a saved group with payments exists, show the inline confirm (`viewing.replace`, `replaceYes`, `replaceNo`) first. Then save the group, leave viewing mode and remove `#g=` from the address with `history.replaceState`.
- Damaged: show `reasons.badLink` in a banner and load the saved group as normal.

**J. How it works and privacy strip.** Three numbered steps from `how`, with a drawn icon each. Then `privacy.line`, `proofTitle` and `proof`, with a drawn shield.

**K. DSA section** (`features.underTheHood`). Three cards: Hash map, Smart pairing and Greedy matching. Fill `mapLive` from `dsa.mapUpdates`, `pairLive` from `dsa.subsetsChecked` and `dsa.zeroGroups`, and `greedyLive` from `counts.transfers` and `counts.directDebts`. Show `greedyBeat` only when `counts.plainGreedy` is larger than `counts.transfers`, with `saved` as the difference. All numbers through `fmt()`. Before any payment, show the cards without the live lines.

**L. CTA.** A card with `cta.title`, `cta.body` and two buttons: the program link (`program.page`, or `website`, with UTM from `config.utm`) and WhatsApp (hidden if `salesWhatsApp` is empty). No forms or gates. Links open in a new tab with `rel="noopener noreferrer"`.

**M. Theme.** Light and dark, first visit follows the device, a toggle saves `ss-theme`.

**Saving.** After every successful change (not in viewing mode), save with `saveGroup(encodeGroup(group))`. On load, read it back with `decodeGroup()`.

**Nice to have, only if time allows:** `manifest.json` install support.

---

## 7. Visual style: matched to wrench-wise.com

Emerald as the main colour, teal and cyan as accents, gray text, white cards and soft emerald-to-cyan gradients. Every colour is a CSS variable in `styles/tokens.css`.

| Token | Light (default) | Dark |
|---|---|---|
| `--bg` | `#FFFFFF` | `#0F172A` |
| `--bg-grad` | `linear-gradient(135deg, #ECFDF5 0%, #FFFFFF 45%, #ECFEFF 100%)` | `linear-gradient(135deg, #0F172A 0%, #1E293B 100%)` |
| `--surface` | `#FFFFFF` | `#1E293B` |
| `--surface-2` | `#F3F4F6` | `#334155` |
| `--border` | `#E5E7EB` | `#334155` |
| `--text` | `#111827` | `#F1F5F9` |
| `--text-2` | `#374151` | `#CBD5E1` |
| `--muted` | `#6B7280` | `#94A3B8` |
| `--brand` | `#059669` | `#10B981` |
| `--brand-strong` | `#047857` | `#34D399` |
| `--brand-soft` | `#D1FAE5` | `rgba(16,185,129,0.15)` |
| `--accent` | `#0891B2` | `#22D3EE` |
| `--gets` | `#059669` | `#34D399` |
| `--owes` | `#B45309` | `#FBBF24` |
| `--tangle` | `#CBD5E1` | `#475569` |

**Brand gradient:** `--brand-grad: linear-gradient(90deg, #059669, #0D9488, #06B6D4)`. Use it for primary buttons, the bar under the header, transfer arrows and the CTA card's top edge.

**Avatar colours:** 8 tokens `--av-1` to `--av-8`, all with white initials at 4.5 to 1 contrast or better.

**Fonts:** `ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`. Headings weight 800, letter spacing -0.01em. Amounts use `font-variant-numeric: tabular-nums`.

**Shapes:** buttons, pills and chips 999px. Cards 16px. Inputs 12px.

**Shadows** (in dark, same shapes with `rgba(0,0,0,0.40)`):
- `--shadow-sm: 0 1px 3px rgba(0,0,0,0.10), 0 1px 2px -1px rgba(0,0,0,0.10)`
- `--shadow-md: 0 4px 6px -1px rgba(0,0,0,0.10), 0 2px 4px -2px rgba(0,0,0,0.10)`
- `--shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.10), 0 4px 6px -4px rgba(0,0,0,0.10)`

**Hover effects** (only inside `@media (hover: hover)`)
- Buttons lift 2px with `--shadow-md`. The primary button also slides its gradient.
- Cards, transfer cards and payment rows lift 3px with `--shadow-lg` and a soft brand border.
- Pills and chips fill with `--brand-soft`. The × on a person chip turns `--owes`.
- Hovering a transfer card highlights its arrow in the untangle SVG, and the other way round.
- Links get an underline that grows from the left.

**Micro-interactions**
- Press on any button, pill or chip: scale to 0.97.
- Inputs: border glows in `--brand` on focus. A failed field shakes once (6px, 300 ms).
- Adding a person: the chip pops in (scale 0.8 to 1). Removing: it shrinks and the others slide over.
- Adding a payment: the new row slides down into the top of the list, and the Add button shows a quick tick.
- Paid by pill: the selection slides from the old pill to the new one.
- Headline numbers count up. Transfer cards stagger in by 60 ms, and each arrow draws with `stroke-dashoffset`.
- Untangle: thin arrows fade, then gradient arrows draw one by one, and the count label flips.
- Balance bars grow from the centre line with a small overshoot.
- Delete: the row collapses, the toast slides up with a shrinking timer line.
- Copy: icon turns into a tick and the label changes to `share.copied` for 1.5 seconds.
- Theme toggle: sun and moon rotate and swap.
- Scroll reveal: lower sections fade and rise 16px, once, with `IntersectionObserver`.

**Motion rules**
- Animate only `transform`, `opacity` and SVG `stroke-dashoffset`. Bars use `transform: scaleX()`.
- `--ease-out: cubic-bezier(0.22, 1, 0.36, 1)`. `--ease: cubic-bezier(0.4, 0, 0.2, 1)`. Most effects 150 to 250 ms.
- A new change replaces any running animation.
- `prefers-reduced-motion`: no loader, count-up, stagger, untangle animation, shake or reveal. Plain state changes only.

**Access:** full keyboard use, visible focus rings (2px `--accent`), tap targets at least 44px, text contrast at least 4.5 to 1. Pills and chips are real buttons with `aria-pressed`. One polite `aria-live` region announces only `result.headline` after each change.

**Meta:** `theme-color` `#FFFFFF` and `#0F172A` by media query. Title: "Split Smart | Wrench Wise". Add a description and `og:` tags.

---

## 8. Words

Use `js/copy.js` as it is. The reasons and labels are already written. Do not add other visible text without asking me.

---

## 9. Analytics

None, on purpose (rule 3). The UTM tags on links to wrench-wise.com show visits from this project in the main site's reports.

---

## 10. Correctness

**`node tools/verify.mjs`** checks the engine, the sample's exact numbers, 3,000 random groups against an independent answer, damaged links, the locked files and the rules across all your files. It must pass at the start of every phase and before deploy.

**`?test=1`** opens a self-test page in `js/selftest.js`, listing PASS or FAIL per line:
1. The sample, run through the real page code, shows exactly "11 payments settled in 3 transfers." and the total "₹19,350".
2. The transfer cards read, in order: Priya to Divya ₹2,790, Vignesh to Arun ₹2,140, Karthik to Arun ₹1,490.
3. The untangle labels show "10 debts if everyone pays back directly" and "3 transfers with Split Smart".
4. The balances show Arun gets back ₹3,630 and Vignesh owes ₹2,140.
5. The DSA cards show 59 hash map updates, 31 possible groups, 2 groups, and "Greedy matching alone would need 4. Smart pairing saved 1."
6. The WhatsApp link starts with `https://wa.me/?text=` and, decoded, equals `shareText()` for the sample.
7. The share link's `#g=` part, run through `decodeGroup()`, gives back the same group.
8. Opening the share link shows viewing mode, and Make my copy saves it and removes `#g=`.
9. Deleting a payment and pressing Undo brings back the same headline.
10. Removing a person who is in a payment shows the `inUse` message and keeps them.
11. Adding a person named `<img src=1>` shows it as plain text and adds no image to the page.
12. Storage holds only allowed keys, and `document.title` holds no names.
13. `document.documentElement.scrollWidth` is not larger than the window width.

Also check by hand: 3 people, one pays ₹1,000 for all three. The hint shows "About ₹333.33 each", and the result is 2 transfers of ₹333.33.

---

## 11. Phases

Stop after every phase, give me the Phase Report, and wait for me to say "Go".

**Phase 1: Shell and loader (10 min).** Git, `index.html` with the privacy lock, tokens, themes, header, footer, loader, the two-column and phone layouts with empty cards, `store.js`, `theme-init.js`.

**Phase 2: Group and payments (20 min).** Group card, people chips, add payment card with the hint and edit, payments list with delete and Undo, saving and loading, sample trip, start new group, with all their micro-interactions.

**Phase 3: Results and the rest (15 min).** Result card with count-up and transfer cards, phone sticky bar, untangle, balances, share buttons, shared link view, how it works, privacy strip, DSA section, CTA, hover effects, scroll reveal.

**Phase 4: Finish and deploy (15 min).**
1. Build `?test=1`. Fix everything until it passes. Check all widths in rule 11 and both themes. Check reduced motion.
2. Make `og-image.png` (1200 x 630, Wrench Wise colours, the line "11 payments settled in 3 transfers.", the untangle picture with avatars only, no amounts).
3. Help me push the folder to GitHub. I will give you my empty repository URL.
4. Deploy on Vercel as a static site with no build command.
5. Set `config.siteUrl`, `og:url` and `og:image` to the live address, then redeploy.
6. Give click-by-click steps for anything I must do myself.
7. Confirm the live site works on a phone-sized screen, that `?test=1` passes live, and that a share link opened in a new private window shows the same result.
8. Tag the release `v1.0.0`, push the tag and give me the live link.

---

## 12. Phase Report format

- **What I built** (3 to 5 bullets)
- **How to check it** (click steps)
- **Screenshots** (phone and laptop)
- **verify.mjs result**
- **Not working or cut,** explained in plain words
- **Time used** against the target

---

## 13. If something keeps breaking

- If the same bug survives two fix attempts, stop. Explain it in plain words and give me options. Do not keep looping.
- If I say "Park it", move that feature to a "Parked" list in the Phase Report and continue.
- If time runs short, park in this order:
  1. `manifest.json` install support
  2. Edit payment (delete and add again still works)
  3. Scroll reveal
  4. Balances section
  5. Copy link button (the WhatsApp message still carries the link)
  6. Shared link view (then set `features.shareLink` to false so no link is sent)

**Never park:**
- Every rule in Section 2, above all rule 5
- The loader, hover effects and core micro-interactions (add person, add payment, count-up, transfer arrows, untangle, copy)
- Group card, add payment card, payments list with delete and Undo, saving on the device
- The result card with transfer cards, Share on WhatsApp and Copy summary
- Phone and laptop layouts, light and dark themes
- Wrench Wise branding and the CTA
- `verify.mjs`, `?test=1` and deployment
