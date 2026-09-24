/**
 * Early-access sign-ups for TUX OS and Desk → one Google Sheet.
 *
 * Setup (about two minutes):
 *   1. Create a blank Google Sheet, e.g. "Early access".
 *   2. Extensions → Apps Script. Replace everything with this file. Save.
 *   3. Deploy → New deployment → type "Web app".
 *        Execute as: Me        Who has access: Anyone
 *      Authorise when asked, then copy the Web app URL.
 *   4. Paste that URL into src/early/config.js (SIGNUP_ENDPOINT).
 *
 * The script makes a "TUX" tab and a "Desk" tab on first use, keeps one row
 * per email address, and tells each person their place in the queue.
 * After editing this file, use Deploy → Manage deployments → Edit → New
 * version, so the same URL serves the new code.
 */

// Optional: an address to email on every new sign-up. Leave '' for none.
const NOTIFY_EMAIL = '';

const LISTS = {
  tux: {
    tab: 'TUX',
    fields: [
      ['name', 'Name'],
      ['email', 'Email'],
      ['windows', 'Windows'],
      ['claude', 'Claude plan'],
      ['gpu', 'GPU'],
      ['uses', 'Will use it for'],
      ['note', 'Note'],
    ],
    required: ['name', 'email'],
  },
  desk: {
    tab: 'Desk',
    fields: [
      ['role', 'Role'],
      ['name', 'Name'],
      ['email', 'Email'],
      ['institution', 'Institution'],
      ['course', 'Course / Department'],
      ['year', 'Year'],
      ['subjects', 'Subjects taught'],
      ['classroom', 'Uses Google Classroom'],
      ['devices', 'Devices'],
      ['priority', 'Priority'],
    ],
    required: ['role', 'name', 'email', 'institution'],
  },
};

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const data = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const list = LISTS[data.list];
    if (!list) return reply({ ok: false, error: 'fields' });
    if (data.website) return reply({ ok: true, position: null }); // honeypot
    if (Number(data.elapsed) < 1500) return reply({ ok: false, error: 'slow' }); // filled by a bot

    const email = String(data.email || '').trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(email)) return reply({ ok: false, error: 'email' });
    data.email = email;
    if (data.list === 'desk' && data.role !== 'Student' && data.role !== 'Teacher') {
      return reply({ ok: false, error: 'role' });
    }
    for (const key of list.required) {
      if (!String(data[key] || '').trim()) return reply({ ok: false, error: 'fields' });
    }

    const sheet = tab(list);
    const emailCol = list.fields.findIndex(([k]) => k === 'email') + 2;
    const rows = sheet.getLastRow() - 1;
    if (rows > 0) {
      const emails = sheet.getRange(2, emailCol, rows, 1).getValues().map((r) => String(r[0]).toLowerCase());
      const at = emails.indexOf(email);
      if (at >= 0) return reply({ ok: true, duplicate: true, position: at + 1 });
    }

    const clean = (v) => String(Array.isArray(v) ? v.join(', ') : v == null ? '' : v).slice(0, 500);
    sheet.appendRow([new Date()].concat(list.fields.map(([k]) => clean(data[k]))));
    const position = sheet.getLastRow() - 1;

    if (NOTIFY_EMAIL) {
      MailApp.sendEmail(NOTIFY_EMAIL, `New ${list.tab} early-access sign-up (#${position})`,
        list.fields.map(([k, label]) => `${label}: ${clean(data[k])}`).join('\n'));
    }
    return reply({ ok: true, position });
  } catch (err) {
    return reply({ ok: false, error: 'fields' });
  } finally {
    lock.releaseLock();
  }
}

function tab(list) {
  const book = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = book.getSheetByName(list.tab);
  if (!sheet) {
    sheet = book.insertSheet(list.tab);
    sheet.appendRow(['Signed up'].concat(list.fields.map(([, label]) => label)));
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, list.fields.length + 1).setFontWeight('bold');
  }
  return sheet;
}

function reply(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
