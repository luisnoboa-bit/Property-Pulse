const { chromium } = require('playwright-core');
const path = '/sessions/wonderful-dazzling-euler/mnt/outputs/propertypulse.html';
const URL = 'file://' + path;

const errs = [];
let pass = 0, fail = 0;
function ok(n, c, extra) { if (c) { pass++; console.log('  PASS ' + n); } else { fail++; console.log('  FAIL ' + n + (extra ? ' :: ' + extra : '')); } }

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1400, height: 950 } });
  const p = await ctx.newPage();
  p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  p.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));

  await p.goto(URL);
  await p.waitForTimeout(400);

  console.log('\n== Landing ==');
  ok('landing renders', await p.locator('.landH1').isVisible());
  ok('demo button present', await p.locator('[data-a="demo"]').first().isVisible());

  console.log('\n== Demo mode ==');
  await p.locator('[data-a="demo"]').first().click();
  await p.waitForTimeout(400);
  ok('dashboard loaded', await p.locator('.stats').isVisible());
  const stats = await p.locator('.statN').allTextContents();
  console.log('  stats:', JSON.stringify(stats));
  ok('overdue count > 0 (proves engine flags lapsed work)', +stats[0] > 0, 'got ' + stats[0]);
  ok('open requests = 2', stats[2] === '2', 'got ' + stats[2]);
  ok('completed YTD > 0', +stats[3] > 0);
  ok('overdue tasks rendered', await p.locator('.task.od').count() > 0);
  ok('vendor chip attached to a task', await p.locator('.vendorChip').count() > 0);
  await p.screenshot({ path: '/sessions/wonderful-dazzling-euler/s1-dash.png' });

  console.log('\n== Schedule engine sanity ==');
  const sch = await p.evaluate(() => {
    const s = buildSchedule(S.activeProp);
    return {
      n: s.length,
      sorted: s.every((t, i) => i === 0 || s[i - 1].due <= t.due),
      dupes: s.length !== new Set(s.map(t => t.ruleId)).size,
      noGutterOnCondo: null,
      statuses: [...new Set(s.map(t => t.status))],
      sample: s.slice(0, 4).map(t => t.name + ' | ' + t.status + ' | ' + t.days + 'd'),
      // verify interval math: last done + every months == due
      mathOk: s.filter(t => t.lastDone).every(t => {
        const exp = addMonths(t.lastDone, t.every);
        return Math.abs(exp - t.due) < 86400000;
      }),
      negDaysAreOverdue: s.every(t => (t.days < 0) === (t.status === 'overdue')),
    };
  });
  console.log('  ' + JSON.stringify(sch, null, 2).replace(/\n/g, '\n  '));
  ok('tasks generated', sch.n > 25, 'got ' + sch.n);
  ok('sorted by due date', sch.sorted);
  ok('no duplicate rule ids', !sch.dupes);
  ok('interval math correct (lastDone + every = due)', sch.mathOk);
  ok('status matches day sign', sch.negDaysAreOverdue);

  console.log('\n== Flexibility: condo should not get gutter/lawn tasks ==');
  const flex = await p.evaluate(() => {
    const sysFull = new Set(['gutters', 'lawn', 'pool', 'septic']);
    const sysCondo = new Set(['fridge', 'dishwash', 'detectors']);
    const app = s => RULES.filter(r => r.req.includes('*') || r.req.some(k => s.has(k))).map(r => r.id);
    const c = app(sysCondo), f = app(sysFull);
    return { condoHasGutter: c.includes('gutterspr'), condoHasMow: c.includes('mow'),
             fullHasGutter: f.includes('gutterspr'), condoN: c.length, fullN: f.length };
  });
  console.log('  ' + JSON.stringify(flex));
  ok('condo gets NO gutter task', !flex.condoHasGutter);
  ok('condo gets NO lawn task', !flex.condoHasMow);
  ok('property with gutters DOES get gutter task', flex.fullHasGutter);

  console.log('\n== Mark done recalculates next due ==');
  const before = await p.evaluate(() => { const t = buildSchedule(S.activeProp).find(x => x.status === 'overdue'); return { id: t.ruleId, name: t.name, due: +t.due, days: t.days }; });
  await p.locator('.task.od .btn.pri').first().click();
  await p.waitForTimeout(250);
  ok('complete modal opens', await p.locator('.modal').isVisible());
  await p.locator('[data-a="saveComplete"]').click();
  await p.waitForTimeout(350);
  const after = await p.evaluate(id => { const t = buildSchedule(S.activeProp).find(x => x.ruleId === id); return { due: +t.due, days: t.days, times: t.timesDone }; }, before.id);
  console.log('  ' + before.name + ': ' + before.days + 'd -> ' + after.days + 'd');
  ok('due date pushed into the future', after.due > before.due && after.days > 0);
  ok('completion recorded', after.times > 0);
  const stats2 = await p.locator('.statN').allTextContents();
  ok('overdue count decreased', +stats2[0] === +stats[0] - 1, stats[0] + ' -> ' + stats2[0]);

  console.log('\n== Persistence ==');
  await p.reload(); await p.waitForTimeout(400);
  ok('state survives reload', await p.locator('.stats').isVisible());
  const stats3 = await p.locator('.statN').allTextContents();
  ok('same overdue count after reload', stats3[0] === stats2[0], stats2[0] + ' vs ' + stats3[0]);

  console.log('\n== Navigation across all views ==');
  for (const v of ['sched', 'requests', 'props', 'appl', 'vendors', 'settings']) {
    await p.locator(`[data-nav="${v}"]`).first().click();
    await p.waitForTimeout(200);
    const t = await p.locator('.pageTitle').textContent();
    ok('view ' + v + ' renders (' + t + ')', await p.locator('.content').isVisible() && t.length > 0);
  }
  await p.locator('[data-nav="sched"]').first().click(); await p.waitForTimeout(200);
  await p.screenshot({ path: '/sessions/wonderful-dazzling-euler/s2-sched.png' });
  ok('schedule grouped by month', await p.locator('.tlMo').count() > 1);
  await p.locator('[data-a="schFilter"][data-k="overdue"]').click(); await p.waitForTimeout(200);
  ok('overdue filter shows only overdue', await p.locator('.task.soon, .task.fut').count() === 0);
  await p.locator('[data-a="schFilter"][data-k="all"]').click(); await p.waitForTimeout(150);

  console.log('\n== Appliance life warnings ==');
  await p.locator('[data-nav="appl"]').first().click(); await p.waitForTimeout(250);
  const pills = await p.locator('.tbl .pill').allTextContents();
  console.log('  ' + JSON.stringify(pills));
  ok('appliance rows present', await p.locator('.tbl tbody tr').count() === 9);
  ok('aged items flagged', pills.some(x => /life/i.test(x)));
  await p.screenshot({ path: '/sessions/wonderful-dazzling-euler/s3-appl.png' });

  console.log('\n== Vendors + gap detection ==');
  await p.locator('[data-nav="vendors"]').first().click(); await p.waitForTimeout(250);
  ok('7 vendors listed', await p.locator('.tbl tbody tr').count() === 7);
  await p.locator('[data-a="addVendor"]').click(); await p.waitForTimeout(250);
  await p.locator('#vname').fill('Test Electric Co');
  await p.locator('[data-vtrade="electrical"]').click();
  await p.locator('#vphone').fill('(512) 555-9999');
  await p.locator('[data-a="saveVendor"]').click(); await p.waitForTimeout(350);
  ok('vendor added', await p.locator('.tbl tbody tr').count() === 8);
  ok('modal closed after save', await p.locator('.modal').count() === 0);

  console.log('\n== Custom maintenance item ==');
  await p.locator('[data-nav="sched"]').first().click(); await p.waitForTimeout(200);
  const nBefore = await p.locator('.task').count();
  await p.locator('[data-a="addCustom"]').click(); await p.waitForTimeout(250);
  await p.locator('#cname').fill('Service the backup generator');
  await p.locator('[data-a="saveCustom"]').click(); await p.waitForTimeout(350);
  ok('custom task added to schedule', await p.locator('.task').count() === nBefore + 1);
  const custDue = await p.evaluate(() => { const t = buildSchedule(S.activeProp).find(x => x.name.includes('generator')); return { days: t.days, src: t.src }; });
  console.log('  custom task due in ' + custDue.days + 'd, src=' + custDue.src);
  ok('custom first-due honors picked date (~30d)', custDue.days >= 25 && custDue.days <= 35, 'got ' + custDue.days);

  console.log('\n== Digest preview ==');
  await p.locator('[data-nav="dash"]').first().click(); await p.waitForTimeout(200);
  await p.locator('[data-a="preview"]').click(); await p.waitForTimeout(300);
  ok('digest modal opens', await p.locator('.modal').isVisible());
  const dg = await p.locator('.modal').textContent();
  ok('digest names the property', /Rosewood/.test(dg));
  await p.screenshot({ path: '/sessions/wonderful-dazzling-euler/s4-digest.png' });
  await p.locator('[data-a="closeModal"]').last().click(); await p.waitForTimeout(200);

  console.log('\n== Guest portal round-trip ==');
  await p.locator('[data-a="guestPortal"]').first().click(); await p.waitForTimeout(300);
  ok('guest portal renders', await p.locator('[data-g="title"]').isVisible());
  await p.locator('[data-g="name"]').fill('Test Guest');
  await p.locator('[data-g="email"]').fill('testguest@example.com');
  await p.locator('[data-g="title"]').fill('Bathroom fan is loud');
  await p.locator('[data-g="body"]').fill('It rattles when running.');
  await p.locator('[data-g="urgency"]').selectOption('high');
  await p.locator('[data-a="submitReq"]').click(); await p.waitForTimeout(400);
  ok('guest sees own request after submit', (await p.locator('.card').last().textContent()).includes('Bathroom fan'));
  ok('status shown to guest as Received', (await p.locator('.card').last().textContent()).includes('Received'));
  await p.screenshot({ path: '/sessions/wonderful-dazzling-euler/s5-guest.png' });

  console.log('\n== Owner sees guest request + replies ==');
  await p.locator('[data-a="home"]').click(); await p.waitForTimeout(300);
  await p.locator('[data-nav="requests"]').first().click(); await p.waitForTimeout(250);
  ok('new request visible to owner', (await p.locator('.content').textContent()).includes('Bathroom fan'));
  await p.locator('[data-a="advReq"]').first().click(); await p.waitForTimeout(250);
  await p.locator('#rstatus').selectOption('scheduled');
  await p.locator('#rnote').fill('Handyman booked for Friday.');
  await p.locator('[data-a="saveReq"]').click(); await p.waitForTimeout(350);
  ok('owner reply saved', (await p.locator('.content').textContent()).includes('Handyman booked'));
  const gback = await p.evaluate(() => S.requests.find(r => r.title.includes('Bathroom')).status);
  ok('status propagated to guest record', gback === 'scheduled', gback);

  console.log('\n== Full setup wizard (real user path) ==');
  await p.evaluate(() => { DB.clear(); S = blankState(); view = 'landing'; render(); });
  await p.waitForTimeout(300);
  await p.locator('[data-a="startWizard"]').first().click(); await p.waitForTimeout(300);
  ok('wizard step 1', (await p.locator('.wizH').textContent()).includes('property'));
  await p.locator('[data-d="nickname"]').fill('Cedar Park Condo');
  await p.locator('[data-d="address"]').fill('88 Cedar Park Dr Unit 4, Austin TX');
  await p.locator('[data-d="type"]').selectOption('Condo');
  await p.locator('[data-a="wizNext"]').click(); await p.waitForTimeout(250);
  // step through the 7 system groups, selecting a condo-like subset
  const picks = { heat: ['furnace'], cool: ['centralac'], water: ['tankwh'], ext: [], yard: [], appl: ['fridge', 'dishwash', 'dryer'], safety: ['detectors'] };
  for (const g of ['heat', 'cool', 'water', 'ext', 'yard', 'appl', 'safety']) {
    for (const k of picks[g]) { await p.locator(`[data-opt="${k}"]`).click(); await p.waitForTimeout(90); }
    await p.locator('[data-a="wizNext"]').click(); await p.waitForTimeout(200);
  }
  ok('reached appliance detail step', (await p.locator('.wizH').textContent()).includes('Appliance'));
  const fields = await p.locator('[data-ap]').count();
  ok('appliance fields shown only for selected items', fields === 6 * 3, 'got ' + fields);
  await p.locator('[data-ap="fridge"][data-fld="brand"]').fill('Samsung');
  await p.locator('[data-ap="fridge"][data-fld="model"]').fill('RF28R7351SG');
  await p.locator('[data-ap="fridge"][data-fld="year"]').selectOption('2022');
  await p.locator('[data-a="wizNext"]').click(); await p.waitForTimeout(250);
  ok('vendor step', (await p.locator('.wizH').textContent()).includes('call'));
  await p.locator('[data-a="wizAddVendor"]').click(); await p.waitForTimeout(250);
  await p.locator('#vname').fill('Condo HVAC Pros');
  await p.locator('[data-vtrade="hvac"]').click();
  await p.locator('#vphone').fill('(512) 555-1212');
  await p.locator('[data-a="saveVendor"]').click(); await p.waitForTimeout(300);
  ok('vendor added inside wizard', (await p.locator('.content, .wizWrap').last().textContent()).includes('Condo HVAC Pros'));
  await p.locator('[data-a="wizNext"]').click(); await p.waitForTimeout(250);
  const rev = await p.locator('.wizWrap').textContent();
  ok('review step summarizes schedule', /recurring maintenance items/.test(rev));
  ok('review excludes gutters for a condo', !/gutter/i.test(rev));
  await p.screenshot({ path: '/sessions/wonderful-dazzling-euler/s6-wizard.png' });
  await p.locator('[data-a="wizFinish"]').click(); await p.waitForTimeout(400);
  ok('landed on dashboard after finish', await p.locator('.stats').isVisible());
  const built = await p.evaluate(() => ({
    n: buildSchedule(S.activeProp).length,
    appl: S.appliances.length, vend: S.vendors.length,
    names: buildSchedule(S.activeProp).map(t => t.name),
  }));
  console.log('  built ' + built.n + ' tasks, ' + built.appl + ' appliances, ' + built.vend + ' vendors');
  ok('schedule built from answers', built.n > 8);
  // Every selected appliance now gets a record even when details were skipped,
  // which is what makes the "still missing" nag possible. 6 selected, 1 detailed.
  ok('all selected appliances saved, detailed or not', built.appl === 6, 'got ' + built.appl);
  const applState = await p.evaluate(() => ({
    inc: incompleteAppliances(S.activeProp).length,
    fridge: S.appliances.find(a => a.key === 'fridge'),
  }));
  ok('detailed appliance kept its values', applState.fridge.brand === 'Samsung' && applState.fridge.year === '2022');
  ok('skipped appliances flagged incomplete', applState.inc === 5, 'got ' + applState.inc);
  ok('vendor saved from wizard', built.vend === 1);
  ok('no gutter task on the condo', !built.names.some(n => /gutter/i.test(n)));
  ok('has HVAC filter task', built.names.some(n => /filter/i.test(n)));

  console.log('\n== CSV export ==');
  await p.locator('[data-nav="sched"]').first().click(); await p.waitForTimeout(200);
  const dlp = p.waitForEvent('download', { timeout: 5000 }).catch(() => null);
  await p.locator('[data-a="exportCsv"]').click();
  const d = await dlp;
  ok('CSV download fires', !!d, d ? d.suggestedFilename() : 'none');

  /* ---------- enhancement 1: local vendor search fallback ---------- */
  console.log('\n== Vendor gap falls back to a local search ==');
  await p.evaluate(() => { loadDemo(); });
  await p.waitForTimeout(300);
  const gapChk = await p.evaluate(() => {
    const p0 = activeProp();
    return {
      hasHvac: hasExactVendor('hvac'),
      hasElec: hasExactVendor('electrical'),
      url: googleUrl('electrical', p0, 'Electrical panel inspection'),
      loc: propLocation(p0),
      noTrade: findLocalBtn('', p0, 'x'),
    };
  });
  ok('exact-trade vendor detected when saved', gapChk.hasHvac === true);
  ok('missing trade detected', gapChk.hasElec === false);
  ok('search pulls ZIP out of the address', gapChk.loc === '78704', gapChk.loc);
  ok('search URL is a real google query', /^https:\/\/www\.google\.com\/search\?q=/.test(gapChk.url));
  ok('search URL carries trade + location + job', /electrician/.test(decodeURIComponent(gapChk.url)) &&
    /78704/.test(decodeURIComponent(gapChk.url)) && /panel/.test(decodeURIComponent(gapChk.url)), decodeURIComponent(gapChk.url));
  ok('no button rendered for self-serviced tasks', gapChk.noTrade === '');
  const nouns = await p.evaluate(() => Object.keys(TRADES).map(t => {
    const m = /Find a local ([^<]+)</.exec(findLocalBtn(t, activeProp(), 'x'));
    return m ? m[1].trim() : null;
  }));
  ok('every trade has a callable-person label', nouns.every(n => n && n.length), JSON.stringify(nouns));
  ok('labels read as a person, not a category', nouns.includes('electrician') &&
    nouns.includes('paving contractor') && !nouns.includes('electrical'), JSON.stringify(nouns));
  await p.locator('[data-nav="sched"]').first().click(); await p.waitForTimeout(300);
  const findBtns = await p.locator('a.findLocal').count();
  ok('schedule renders find-local links for uncovered trades', findBtns > 0, 'count ' + findBtns);
  const linkAttrs = await p.locator('a.findLocal').first().evaluate(el => ({ t: el.target, r: el.rel, h: el.href }));
  ok('find-local link opens a new tab safely', linkAttrs.t === '_blank' && /noopener/.test(linkAttrs.r));
  const rowKinds = await p.evaluate(() => {
    const pick = re => {
      const r = [...document.querySelectorAll('.task')].find(x => re.test(x.querySelector('.taskName').textContent));
      return r ? { chip: !!r.querySelector('.vendorChip'), find: !!r.querySelector('a.findLocal') } : null;
    };
    return {
      covered: pick(/HVAC (tune-up|service)|Service (the )?(furnace|A\/C)/i) || pick(/gutter/i),
      gap: pick(/Electrical panel/i),
      diy: pick(/Replace HVAC air filter/i),
    };
  });
  ok('covered trade shows the vendor, not a search link',
    rowKinds.covered && rowKinds.covered.chip && !rowKinds.covered.find, JSON.stringify(rowKinds.covered));
  ok('uncovered trade shows a search link instead',
    rowKinds.gap && rowKinds.gap.find, JSON.stringify(rowKinds.gap));
  ok('self-serviced task shows neither', rowKinds.diy && !rowKinds.diy.chip && !rowKinds.diy.find, JSON.stringify(rowKinds.diy));

  /* ---------- enhancement 2: date pickers ---------- */
  console.log('\n== Date inputs are real calendar pickers ==');
  await p.locator('[data-a="addCustom"]').click(); await p.waitForTimeout(300);
  const dInp = p.locator('#cdue');
  ok('custom item due date is type=date', (await dInp.getAttribute('type')) === 'date');
  ok('due date prefilled, not blank', ((await dInp.inputValue()) || '').length === 10);
  ok('quick-pick shortcuts render', (await p.locator('.dateQuick button').count()) >= 3);
  await p.locator('.dateQuick button', { hasText: 'In a month' }).click(); await p.waitForTimeout(150);
  const picked = await dInp.inputValue();
  const expect30 = await p.evaluate(() => iso(new Date(today().getTime() + 30 * 86400000)));
  ok('quick-pick sets the date correctly', picked === expect30, picked + ' vs ' + expect30);
  await p.locator('#cname').fill('Generator service');
  await p.locator('[data-a="saveCustom"]').click(); await p.waitForTimeout(350);
  const customDue = await p.evaluate(() => {
    const t = buildSchedule(S.activeProp).find(x => x.name === 'Generator service');
    return t ? { due: iso(t.due), days: t.days } : null;
  });
  ok('custom item lands on the picked date', customDue && customDue.due === expect30, JSON.stringify(customDue));
  const allDates = await p.evaluate(() => {
    loadDemo();
    return { total: 1 };
  });
  await p.waitForTimeout(300);
  await p.locator('[data-nav="sched"]').first().click(); await p.waitForTimeout(200);
  await p.locator('[data-a="complete"]').first().click(); await p.waitForTimeout(300);
  ok('log-work date is a picker too', (await p.locator('#cdate').getAttribute('type')) === 'date');
  await p.locator('.dateQuick button', { hasText: 'Yesterday' }).click(); await p.waitForTimeout(150);
  const yday = await p.evaluate(() => iso(new Date(today().getTime() - 86400000)));
  ok('backdating shortcut works', (await p.locator('#cdate').inputValue()) === yday);
  ok('active shortcut is visually marked', (await p.locator('.dateQuick button.on').count()) >= 1);
  await p.locator('.modalFt [data-a="closeModal"]').click(); await p.waitForTimeout(200);

  /* ---------- enhancement 3: skippable appliance details ---------- */
  console.log('\n== Appliance details can be skipped, then nag ==');
  await p.evaluate(() => { loadDemo(); });
  await p.waitForTimeout(250);
  await p.evaluate(() => {
    // simulate an owner who skipped: blank out two records' details
    const a = S.appliances.filter(x => x.propId === S.activeProp);
    a[0].brand = ''; a[0].model = ''; a[0].year = '';
    a[1].year = '';
    commit();
  });
  await p.waitForTimeout(250);
  const inc = await p.evaluate(() => ({
    n: incompleteAppliances(S.activeProp).length,
    fields: missingFields(incompleteAppliances(S.activeProp)[0]),
  }));
  ok('incomplete appliances detected', inc.n === 2, 'got ' + inc.n);
  ok('missing fields named specifically', inc.fields.length === 3 && inc.fields.includes('model number'), JSON.stringify(inc.fields));
  const badge = await p.locator('[data-nav="appl"] .badge, [data-nav="appl"]').first().textContent();
  ok('appliance nav flags the gap', /2/.test(badge), badge.trim());
  await p.locator('[data-nav="appl"]').first().click(); await p.waitForTimeout(300);
  const applPage = await p.locator('.content').textContent();
  ok('appliance page prompts for the missing input', /missing|incomplete|still need|fill/i.test(applPage));
  await p.evaluate(() => {
    const a = incompleteAppliances(S.activeProp)[0];
    a.brand = 'Bosch'; a.model = 'X1'; a.year = '2020';
    const b = incompleteAppliances(S.activeProp)[0];
    if (b) { b.year = '2019'; }
    commit();
  });
  await p.waitForTimeout(250);
  ok('nag clears once details are filled in', (await p.evaluate(() => incompleteAppliances(S.activeProp).length)) === 0);

  /* ---------- enhancement 4: walkthrough checklist ---------- */
  console.log('\n== Walkthrough checklist ==');
  await p.evaluate(() => { loadDemo(); });
  await p.waitForTimeout(300);
  await p.locator('[data-nav="walk"]').first().click(); await p.waitForTimeout(300);
  const seeded = await p.evaluate(() => S.walkthroughs.map(w => ({ st: w.status, n: w.items.length, fl: wtFlags(w).length })));
  ok('demo seeds walkthroughs', seeded.length === 2, JSON.stringify(seeded));
  ok('completed walkthrough has flagged findings', seeded.some(w => w.st === 'complete' && w.fl === 3), JSON.stringify(seeded));
  ok('checklist is not empty', seeded.every(w => w.n > 15), JSON.stringify(seeded));

  const chk = await p.evaluate(() => {
    const house = S.properties[0];
    const condo = { id: 'x', systems: ['fridge', 'dishwash', 'detectors'], nickname: 'Condo' };
    return {
      house: buildChecklist(house).map(i => i.label),
      condo: buildChecklist(condo).map(i => i.label),
      areas: [...new Set(buildChecklist(house).map(i => i.area))],
    };
  });
  ok('checklist is built per property, not one-size-fits-all', chk.condo.length < chk.house.length,
    chk.condo.length + ' vs ' + chk.house.length);
  ok('condo checklist excludes gutters', !chk.condo.some(l => /gutter/i.test(l)));
  ok('house checklist includes gutters', chk.house.some(l => /gutter/i.test(l)));
  ok('checklist grouped into areas', chk.areas.length >= 6, chk.areas.join(','));
  ok('every item starts unchecked', await p.evaluate(() =>
    buildChecklist(S.properties[0]).every(i => i.status === '' && i.note === '' && i.photo === '')));

  await p.locator('[data-a="newWalk"]').click(); await p.waitForTimeout(300);
  ok('start-walkthrough modal opens', await p.locator('#wvendor').isVisible());
  ok('walkthrough date is a picker', (await p.locator('#wdate').getAttribute('type')) === 'date');
  const vendOpts = await p.locator('#wvendor option').count();
  ok('vendor can be assigned from the saved directory', vendOpts > 1, 'options ' + vendOpts);
  await p.locator('#wvendor').selectOption({ index: 1 });
  const assignedName = await p.locator('#wvendor option:checked').textContent();
  await p.locator('[data-a="saveWalk"]').click(); await p.waitForTimeout(400);
  ok('new walkthrough opens straight to the checklist', (await p.locator('.wtItem').count()) > 15);
  ok('walkthrough count grew', (await p.evaluate(() => S.walkthroughs.length)) === 3);
  ok('assignment stored', await p.evaluate(() => !!S.walkthroughs.find(w => w.id === S.activeWalk).vendorId));
  ok('assigned vendor shown on the checklist header',
    (await p.locator('.cardSub').first().textContent()).includes(assignedName.split('·')[0].trim()));

  const startPct = await p.locator('.progFill').first().evaluate(el => el.style.width);
  ok('progress starts at zero', startPct === '0%', startPct);
  await p.locator('.wtBtn.ok').first().click(); await p.waitForTimeout(250);
  ok('marking an item good records it', await p.evaluate(() =>
    S.walkthroughs.find(w => w.id === S.activeWalk).items[0].status === 'ok'));
  ok('progress bar advances', (await p.locator('.progFill').first().evaluate(el => el.style.width)) !== '0%');
  await p.locator('.wtBtn.ok').first().click(); await p.waitForTimeout(250);
  ok('clicking the active state again clears it', await p.evaluate(() =>
    S.walkthroughs.find(w => w.id === S.activeWalk).items[0].status === ''));

  await p.locator('.wtBtn.attention').first().click(); await p.waitForTimeout(250);
  ok('flagging an item works', await p.evaluate(() => wtFlags(S.walkthroughs.find(w => w.id === S.activeWalk)).length === 1));
  const noteBox = p.locator('[data-wtnote]').first();
  await noteBox.fill('Downspout separated at the elbow, water hitting the foundation.');
  await p.waitForTimeout(300);
  ok('note saved next to the checklist item', await p.evaluate(() =>
    /Downspout separated/.test(S.walkthroughs.find(w => w.id === S.activeWalk).items[0].note)));
  ok('typing a note does not steal focus', await p.evaluate(() => document.activeElement.hasAttribute('data-wtnote')));
  ok('note survives a re-render', await p.evaluate(() => {
    render();
    return /Downspout separated/.test(document.querySelector('[data-wtnote]').value);
  }));

  // photo upload: build a real PNG in the page and hand it to the input
  await p.locator('[data-wtphoto]').first().setInputFiles({
    name: 'damage.png', mimeType: 'image/png',
    buffer: Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64'),
  });
  await p.waitForTimeout(700);
  const photoState = await p.evaluate(() => {
    const i = S.walkthroughs.find(w => w.id === S.activeWalk).items[0];
    return { has: !!i.photo, jpeg: /^data:image\/jpeg/.test(i.photo || ''), kb: Math.round((i.photo || '').length / 1024) };
  });
  ok('photo attaches to the item', photoState.has);
  ok('photo compressed to a JPEG thumbnail, not stored raw', photoState.jpeg);
  ok('thumbnail stays small enough for browser storage', photoState.kb < 120, photoState.kb + ' KB');
  ok('thumbnail renders and is clickable', (await p.locator('.wtThumb').count()) > 0);
  await p.locator('.wtThumb').first().click(); await p.waitForTimeout(300);
  ok('thumbnail opens full size', await p.locator('.modalBg img').isVisible());
  await p.locator('.modalBg [data-a="closeModal"]').click(); await p.waitForTimeout(250);
  await p.locator('[data-a="wtDelPhoto"]').first().click(); await p.waitForTimeout(300);
  ok('photo can be removed', await p.evaluate(() =>
    !S.walkthroughs.find(w => w.id === S.activeWalk).items[0].photo));

  // persistence across reload
  await p.reload(); await p.waitForTimeout(500);
  ok('walkthrough progress survives a reload', await p.evaluate(() => {
    const w = S.walkthroughs.find(x => x.items.some(i => /Downspout separated/.test(i.note)));
    return !!w && w.items[0].status === 'attention';
  }));

  await p.evaluate(() => { S.activeWalk = S.walkthroughs.find(w => w.status !== 'complete').id; view = 'walkdetail'; render(); });
  await p.waitForTimeout(300);
  p.once('dialog', d => d.accept());
  await p.locator('[data-a="finishWalk"]').click(); await p.waitForTimeout(500);
  const fin = await p.evaluate(() => {
    const w = S.walkthroughs.find(x => x.id === S.activeWalk);
    return {
      st: w.status, comp: w.completed,
      logged: S.completions.filter(c => c.ruleId === 'walkthru' && c.date === w.completed).length,
      locked: !document.querySelector('.wtBtn'),
      summary: /flagged for attention/i.test(document.querySelector('.content').textContent),
    };
  });
  ok('completing marks the walkthrough done', fin.st === 'complete' && !!fin.comp);
  ok('a finished walkthrough is locked read-only', fin.locked);
  ok('flagged items summarized in the report', fin.summary);
  ok('completion feeds the maintenance schedule', fin.logged >= 1, 'logged ' + fin.logged);
  const nextWt = await p.evaluate(() => {
    const t = buildSchedule(S.activeProp).find(x => x.ruleId === 'walkthru');
    return t ? { days: t.days, status: t.status } : null;
  });
  ok('walkthrough task reschedules forward, no longer overdue', nextWt && nextWt.days > 0 && nextWt.status !== 'overdue', JSON.stringify(nextWt));

  // vendor-facing link
  console.log('\n== Vendor-facing walkthrough link ==');
  const wid = await p.evaluate(() => S.walkthroughs.find(w => w.status !== 'complete').id);
  await p.goto(URL + '#walk/' + wid); await p.waitForTimeout(600);
  ok('vendor link opens the checklist with no owner sidebar',
    (await p.locator('.wtItem').count()) > 0 && (await p.locator('#sb').count()) === 0);
  ok('vendor sees the property they are inspecting',
    /Rosewood/.test(await p.locator('.brandName, .landNav').first().textContent() +
      await p.locator('.landNav').textContent()));
  const beforeV = await p.evaluate(() => wtProgress(S.walkthroughs.find(w => w.id === S.activeWalk)).done);
  await p.locator('.wtBtn.ok').last().click(); await p.waitForTimeout(300);
  const afterV = await p.evaluate(() => {
    const w = S.walkthroughs.find(x => x.id === S.activeWalk);
    return { done: wtProgress(w).done, last: w.items[w.items.length - 1].status };
  });
  ok('vendor can complete checklist items', afterV.last === 'ok' && afterV.done === beforeV + 1,
    beforeV + ' -> ' + JSON.stringify(afterV));
  await p.locator('[data-wtnote]').last().fill('Attic insulation is thin over the north bay.');
  await p.waitForTimeout(300);
  ok('vendor notes save to the owner\'s record', await p.evaluate(() => {
    const w = S.walkthroughs.find(x => x.id === S.activeWalk);
    return /Attic insulation is thin/.test(w.items[w.items.length - 1].note);
  }));
  ok('vendor has no save-and-close owner nav', (await p.locator('[data-a="backToWalks"]').count()) === 0);
  await p.goto(URL + '#walk/doesnotexist'); await p.waitForTimeout(500);
  ok('a stale vendor link fails gracefully', !errs.length || !errs.some(e => /walkthrough/i.test(e)));
  await p.goto(URL); await p.waitForTimeout(400);

  console.log('\n== Storage headroom is visible, not a silent failure ==');
  await p.goto(URL); await p.waitForTimeout(400);
  await p.evaluate(() => { loadDemo(); view = 'settings'; render(); });
  await p.waitForTimeout(300);
  const setTxt = await p.locator('.content').textContent();
  ok('settings reports storage used', /Browser storage/.test(setTxt) && /% of ~5 MB/.test(setTxt));
  ok('storage figure is a real number', /\d+ KB used/.test(setTxt), (setTxt.match(/\d+ KB used/) || [''])[0]);
  ok('photo count surfaced', /walkthrough photo/.test(setTxt));
  const quota = await p.evaluate(() => {
    const real = localStorage.setItem.bind(localStorage);
    localStorage.setItem = () => { const e = new Error('full'); e.name = 'QuotaExceededError'; throw e; };
    const r = DB.save(S);
    const msg = [...document.querySelectorAll('.toast')].map(t => t.textContent).join('|');
    localStorage.setItem = real;
    return { r, msg };
  });
  ok('a failed save reports false rather than pretending', quota.r === false);
  ok('quota error names the cause and the fix', /storage/i.test(quota.msg) && /walkthrough|export/i.test(quota.msg), quota.msg);

  console.log('\n== Mobile layout ==');
  await p.goto(URL); await p.waitForTimeout(400);
  await p.evaluate(() => { loadDemo(); });
  await p.waitForTimeout(300);
  await p.setViewportSize({ width: 390, height: 844 });
  await p.waitForTimeout(300);
  ok('mobile menu button visible', await p.locator('#menuBtn').isVisible());
  ok('sidebar hidden off-canvas on mobile', await p.evaluate(() => document.getElementById('sb').getBoundingClientRect().right <= 1));
  await p.locator('#menuBtn').click(); await p.waitForTimeout(320);
  ok('menu button opens sidebar', await p.evaluate(() => document.getElementById('sb').getBoundingClientRect().left >= -1));
  await p.locator('[data-nav="dash"]').first().click(); await p.waitForTimeout(320);
  ok('sidebar auto-closes after nav', await p.evaluate(() => !document.getElementById('sb').classList.contains('open')));
  const hs = await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 2);
  ok('no horizontal overflow on mobile', hs);
  await p.screenshot({ path: '/sessions/wonderful-dazzling-euler/s7-mobile.png', fullPage: false });

  console.log('\n== Console errors ==');
  ok('no JS errors', errs.length === 0, errs.slice(0, 6).join(' | '));

  console.log('\n==================================');
  console.log('  ' + pass + ' passed, ' + fail + ' failed');
  console.log('==================================');
  await b.close();
  process.exit(fail ? 1 : 0);
})();
