const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'publish', 'calendar.html'), 'utf8');
const match = source.match(/const database\s*=\s*(\{[\s\S]*?\n\s*\});/);
if (!match) throw new Error('Cannot locate the calendar database');
const database = vm.runInNewContext(`(${match[1]})`);
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, 'publish', 'school-data.js'), 'utf8'), context);
const school = context.window.SCHOOL_DATA;
const base = {};
for (const [date, entry] of Object.entries(database)) {
  if (entry.shared || entry.grade1) base[date] = { shared: entry.shared || '', grade1: entry.grade1 || '' };
}
const output = {
  base,
  events: school.events,
  subjects: school.subjects.filter(item => item.who === 'grade1').map(({ date, subject, tasks }) => ({ date, subject, tasks })),
  activities: (school.activities || []).filter(item => item.who === 'grade1').map(({ date, label, text }) => ({ date, label, text })),
  exams: school.exams.filter(([, who]) => who === 'grade1').map(([date, , text]) => [date, text])
};
fs.writeFileSync(path.join(__dirname, 'data.js'), `window.IP1F_DATA = ${JSON.stringify(output, null, 2)};\n`);
console.log(`Built sanitized IP1F data: ${Object.keys(base).length} dated records`);
