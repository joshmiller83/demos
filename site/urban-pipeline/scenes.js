// Scenes for the Urban Pipeline demo. Each scene renders its starting DOM and
// lists beats. A beat is a state change at a time offset (ms), so the player
// can rebuild a scene and replay beats up to any point to seek.
//
// The people and file are invented. Class names, rules, action labels,
// summaries and table columns follow the urban_pipeline module's code.

(function () {
  const SRC = [
    { k: 'dana', first: 'Dana', last: 'Whitfield', formal: 'Dana Whitfield', email: 'dwhitfield@urban.org', title: 'Senior Fellow', div: 'HPC', pron: 'She/Her/Hers' },
    { k: 'marcus', first: 'Marcus', last: 'Oyelaran', formal: 'Marcus Oyelaran', email: 'moyelaran@urban.org', title: 'Principal Research Associate', div: 'JPC', pron: 'He/Him/His' },
    { k: 'priya', first: 'Priya', last: 'Raman', formal: 'Priyanka Raman', email: 'praman@urban.org', title: 'Research Analyst', div: 'TPC', pron: '' },
    { k: 'leo', first: 'Leo', last: 'Castellanos', formal: 'Leonardo Castellanos', email: 'lcastellanos@urban.org', title: 'Senior Research Associate', div: 'IBP', pron: 'They/Their/Them' },
    { k: 'hannah', first: 'Hannah', last: 'Ruiz', formal: 'Hannah Ruiz', email: 'hruiz@urban.org', title: 'Research Assistant', div: 'HFP', pron: 'She/Her/Hers' },
    { k: 'sam', first: 'Sam', last: 'Okafor', formal: 'Samuel Okafor', email: 'sokafor@urban.org', title: 'Policy Program Manager', div: 'EDP', pron: 'He/Him/His' },
  ];

  const DST = [
    { k: 'dana', nid: 4127, first: 'Dana', last: 'Whitfield', email: 'dwhitfield@urban.org', title: 'Research Associate', div: 'HPC', pron: 'SHE/HER/HERS' },
    { k: 'marcus', nid: 3980, first: 'Marcus', last: 'Oyelaran', email: 'moyelaran@urban.org', title: 'Principal Research Associate', div: 'MET', pron: 'HE/HIM/HIS' },
    { k: 'priya', nid: 4410, first: 'Priyanka', last: 'Raman', email: '', title: 'Research Analyst', div: 'TPC', pron: '' },
    { k: 'sam', nid: 4033, first: 'Sam', last: 'Okafor', email: 'sokafor@urban.org', title: 'Policy Program Manager', div: 'EDP', pron: 'HE/HIM/HIS' },
    { k: 'leo', nid: 3652, first: 'Leo', last: 'Castellanos', email: 'lcastellanos@urban.org', title: 'Senior Research Associate', div: 'IBP', pron: '' },
    { k: 'glen', nid: 2871, first: 'Glen', last: 'Porter', email: 'gporter@urban.org', title: 'Visiting Fellow', div: 'LHP', pron: 'HE/HIM/HIS' },
  ];

  // Queue items in the order findDifferences() and findNewItems() produce them.
  const ITEMS = [
    { k: 'title', upid: 1, hash: '9c1e04b7', who: 'Dana Whitfield', action: 'Modify Title', sum: 'Change title from <code>Research Associate</code> to <code>Senior Fellow</code> for Dana Whitfield (dwhitfield@urban.org)', tags: [1, 2, 3] },
    { k: 'div', upid: 2, hash: '47a3d2f0', who: 'Marcus Oyelaran', action: 'Modify Division', sum: 'Change division from <code>MET</code> to <code>JPC</code> for Marcus Oyelaran (moyelaran@urban.org)', tags: [1, 4, 5] },
    { k: 'first', upid: 3, hash: 'e0b85c19', who: 'Priyanka Raman', action: 'Modify First Name', sum: 'Change first name from <code>Priyanka</code> to <code>Priya</code> for Priyanka Raman', tags: [1, 6] },
    { k: 'email', upid: 4, hash: '5d7f2a88', who: 'Priyanka Raman', action: 'Update Email', sum: 'Change email to <code>praman@urban.org</code> for Priyanka Raman', tags: [1, 6] },
    { k: 'pron', upid: 5, hash: 'b21c9e63', who: 'Leo Castellanos', action: 'Modify Pronoun', sum: 'Change preferred pronoun from <code>(none)</code> to <code>They/Their/Them</code> for Leo Castellanos', tags: [1, 7] },
    { k: 'former', upid: 6, hash: '0fa6e3d4', who: 'Glen Porter', action: 'Make Former Employee', sum: 'Make Glen Porter (gporter@urban.org) a <code>Urban Former Employee</code>', tags: [8] },
    { k: 'create', upid: 7, hash: '83c4b1fe', who: 'Hannah Ruiz', action: 'Create Author Bio', sum: 'Create author node for Hannah Ruiz (hruiz@urban.org), Research Assistant', tags: [1, 9, 3] },
  ];

  const TAGS = ['Worker Type: Employee', 'Division: HPC', 'Employee Type: Regular', 'Division: JPC', 'Division: MET', 'Division: TPC', 'Division: IBP', 'Division: LHP', 'Division: HFP'];

  const qa = (root, sel) => [...root.querySelectorAll(sel)];
  const q = (root, sel) => root.querySelector(sel);
  const show = (root, sel) => qa(root, sel).forEach((el) => el.classList.remove('hide'));
  const add = (root, sel, cls) => qa(root, sel).forEach((el) => el.classList.add(cls));
  const remove = (root, sel, cls) => qa(root, sel).forEach((el) => el.classList.remove(cls));
  const text = (root, sel, value) => qa(root, sel).forEach((el) => (el.textContent = value));
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const name = (p) => `${p.first} ${p.last}`;

  // A simplified Drupal admin window.
  const win = (path, body, extra = '') => `
    <div class="win ${extra}">
      <div class="win-bar"><span class="url">urban.org${path}</span></div>
      <div class="win-body">${body}</div>
    </div>`;

  // The Views Bulk Operations table used by scenes 7 and 8.
  const vbo = (status) => `
    <div class="filters">
      <span class="filter">Status <span class="sel" data-f="status">- Any -</span></span>
      <span class="filter">Action <span class="sel" data-f="action">- Any -</span></span>
      <span class="filter wide">Tags <span class="sel" data-f="tags">- Any -</span></span>
    </div>
    <div class="bulk">
      <span class="sel" data-f="bulk">Action</span>
      <span class="dbtn primary apply">Apply to selected items</span>
    </div>
    <table class="vbo">
      <thead><tr><th><span class="cb all"></span></th><th>Action</th><th class="c-sum">Summary</th><th>Status</th></tr></thead>
      <tbody>
        ${ITEMS.map(
          (it, i) => `
          <tr data-k="${it.k}" style="--i:${i}">
            <td><span class="cb"></span></td>
            <td class="c-act">${it.action}</td>
            <td class="c-sum"><span class="done-by"></span>${it.sum}</td>
            <td><span class="status" data-s="${status[it.k] || 'active'}">${status[it.k] || 'active'}</span></td>
          </tr>`
        ).join('')}
      </tbody>
    </table>`;

  const setStatus = (root, keys, s) =>
    keys.forEach((k) => {
      const el = q(root, `tr[data-k="${k}"] .status`);
      el.dataset.s = s;
      el.textContent = s;
    });

  const setSel = (root, f, value) => text(root, `.sel[data-f="${f}"]`, value);

  const scenes = [
    {
      title: 'Two records of the same people',
      dur: 14000,
      render(root) {
        const row = (p, side) => `
          <li class="row" data-k="${p.k}">
            <span class="row-name">${name(p)}</span>
            <span class="row-title">${p.title}</span>
            <span class="row-div">${p.div}</span>
            <span class="flag hide">${side === 'src' ? 'No bio yet' : 'Not in Workday'}</span>
          </li>`;
        root.innerHTML = `
          <div class="twin">
            <div class="side side-src hide">
              <div class="side-head"><span class="sys sys-src">Workday</span><span class="muted">HR system, exported as XML</span></div>
              <ul class="roster">${SRC.map((p) => row(p, 'src')).join('')}</ul>
            </div>
            <div class="side side-dst hide">
              <div class="side-head"><span class="sys sys-dst">urban.org</span><span class="muted">Author bios in Drupal</span></div>
              <ul class="roster">${DST.map((p) => row(p, 'dst')).join('')}</ul>
            </div>
          </div>`;
      },
      beats: [
        { at: 0, cap: 'Workday, the HR system, knows who works at the Urban Institute and what each job is called today.', run: (r) => show(r, '.side-src') },
        { at: 4500, cap: 'The website keeps its own author bio for each of those people. Nobody wants to update both by hand.', run: (r) => show(r, '.side-dst') },
        {
          at: 9000,
          cap: 'So the two drift. Titles and divisions change, new hires have no bio, and people who left still read as staff.',
          run: (r) => {
            add(r, '[data-k="dana"] .row-title, [data-k="marcus"] .row-div, [data-k="priya"] .row-name', 'drift');
            add(r, '.side-src [data-k="hannah"], .side-dst [data-k="glen"]', 'lone');
            show(r, '.side-src [data-k="hannah"] .flag, .side-dst [data-k="glen"] .flag');
          },
        },
      ],
    },

    {
      title: 'Upload the Workday export',
      dur: 14500,
      render(root) {
        root.innerHTML = win(
          '/admin/content/pipeline',
          `<h3 class="win-title">Pipeline Dashboard</h3>
           <p class="dash-empty">Please upload an XML file to get started.</p>
           <div class="dash-file hide">
             <strong>Workday XML</strong>
             <span>workday_export.xml (18.4 KB)</span>
             <span class="dbtn quiet">Delete XML File</span>
           </div>
           <span class="dbtn primary import hide">Import 6 Workday Items</span>
           <div class="field">
             <span class="label">Upload Workday XML</span>
             <span class="file-input"><span class="fbtn">Choose file</span><span class="fname">No file chosen</span></span>
           </div>
           <span class="dbtn save">Save configuration</span>`,
          'win-dash'
        );
      },
      beats: [
        { at: 0, cap: 'An administrator with the Urban Pipeline permission opens the Pipeline Dashboard.', code: 'urban_pipeline.routing.yml' },
        { at: 2400, run: (r, c) => c.point('.fbtn') },
        {
          at: 3300,
          cap: 'They choose the full Workday export. The form only accepts .xml files.',
          code: 'PipelineDashboard::validateForm()',
          run: (r, c) => {
            c.click();
            text(r, '.fname', 'workday_export.xml');
            add(r, '.fname', 'chosen');
          },
        },
        { at: 5800, run: (r, c) => c.point('.save') },
        {
          at: 6700,
          cap: 'Saving stores the file ID in config. The import button counts the report entries in the file.',
          code: 'XmlFile::count()',
          run: (r, c) => {
            c.click();
            add(r, '.dash-empty', 'gone');
            show(r, '.dash-file, .import');
            text(r, '.fname', 'No file chosen');
            remove(r, '.fname', 'chosen');
          },
        },
        { at: 10300, run: (r, c) => c.point('.import') },
        {
          at: 11200,
          cap: 'One click runs the whole pipeline.',
          code: 'PipelineDashboard::importWorkdayItems()',
          run: (r, c) => {
            c.click();
            add(r, '.import', 'busy');
            text(r, '.import', 'Importing');
          },
        },
      ],
    },

    {
      title: 'Load both sides',
      dur: 15500,
      render(root) {
        const xml = esc(`<wd:Report_Entry>
  <wd:First>Dana</wd:First>
  <wd:Last>Whitfield</wd:Last>
  <wd:Job_Title>Senior Fellow</wd:Job_Title>
  <wd:Email>dwhitfield@urban.org</wd:Email>
  <wd:Center>HPC</wd:Center>
  <wd:Preferred_Pronoun>She/Her/Hers</wd:Preferred_Pronoun>
</wd:Report_Entry>`);
        const query = esc(`$query
  ->condition('status', 1)
  ->condition('type', 'author')
  ->condition('field_urban_relationship',
      PIPELINE_URBAN_RELATIONSHIP['Urban Active Employee'])`);
        const wire = esc(`$pipeline->setSourceService($workday);
$pipeline->setDestService($authors);
$pipeline->setApprovalQueueService($queue);
$pipeline->prepareImport();`);
        const obj = (p, i, cls) => `<li class="obj ${cls} hide" style="--i:${i}"><b>${name(p)}</b><span>${p.div}</span></li>`;
        root.innerHTML = `
          <div class="load">
            <pre class="code wire hide">${wire}</pre>
            <div class="load-col">
              <div class="side-head"><span class="sys sys-src">Source</span><code>WorkdayXml</code></div>
              <pre class="code xml hide">${xml}</pre>
              <p class="becomes hide">Each entry becomes a <code>WorkdayEmployee</code></p>
              <ul class="objs">${SRC.map((p, i) => obj(p, i, 'src')).join('')}</ul>
            </div>
            <div class="load-col">
              <div class="side-head"><span class="sys sys-dst">Destination</span><code>Authors</code></div>
              <pre class="code query hide">${query}</pre>
              <p class="becomes hide">Each node becomes an <code>AuthorWorkdayEmployee</code></p>
              <ul class="objs">${DST.map((p, i) => obj(p, i, 'dst')).join('')}</ul>
            </div>
          </div>`;
      },
      beats: [
        {
          at: 0,
          cap: 'The dashboard hands the Pipeline service a source, a destination and a queue. Pipeline itself never mentions Workday.',
          code: 'Pipeline::prepareImport()',
          run: (r) => show(r, '.wire'),
        },
        {
          at: 5000,
          cap: 'The source reads each wd:Report_Entry in the file and turns it into a WorkdayEmployee object.',
          code: 'WorkdayXml::ingest()',
          run: (r) => show(r, '.xml, .load-col:first-of-type .becomes, .obj.src'),
        },
        {
          at: 10000,
          cap: 'The destination loads published authors marked as active employees. It reads each division as a Workday shortcode.',
          code: 'Authors::ingest()',
          run: (r) => show(r, '.query, .load-col:last-of-type .becomes, .obj.dst'),
        },
      ],
    },

    {
      title: 'Find the comparable other',
      dur: 21500,
      render(root) {
        const card = (p, cls) => `
          <li class="mcard ${cls}" data-k="${p.k}">
            <b>${name(p)}</b>
            <span>${p.email || '<i>no email</i>'}</span>
            <span class="via hide"></span>
          </li>`;
        root.innerHTML = `
          <div class="matching">
            <ol class="rules">
              <li data-r="1">Same email</li>
              <li data-r="2">Same first and last name</li>
              <li data-r="3">Same last name, first name shares its first three letters</li>
              <li data-r="4">Workday's formal name matches</li>
            </ol>
            <div class="match">
              <ul class="mcol">${SRC.map((p) => card(p, 'src')).join('')}</ul>
              <svg class="threads" aria-hidden="true"></svg>
              <ul class="mcol">${DST.map((p) => card(p, 'dst')).join('')}</ul>
            </div>
          </div>`;
      },
      beats: [
        {
          at: 0,
          cap: 'Before comparing anything, each record has to find its match on the other side. The rules run from strictest to loosest.',
          code: 'WorkdayEmployee::findDest()',
        },
        {
          at: 3800,
          cap: 'Most people match on email.',
          run: (r, c) => {
            add(r, '[data-r="1"]', 'on');
            ['dana', 'marcus', 'leo', 'sam'].forEach((k, i) => {
              const via = q(r, `.dst[data-k="${k}"] .via`);
              via.textContent = 'Rule 1';
              via.classList.remove('hide');
              c.thread(k, i);
            });
          },
        },
        {
          at: 7600,
          cap: 'Priyanka Raman’s bio has no email. The last name matches and “Priya” shares its first three letters, so rule 3 connects them.',
          run: (r, c) => {
            remove(r, '[data-r="1"]', 'on');
            add(r, '[data-r="1"], [data-r="2"]', 'used');
            add(r, '[data-r="3"]', 'on');
            const via = q(r, '.dst[data-k="priya"] .via');
            via.textContent = 'Rule 3';
            via.classList.remove('hide');
            c.thread('priya', 0, 'loose');
          },
        },
        {
          at: 13200,
          cap: 'Whoever is left over is news. A Workday record with no bio is a new hire. A bio with no Workday record belongs to someone who left.',
          code: 'AuthorWorkdayEmployee::findSource()',
          run: (r) => {
            remove(r, '[data-r="3"]', 'on');
            add(r, '[data-r="3"], [data-r="4"]', 'used');
            add(r, '.src[data-k="hannah"], .dst[data-k="glen"]', 'lone');
            const a = q(r, '.src[data-k="hannah"] .via');
            a.textContent = 'No bio';
            a.classList.remove('hide');
            const b = q(r, '.dst[data-k="glen"] .via');
            b.textContent = 'Not in Workday';
            b.classList.remove('hide');
          },
        },
        {
          at: 18000,
          cap: 'Both sides can look up the other, which is also what would keep a spreadsheet or RSS import from creating duplicates.',
          code: 'SourceItemInterface / DestinationItemInterface',
        },
      ],
    },

    {
      title: 'Turn differences into queue items',
      dur: 26000,
      render(root) {
        const fields = [
          ['first', 'First'],
          ['last', 'Last'],
          ['email', 'Email'],
          ['title', 'Title'],
          ['div', 'Division'],
          ['pron', 'Pronoun'],
        ];
        root.innerHTML = `
          <div class="diffs">
            <div class="cmp">
              <div class="cmp-row cmp-head"><span class="cmp-who"></span><span class="sys sys-src">Workday</span><span class="sys sys-dst">Drupal</span></div>
              ${fields
                .map(([f, label]) => `<div class="cmp-row" data-f="${f}"><span class="f">${label}</span><span class="a"></span><span class="b"></span></div>`)
                .join('')}
              <div class="stamp hide"><b>42</b><span>PIPELINE_NO_DIFFERENCES</span></div>
            </div>
            <div class="rail">
              <p class="rail-head">Queue items <span class="count">0</span></p>
              <ul class="tickets">
                ${ITEMS.map((it) => `<li class="ticket hide" data-k="${it.k}"><b>${it.action}</b><span>${it.who}</span></li>`).join('')}
              </ul>
            </div>
          </div>`;
      },
      beats: (() => {
        const pair = (r, k, diff) => {
          const s = SRC.find((p) => p.k === k);
          const d = DST.find((p) => p.k === k);
          text(r, '.cmp-who', name(s));
          qa(r, '.cmp-row[data-f]').forEach((row) => {
            const f = row.dataset.f;
            row.querySelector('.a').textContent = s[f] || '(none)';
            row.querySelector('.b').textContent = d[f] || '(none)';
            row.classList.toggle('diff', diff.includes(f));
          });
          add(r, '.stamp', 'hide');
          remove(r, '.cmp', 'dim');
        };
        const ticket = (r, keys) => {
          keys.forEach((k) => {
            const t = q(r, `.ticket[data-k="${k}"]`);
            t.classList.remove('hide');
            t.classList.add('new');
          });
          qa(r, '.ticket.new').forEach((t) => {
            if (!keys.includes(t.dataset.k)) t.classList.remove('new');
          });
          text(r, '.count', String(qa(r, '.ticket:not(.hide)').length));
        };
        return [
          {
            at: 0,
            cap: 'Each matched pair compares six fields. Every difference becomes its own queue item, with an action and everything needed to run it.',
            code: 'AuthorWorkdayEmployee::findDifferences()',
            run: (r) => {
              pair(r, 'dana', ['title']);
              ticket(r, ['title']);
            },
          },
          {
            at: 4800,
            cap: 'Divisions compare as shortcodes, and only when a taxonomy term on the site carries that shortcode.',
            code: 'AuthorWorkdayEmployee::findTermBasedOnShortcode()',
            run: (r) => {
              pair(r, 'marcus', ['div']);
              ticket(r, ['div']);
            },
          },
          {
            at: 9400,
            cap: 'Priyanka Raman’s pair produces two items: a first name change and a missing email.',
            code: 'new WorkdayAuthorQueueItem(...)',
            run: (r) => {
              pair(r, 'priya', ['first', 'email']);
              ticket(r, ['first', 'email']);
            },
          },
          {
            at: 13400,
            cap: 'Pronouns compare without regard to case. The pipeline adds or changes a pronoun, but never removes one or replaces a custom one.',
            code: 'AuthorWorkdayEmployee::pronounIsCustom()',
            run: (r) => {
              pair(r, 'leo', ['pron']);
              ticket(r, ['pron']);
            },
          },
          {
            at: 18000,
            cap: 'Sam Okafor’s records agree, so the comparison returns 42, the no-differences constant, and nothing is queued.',
            code: 'Pipeline::PIPELINE_NO_DIFFERENCES',
            run: (r) => {
              pair(r, 'sam', []);
              ticket(r, []);
              show(r, '.stamp');
            },
          },
          {
            at: 22000,
            cap: 'The leftovers become “Make Former Employee” and “Create Author Bio.” That makes seven items in all.',
            code: 'WorkdayEmployee::findNewItems()',
            run: (r) => {
              add(r, '.stamp', 'hide');
              add(r, '.cmp', 'dim');
              ticket(r, ['former', 'create']);
            },
          },
        ];
      })(),
    },

    {
      title: 'Store each item once, with tags',
      dur: 16500,
      render(root) {
        root.innerHTML = `
          <div class="tables">
            <div class="tbl tbl-items">
              <p class="tbl-name">urban_pipeline_items</p>
              <table>
                <thead><tr><th>upid</th><th>hash</th><th>action</th><th class="c-sum">summary</th><th>status</th></tr></thead>
                <tbody>
                  ${ITEMS.map(
                    (it, i) => `<tr class="hide" style="--i:${i}"><td>${it.upid}</td><td>${it.hash}…</td><td>${it.action}</td><td class="c-sum">${it.sum}</td><td>active</td></tr>`
                  ).join('')}
                  <tr class="dupe hide"><td></td><td>9c1e04b7…</td><td>Modify Title</td><td class="c-sum" colspan="2">Hash already stored. Skipped.</td></tr>
                </tbody>
              </table>
            </div>
            <div class="tbl-side">
              <div class="tbl">
                <p class="tbl-name">urban_pipeline_tags</p>
                <table>
                  <thead><tr><th>ptid</th><th>label</th></tr></thead>
                  <tbody>${TAGS.slice(0, 5)
                    .map((t, i) => `<tr class="hide tag-row" style="--i:${i}"><td>${i + 1}</td><td>${t}</td></tr>`)
                    .join('')}<tr class="hide tag-row more"><td colspan="2">4 more</td></tr></tbody>
                </table>
              </div>
              <div class="tbl">
                <p class="tbl-name">urban_pipeline_items_tags</p>
                <table>
                  <thead><tr><th>upid</th><th>ptid</th></tr></thead>
                  <tbody>${ITEMS.slice(0, 1)
                    .flatMap((it) => it.tags.map((t) => [it.upid, t]))
                    .map(([u, t], i) => `<tr class="hide tag-row" style="--i:${i}"><td>${u}</td><td>${t}</td></tr>`)
                    .join('')}<tr class="hide tag-row more"><td colspan="2">13 more</td></tr></tbody>
                </table>
              </div>
            </div>
          </div>`;
      },
      beats: [
        {
          at: 0,
          cap: 'Pipeline writes each queue item to its own table row: a hash, the action, a readable summary, a status of active, and the serialized item.',
          code: 'Pipeline::createApprovalItems()',
          run: (r) => show(r, '.tbl-items tbody tr:not(.dupe)'),
        },
        {
          at: 5500,
          cap: 'The hash covers both records and the action. Upload the same file again and each item is found by its hash and skipped.',
          code: 'WorkdayAuthorQueueItem::getHash()',
          run: (r) => show(r, '.dupe'),
        },
        {
          at: 11000,
          cap: 'Tags like “Division: HPC” go in a second table, joined many-to-many, so reviewers can filter on them.',
          code: 'WorkdayAuthorQueue::getTags()',
          run: (r) => show(r, '.tag-row'),
        },
      ],
    },

    {
      title: 'Review the queue',
      dur: 20500,
      render(root) {
        root.innerHTML = win('/admin/content/pipeline', vbo({}), 'win-vbo');
      },
      beats: [
        {
          at: 0,
          cap: 'A views data hook describes the three tables to Views, so the review queue is an ordinary view with bulk operations.',
          code: 'urban_pipeline_views_data_alter()',
        },
        { at: 3600, run: (r, c) => c.point('.sel[data-f="action"]') },
        {
          at: 4500,
          cap: 'Reviewers filter by status, action or tag. Departures are one filter away.',
          code: 'Plugin/views/filter/InOperator/ApprovalAction.php',
          run: (r, c) => {
            c.click();
            setSel(r, 'action', 'Make Former Employee');
            add(r, 'tbody tr:not([data-k="former"])', 'out');
          },
        },
        {
          at: 8200,
          cap: 'Glen Porter is a visiting fellow who isn’t on payroll, so the reviewer ignores that item.',
          run: (r, c) => c.point('tr[data-k="former"] .cb'),
        },
        { at: 9000, run: (r, c) => (c.click(), add(r, 'tr[data-k="former"]', 'checked')) },
        { at: 9700, run: (r, c) => (c.point('.sel[data-f="bulk"]'), setSel(r, 'bulk', 'Ignore Pipeline Item')) },
        { at: 10700, run: (r, c) => c.point('.apply') },
        {
          at: 11500,
          code: 'Plugin/Action/Ignore.php',
          run: (r, c) => {
            c.click();
            setStatus(r, ['former'], 'ignore');
            remove(r, 'tr', 'checked');
          },
        },
        {
          at: 13600,
          cap: 'The rest look right. Clear the filter, select them, approve.',
          run: (r, c) => {
            setSel(r, 'action', '- Any -');
            setSel(r, 'bulk', 'Action');
            remove(r, 'tr', 'out');
            c.point('.cb.all');
          },
        },
        {
          at: 14500,
          run: (r, c) => {
            c.click();
            add(r, 'tbody tr:not([data-k="former"])', 'checked');
          },
        },
        { at: 15300, run: (r, c) => (c.point('.sel[data-f="bulk"]'), setSel(r, 'bulk', 'Approve Pipeline Item')) },
        { at: 16300, run: (r, c) => c.point('.apply') },
        {
          at: 17100,
          code: 'Plugin/Action/Approve.php',
          run: (r, c) => {
            c.click();
            setStatus(
              r,
              ITEMS.filter((it) => it.k !== 'former').map((it) => it.k),
              'approved'
            );
            remove(r, 'tr', 'checked');
          },
        },
      ],
    },

    {
      title: 'Execute the approved changes',
      dur: 16000,
      render(root) {
        const status = Object.fromEntries(ITEMS.map((it) => [it.k, it.k === 'former' ? 'ignore' : 'approved']));
        root.innerHTML = win('/admin/content/pipeline', vbo(status), 'win-vbo');
      },
      beats: [
        {
          at: 0,
          cap: 'Views Bulk Operations can’t load these rows as entities by itself. An event subscriber gives it a getter that returns ApprovalItem entities.',
          code: 'UrbanPipelineSubscriber::provideViewData()',
        },
        { at: 4400, cap: 'The reviewer filters to approved items and runs Execute Planned Action.', run: (r, c) => c.point('.sel[data-f="status"]') },
        {
          at: 5200,
          run: (r, c) => {
            c.click();
            setSel(r, 'status', 'Approved');
            add(r, 'tr[data-k="former"]', 'out');
          },
        },
        { at: 6000, run: (r, c) => c.point('.cb.all') },
        { at: 6700, run: (r, c) => (c.click(), add(r, 'tbody tr:not(.out)', 'checked')) },
        { at: 7400, run: (r, c) => (c.point('.sel[data-f="bulk"]'), setSel(r, 'bulk', 'Execute Planned Action')) },
        { at: 8300, run: (r, c) => c.point('.apply') },
        {
          at: 9100,
          cap: 'Execute unserializes each stored item and calls the method it names, such as changeAuthorTitle or createAuthor. The summary records who ran it and when.',
          code: 'WorkdayAuthorQueueItem::execute()',
          run: (r, c) => {
            c.click();
            remove(r, 'tr', 'checked');
            const keys = ITEMS.filter((it) => it.k !== 'former').map((it) => it.k);
            setStatus(r, keys, 'executed');
            keys.forEach((k) => text(r, `tr[data-k="${k}"] .done-by`, 'Executed by jmiller on Mar 4, 2024 :: '));
          },
        },
      ],
    },

    {
      title: 'Editors publish, not the pipeline',
      dur: 17500,
      render(root) {
        const rows = [
          ['dana', 'Dana Whitfield'],
          ['marcus', 'Marcus Oyelaran'],
          ['priya', 'Priyanka Raman'],
          ['leo', 'Leo Castellanos'],
          ['hannah', 'Hannah Ruiz'],
        ];
        root.innerHTML = `
          <div class="drafts">
            ${win(
              '/admin/content?type=author',
              `<table class="content">
                <thead><tr><th>Title</th><th>Moderation state</th></tr></thead>
                <tbody>${rows
                  .map(
                    ([k, n]) => `<tr data-k="${k}" class="${k === 'hannah' ? 'hide' : ''}"><td>${n}</td><td><span class="state" data-s="published">Published</span><span class="pending hide">Draft pending</span></td></tr>`
                  )
                  .join('')}</tbody>
              </table>`,
              'win-content'
            )}
            ${win(
              '/node/4127/revisions',
              `<h3 class="win-title">Revisions for Dana Whitfield</h3>
               <ol class="revs">
                 <li class="rev rev-new hide">
                   <span class="state" data-s="draft">Draft</span>
                   <span class="rev-meta">Mar 4, 2024 by jmiller</span>
                   <span class="rev-log">Pipeline :: Change title from <code>Research Associate</code> to <code>Senior Fellow</code> for Dana Whitfield (dwhitfield@urban.org)</span>
                   <span class="dbtn primary publish">Publish</span>
                 </li>
                 <li class="rev">
                   <span class="state" data-s="published">Published</span>
                   <span class="rev-meta">Aug 12, 2022 by an editor</span>
                   <span class="rev-log">Updated headshot and bio</span>
                 </li>
               </ol>`,
              'win-revs hide'
            )}
          </div>`;
      },
      beats: [
        {
          at: 0,
          cap: 'Every executed change is saved as a new revision in the Draft state. Nothing goes live on its own.',
          code: 'Pipeline::unpublishedRevisionUpdate()',
          run: (r) => show(r, '.content tr:not([data-k="hannah"]) .pending'),
        },
        {
          at: 4500,
          cap: 'The revision log is the queue item’s summary with “Pipeline ::” in front, so editors can see where each change came from.',
          run: (r) => show(r, '.win-revs, .rev-new'),
        },
        {
          at: 9000,
          cap: 'New hires get a new author node, also a draft. The division goes into whichever author field accepts that term’s vocabulary.',
          code: 'WorkdayEmployee::findFieldBasedOnNodeType()',
          run: (r) => {
            show(r, '.content tr[data-k="hannah"]');
            const s = q(r, 'tr[data-k="hannah"] .state');
            s.dataset.s = 'draft';
            s.textContent = 'Draft';
          },
        },
        { at: 13200, cap: 'Content producers review each bio and publish it themselves.', run: (r, c) => c.point('.publish') },
        {
          at: 14100,
          run: (r, c) => {
            c.click();
            const s = q(r, '.rev-new .state');
            s.dataset.s = 'published';
            s.textContent = 'Published';
            add(r, '.publish', 'gone');
            add(r, 'tr[data-k="dana"] .pending', 'hide');
            text(r, '.rev:not(.rev-new) .state', 'Archived');
            qa(r, '.rev:not(.rev-new) .state').forEach((el) => (el.dataset.s = 'archived'));
          },
        },
      ],
    },

    {
      title: 'Built for more than Workday',
      dur: 16500,
      render(root) {
        root.innerHTML = `
          <div class="arch">
            <div class="plugs">
              <p class="iface">SourceInterface</p>
              <div class="plug"><b>WorkdayXml</b><span>WorkdayEmployee</span></div>
              <div class="plug ghost hide"><b>Spreadsheet</b><span>a CSV row</span></div>
              <div class="plug ghost hide"><b>RSS feed</b><span>a feed item</span></div>
            </div>
            <div class="core">
              <p class="core-name">Pipeline</p>
              <ol class="steps">
                <li>prepareImport()</li>
                <li>processDest()</li>
                <li>processSource()</li>
                <li>createApprovalItems()</li>
              </ol>
              <div class="plug q"><b>QueueInterface</b><span>WorkdayAuthorQueue</span></div>
            </div>
            <div class="plugs">
              <p class="iface">DestinationInterface</p>
              <div class="plug"><b>Authors</b><span>AuthorWorkdayEmployee</span></div>
              <div class="plug ghost hide"><b>Another content type</b><span>its own item class</span></div>
            </div>
          </div>
          <ul class="drupal hide">
            <li><b>Schema</b>three tables for items and tags</li>
            <li><b>Views</b>the review queue</li>
            <li><b>Services</b>source, destination, queue</li>
            <li><b>Queues</b>a custom one, not core's</li>
            <li><b>Events</b>the VBO entity getter</li>
          </ul>`;
      },
      beats: [
        {
          at: 0,
          cap: 'Only the dashboard knows about Workday. Pipeline talks to its source, destination and queue through interfaces.',
          code: 'src/Pipeline/Source/SourceInterface.php',
        },
        {
          at: 5000,
          cap: 'A new feed is a new source and item class registered as a service. Pipeline doesn’t change.',
          code: 'urban_pipeline.services.yml',
          run: (r) => show(r, '.ghost'),
        },
        {
          at: 10000,
          cap: 'Underneath are five parts of Drupal core: a schema, Views, services, a custom queue and events.',
          code: 'urban_pipeline.install',
          run: (r) => show(r, '.drupal'),
        },
      ],
    },
  ];

  window.FILM = { scenes };
})();
