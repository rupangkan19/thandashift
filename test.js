// Run: node test.js
const assert = require('assert');
const { heatIndex, level, planShifts, workerAlert } = require('./risk.js');

// NWS table: 95°F at 60% RH ≈ 113-114°F (~45°C)
const hi = heatIndex(35, 60);
assert(hi > 44.5 && hi < 46, `HI(35C,60%) = ${hi}`);
// Mild conditions stay close to air temperature
assert(Math.abs(heatIndex(25, 50) - 25) < 1.5);
// Humid 33°C feels hotter than dry 38°C (the humid-heat point in the proposal)
assert(heatIndex(33, 85) > heatIndex(38, 20));

assert.strictEqual(level(30).key, 'green');
assert.strictEqual(level(35).key, 'yellow');
assert.strictEqual(level(45).key, 'orange');
assert.strictEqual(level(56).key, 'red');

const plan = planShifts([
  { hour: 6, hi: 30 }, { hour: 7, hi: 33 }, { hour: 12, hi: 56 }, { hour: 13, hi: 44 }, { hour: 17, hi: 31 },
], 2);
assert.deepStrictEqual(plan.filter(p => p.task === 'Heavy').map(p => p.hour), [6, 17]);
assert.strictEqual(plan.find(p => p.hour === 12).task, 'Rest');
assert.strictEqual(plan.find(p => p.hour === 13).task, 'Light');
// Never schedule heavy work in orange/red even if more heavy hours are requested
assert(planShifts([{ hour: 12, hi: 50 }], 3).every(p => p.task !== 'Heavy'));

const msg = workerAlert('Bikash', plan);
assert(msg.includes('108') && msg.includes('RED'));
console.log('All tests passed');
