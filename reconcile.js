
const fs = require("fs");

const latestByTxn = new Map();

const lines = fs.readFileSync("payments.jsonl", "utf8").split(/\r?\n/);

for (const line of lines) {
  if (!line.trim()) continue;

  let event;

  try {
    event = JSON.parse(line);
  } catch {
    continue; // Ignore unreadable lines
  }

  if (!event.txn_id) continue;

  const timestamp = Date.parse(event.ts);
  const previous = latestByTxn.get(event.txn_id);

  if (!previous || timestamp > previous.timestamp) {
    latestByTxn.set(event.txn_id, { event, timestamp });
  }
}

let totalKobo = 0;
let count = 0;

for (const { event } of latestByTxn.values()) {
  if (event.status !== "success") continue;

  const amount = Number(String(event.amount).replace(/,/g, ""));

  totalKobo += Math.round(amount * 100);
  count++;
}

const expected = parseInt(
  fs.readFileSync("expected.txt", "utf8").trim(),
  10
);

if (count !== expected) {
  console.log(
    `Check failed: counted ${count} successful payments, expected ${expected}.`
  );
  console.log("Something in the data isn't being handled the way the README describes.");
} else {
  console.log(`Check passed: ${count} successful payments.`);
  console.log(`Your code: KOYA-${Math.round(totalKobo / 100)}`);
}
