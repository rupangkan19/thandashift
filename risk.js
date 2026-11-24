// ThandaShift heat-risk engine. Pure functions, used by the web app (browser) and analysis/tests (Node).
(function (root) {
  // US NWS heat index (Rothfusz regression + NWS adjustments). Input °C and %RH, output °C.
  function heatIndex(tC, rh) {
    const T = tC * 9 / 5 + 32;
    let hi = 0.5 * (T + 61 + (T - 68) * 1.2 + rh * 0.094);
    if ((hi + T) / 2 >= 80) {
      hi = -42.379 + 2.04901523 * T + 10.14333127 * rh - 0.22475541 * T * rh
        - 0.00683783 * T * T - 0.05481717 * rh * rh + 0.00122874 * T * T * rh
        + 0.00085282 * T * rh * rh - 0.00000199 * T * T * rh * rh;
      if (rh < 13 && T > 80 && T < 112) hi -= ((13 - rh) / 4) * Math.sqrt((17 - Math.abs(T - 95)) / 17);
      else if (rh > 85 && T > 80 && T < 87) hi += ((rh - 85) / 10) * ((87 - T) / 5);
    } else {
      hi = (hi + T) / 2;
    }
    return (hi - 32) * 5 / 9;
  }

  // Levels follow NWS heat-index bands (°C): <32 caution-or-less, 32–41 extreme caution, 41–54 danger, >=54 extreme danger.
  // Draft work guidance per level; to be reviewed by an occupational-health expert before any real use.
  const LEVELS = [
    { key: 'green',  label: 'Green',  min: -Infinity, work: 'Normal work',            rest: 'Water every hour' },
    { key: 'yellow', label: 'Yellow', min: 32,        work: 'Normal work, more breaks', rest: '10 min shaded rest per hour, water every 20 min' },
    { key: 'orange', label: 'Orange', min: 41,        work: 'Light work only',        rest: '20 min shaded rest per hour, water/ORS every 15 min' },
    { key: 'red',    label: 'Red',    min: 54,        work: 'Stop strenuous work',    rest: 'Shaded rest; only essential light tasks' },
  ];

  function level(hiC) {
    let l = LEVELS[0];
    for (const x of LEVELS) if (hiC >= x.min) l = x;
    return l;
  }

  // Pick the coolest-risk hours in the work window for heavy tasks. hours: [{hour, hi}] in time order.
  // Returns [{hour, hi, level, task}] where task is 'Heavy', 'Light', 'Rest'.
  function planShifts(hours, heavyHoursNeeded) {
    const rank = { green: 0, yellow: 1, orange: 2, red: 3 };
    const withLevel = hours.map(h => ({ ...h, level: level(h.hi) }));
    const heavy = new Set(
      withLevel.filter(h => rank[h.level.key] <= 1)
        .sort((a, b) => rank[a.level.key] - rank[b.level.key] || a.hi - b.hi)
        .slice(0, heavyHoursNeeded).map(h => h.hour));
    return withLevel.map(h => ({
      ...h,
      task: heavy.has(h.hour) ? 'Heavy' : h.level.key === 'red' ? 'Rest' : 'Light',
    }));
  }

  // One worker alert in plain English (translated per user in production).
  function workerAlert(name, plan) {
    const ranges = [];
    for (const h of plan) {
      const last = ranges[ranges.length - 1];
      if (last && last.level.key === h.level.key && last.to === h.hour) last.to = h.hour + 1;
      else ranges.push({ level: h.level, from: h.hour, to: h.hour + 1 });
    }
    const fmt = x => `${((x + 11) % 12) + 1}${x < 12 || x === 24 ? 'am' : 'pm'}`;
    const peak = Math.max(...plan.map(h => h.hi));
    const lines = ranges.map(r => `${r.level.label.toUpperCase()} ${fmt(r.from)}–${fmt(r.to)}: ${r.level.work}. ${r.level.rest}.`);
    return `Hi ${name}, today's heat peaks at "feels like" ${Math.round(peak)}°C.\n` + lines.join('\n') +
      `\nFeeling dizzy or sick? Reply 3. Emergency: call 108.`;
  }

  const api = { heatIndex, level, planShifts, workerAlert, LEVELS };
  if (typeof module !== 'undefined') module.exports = api; else root.ThandaRisk = api;
})(this);
