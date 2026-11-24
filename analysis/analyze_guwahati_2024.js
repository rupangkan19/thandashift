// Usage: node analysis/analyze_guwahati_2024.js <open-meteo-archive.json> <outDir>
// Summarises Guwahati Apr–Sep 2024 hourly data into heat-risk statistics for working hours (6am–7pm).
const fs = require('fs');
const path = require('path');
const { heatIndex, level } = require('../risk.js');

const [src, outDir] = process.argv.slice(2);
const d = JSON.parse(fs.readFileSync(src, 'utf8')).hourly;
const rows = d.time.map((t, i) => {
  const tC = d.temperature_2m[i], rh = d.relative_humidity_2m[i];
  const hi = heatIndex(tC, rh);
  return { time: t, date: t.slice(0, 10), month: t.slice(0, 7), hour: +t.slice(11, 13),
    temp: tC, rh, hi: Math.round(hi * 10) / 10, wetbulb: d.wet_bulb_temperature_2m[i], level: level(hi).key };
}).filter(r => r.temp != null && r.rh != null);

const work = rows.filter(r => r.hour >= 6 && r.hour < 19);
const months = [...new Set(rows.map(r => r.month))];
const monthly = months.map(m => {
  const w = work.filter(r => r.month === m);
  const days = [...new Set(w.map(r => r.date))];
  const dayMax = days.map(dt => Math.max(...w.filter(r => r.date === dt).map(r => r.hi)));
  const cnt = k => w.filter(r => r.level === k).length;
  return { month: m, work_hours: w.length, green: cnt('green'), yellow: cnt('yellow'), orange: cnt('orange'), red: cnt('red'),
    days_danger_or_worse: dayMax.filter(x => x >= 41).length,
    max_temp: Math.max(...w.map(r => r.temp)), max_heat_index: Math.max(...w.map(r => r.hi)),
    avg_rh_work_hours: Math.round(w.reduce((s, r) => s + r.rh, 0) / w.length) };
});

// Hour-of-day profile: share of working hours at orange or worse, across the season
const byHour = [];
for (let h = 6; h < 19; h++) {
  const w = work.filter(r => r.hour === h);
  byHour.push({ hour: h, pct_orange_or_worse: Math.round(100 * w.filter(r => r.level === 'orange' || r.level === 'red').length / w.length),
    avg_heat_index: Math.round(10 * w.reduce((s, r) => s + r.hi, 0) / w.length) / 10 });
}

// Hottest day by peak heat index
const dates = [...new Set(work.map(r => r.date))];
const hottest = dates.map(dt => ({ dt, mx: Math.max(...work.filter(r => r.date === dt).map(r => r.hi)) })).sort((a, b) => b.mx - a.mx)[0];
const hottestDay = rows.filter(r => r.date === hottest.dt);

// Temperature-only blind spot: hours where air temp < 37°C (would not look alarming) but heat index is orange or worse
const blind = work.filter(r => r.temp < 37 && (r.level === 'orange' || r.level === 'red')).length;
const dangerAll = work.filter(r => r.level === 'orange' || r.level === 'red').length;

const summary = { source: 'Open-Meteo historical weather archive (ERA5-based), lat 26.14 lon 91.74, Apr 1 - Sep 30 2024',
  working_hours_analysed: work.length, hours_orange_or_worse: dangerAll,
  pct_orange_or_worse: Math.round(1000 * dangerAll / work.length) / 10,
  hours_orange_or_worse_with_air_temp_below_37C: blind,
  pct_of_danger_hours_below_37C_air_temp: Math.round(1000 * blind / dangerAll) / 10,
  hottest_day: hottest.dt, hottest_day_peak_heat_index: hottest.mx, monthly, byHour };

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'guwahati_2024_summary.json'), JSON.stringify(summary, null, 2));
const csv = (arr) => [Object.keys(arr[0]).join(','), ...arr.map(o => Object.values(o).join(','))].join('\n');
fs.writeFileSync(path.join(outDir, 'guwahati_2024_hourly_risk.csv'), csv(rows));
fs.writeFileSync(path.join(outDir, 'guwahati_2024_hottest_day.csv'), csv(hottestDay));
console.log(JSON.stringify({ ...summary, monthly: undefined, byHour: undefined }, null, 1));
console.table(monthly); console.table(byHour);
