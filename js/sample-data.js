// LOCKED. Do not edit. The made-up trip behind the "Try a sample trip" button.
import { newGroup, addPerson, addExpense } from "./engine/split.js";

export const SAMPLE = {
  name: "Pondy weekend",
  people: ["Arun", "Priya", "Karthik", "Divya", "Vignesh"],
  // [what for, paid by, rupees, shared by ("all" or names)]
  payments: [
    ["Hotel, 2 rooms", "Divya", 5650, "all"],
    ["Petrol", "Arun", 2000, "all"],
    ["Breakfast", "Vignesh", 800, "all"],
    ["Scuba diving", "Arun", 4020, ["Priya", "Karthik", "Divya"]],
    ["Beach shack lunch", "Divya", 1700, "all"],
    ["Toll", "Priya", 450, "all"],
    ["Boat ride", "Priya", 900, "all"],
    ["Dinner at the promenade", "Karthik", 2650, "all"],
    ["Ice cream", "Priya", 420, ["Priya", "Divya"]],
    ["Auto to White Town", "Karthik", 210, ["Priya", "Karthik", "Divya"]],
    ["Snacks for the drive", "Arun", 550, "all"]
  ]
};

// Builds the sample as a normal group, using the same checks as typing it in.
export function sampleGroup() {
  let g = newGroup(SAMPLE.name);
  for (const name of SAMPLE.people) g = addPerson(g, name).group;
  const id = (name) => g.people.find((p) => p.name === name).id;
  for (const [label, payer, rupees, who] of SAMPLE.payments) {
    const split = who === "all" ? g.people.map((p) => p.id) : who.map(id);
    g = addExpense(g, { label, amount: rupees * 100, paidBy: id(payer), split }).group;
  }
  return g;
}
