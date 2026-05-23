// IGI ASSOCIATE READINESS PROFILE — Google Apps Script v7
// Paste ALL → Save → Deploy → New Version (same URL stays)
// Run fixHeaders() manually once to sync existing sheet headers
// Run setupSettings() manually once to create the Settings sheet

const SHEET_NAME = 'ARP_Responses';
const SETTINGS_SHEET = 'ARP_Settings';

const HEADERS = [
  'Timestamp','Ref ID',
  'Trainer Name','Batch Code','IGI Centre','Client',
  'Name','Mobile','Store Branch','Designation','Experience','Country',
  'Diamond Type','Time Taken',
  'C2S Primary','C2S Classification','C2S Label','C2S Scores (JSON)',
  'C2S Analytical','C2S Amiable','C2S Expressive','C2S Driver',
  'RSP Primary','RSP Classification','RSP Label','RSP Scores (JSON)',
  'RSP Product Pusher','RSP Relationship Builder','RSP Experience Creator','RSP Trusted Advisor',
  '4Cs Score','4Cs Percentage','4Cs Grade','4Cs Tag Scores (JSON)',
  'Readiness Total','Readiness Band','Knowledge Points','Behavioural Points',
  'Combined Profile','Insight Title','PDF Link'
];

// ═══ SETTINGS HELPERS ════════════════════════════════════════════════════════

function getSettingsSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SETTINGS_SHEET);
  if (!sh) {
    sh = ss.insertSheet(SETTINGS_SHEET);
    sh.getRange('A1:B1').setValues([['Key','Value']]);
    sh.getRange('A1:B1').setBackground('#0D1B2E').setFontColor('#C9A84C').setFontWeight('bold');
    sh.getRange('A2:B2').setValues([['sessionCodeEnabled','false']]);
    sh.getRange('A3:B3').setValues([['sessionCode','']]);
    sh.getRange('A4:B4').setValues([['sessionCodeExpiry','0']]);
    sh.getRange('A5:B5').setValues([['activeBatch','']]);
    sh.getRange('A6:B6').setValues([['activeCentre','']]);
    sh.getRange('A7:B7').setValues([['activeClient','']]);
    sh.getRange('A8:B8').setValues([['activeTrainer','']]);
    sh.getRange('A9:B9').setValues([['activeDiamonds','natural']]);
    sh.setColumnWidth(1, 200);
    sh.setColumnWidth(2, 200);
  }
  return sh;
}

function getSetting(key) {
  const sh = getSettingsSheet();
  const data = sh.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === key) return String(data[i][1]).toLowerCase().trim();
  }
  return null;
}

function setSetting(key, value) {
  const sh = getSettingsSheet();
  const data = sh.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === key) {
      sh.getRange(i + 1, 2).setValue(value);
      return;
    }
  }
  sh.appendRow([key, value]);
}

// ═══ HEADERS ═════════════════════════════════════════════════════════════════

function ensureHeaders(sheet){
  const lastCol = Math.max(sheet.getLastColumn(), 1);
  const existing = sheet.getRange(1,1,1,lastCol).getValues()[0];
  const match = HEADERS.every((h,i) => existing[i] === h);
  if(!match){
    const clearCols = Math.max(lastCol, HEADERS.length);
    sheet.getRange(1,1,1,clearCols).clearContent();
    sheet.getRange(1,1,1,HEADERS.length).setValues([HEADERS]);
    const hr = sheet.getRange(1,1,1,HEADERS.length);
    hr.setBackground('#0D1B2E');
    hr.setFontColor('#C9A84C');
    hr.setFontWeight('bold');
    hr.setFontSize(11);
    sheet.setFrozenRows(1);
    HEADERS.forEach((_,i) => sheet.setColumnWidth(i+1, i<2?130:i<6?140:i<14?130:160));
  }
}

// ═══ POST (submit assessment) ════════════════════════════════════════════════

function doPost(e){
  try{
    const d = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);
    if(!sheet) sheet = ss.insertSheet(SHEET_NAME);
    ensureHeaders(sheet);

    let c2s={}, rsp={}, tagScores={};
    try{ c2s = JSON.parse(d.c2sScores||'{}'); }catch(x){}
    try{ rsp = JSON.parse(d.rspScores||'{}'); }catch(x){}
    try{ tagScores = JSON.parse(d.fcsTagScores||'{}'); }catch(x){}

    let pdfUrl = '';
    if(d.pdfBase64){
      try {
        const blob = Utilities.newBlob(Utilities.base64Decode(d.pdfBase64), MimeType.PDF, (d.name || 'Associate') + '_ARP_Profile.pdf');
        const file = DriveApp.createFile(blob);
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        pdfUrl = file.getUrl();
      } catch(e) {
        pdfUrl = 'Error generating PDF';
      }
    }

    const row = [
      d.timestamp||new Date().toISOString(),
      d.refId||'',
      d.trainerName||'',
      d.batchCode||'',
      d.igiCentre||'',
      d.clientParam||'',
      d.name||'',
      d.mobile||'',
      d.branch||'',
      d.designation||'',
      d.experience||'',
      d.country||'',
      d.diamondType||'',
      d.timeTaken||'',
      d.c2sPrimary||'',
      d.c2sClassification||'',
      d.c2sLabel||'',
      d.c2sScores||'',
      c2s['1']||0, c2s['2']||0, c2s['3']||0, c2s['4']||0,
      d.rspPrimary||'',
      d.rspClassification||'',
      d.rspLabel||'',
      d.rspScores||'',
      rsp['H']||0, rsp['F']||0, rsp['C']||0, rsp['A']||0,
      d.fcsScore||0,
      d.fcsPct||0,
      d.fcsGrade||'',
      d.fcsTagScores||'',
      d.readinessTotal||0,
      d.readinessBand||'',
      d.knowledgePts||0,
      d.behaviouralPts||0,
      d.comboProfile||'',
      d.insightTitle||'',
      pdfUrl
    ];

    sheet.appendRow(row);
    const lr = sheet.getLastRow();
    if(lr%2===0) sheet.getRange(lr,1,1,HEADERS.length).setBackground('#F9F3E3');

    // Flag low 4Cs scores
    if((d.fcsPct||0) < 56){
      sheet.getRange(lr,31).setBackground('#FEF2F2').setFontColor('#C94A4A');
    }

    return ContentService
      .createTextOutput(JSON.stringify({status:'ok', refId:d.refId}))
      .setMimeType(ContentService.MimeType.JSON);
  }catch(err){
    return ContentService
      .createTextOutput(JSON.stringify({status:'error', message:err.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ═══ GET (settings + code verify + instructor actions) ═══════════════════════

function doGet(e){
  const p = e && e.parameter ? e.parameter : {};
  const action = p.action || '';
  const cbFn = p.callback || ''; // JSONP callback support

  function respond(obj) {
    const jsonStr = JSON.stringify(obj);
    if (cbFn) {
      // JSONP response — wraps JSON in callback function call
      return ContentService
        .createTextOutput(cbFn + '(' + jsonStr + ')')
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    return ContentService
      .createTextOutput(jsonStr)
      .setMimeType(ContentService.MimeType.JSON);
  }

  try {
    // ── Public: is a session code required right now? ────────────────────────
    if (action === 'settingsPublic') {
      const enabled = getSetting('sessionCodeEnabled') === 'true';
      // Check expiry
      const expiryTs = parseInt(getSetting('sessionCodeExpiry') || '0');
      const now = Date.now();
      if (enabled && expiryTs > 0 && now > expiryTs) {
        setSetting('sessionCodeEnabled', 'false');
        return respond({ codeRequired: false, reason: 'expired' });
      }
      return respond({
        codeRequired: enabled,
        batch:    getSetting('activeBatch')    || '',
        centre:   getSetting('activeCentre')   || '',
        client:   getSetting('activeClient')   || '',
        trainer:  getSetting('activeTrainer')  || '',
        diamonds: getSetting('activeDiamonds') || 'natural'
      });
    }

    // ── Public: validate a session code ─────────────────────────────────────
    if (action === 'verifyCode') {
      const enabled = getSetting('sessionCodeEnabled') === 'true';
      if (!enabled) return respond({ valid: true, reason: 'code_not_required' });
      // Check expiry
      const expiryTs = parseInt(getSetting('sessionCodeExpiry') || '0');
      if (expiryTs > 0 && Date.now() > expiryTs) {
        setSetting('sessionCodeEnabled', 'false');
        return respond({ valid: false, reason: 'expired' });
      }
      const stored = (getSetting('sessionCode') || '').toString().trim().toUpperCase();
      const submitted = (p.code || '').trim().toUpperCase();
      if (!stored) return respond({ valid: false, reason: 'no_code_set' });
      if (submitted === stored) return respond({ valid: true });
      return respond({ valid: false, reason: 'wrong_code' });
    }

    // ── Instructor: get current settings ────────────────────────────────────
    if (action === 'getSettings') {
      return respond({
        status: 'ok',
        sessionCodeEnabled: getSetting('sessionCodeEnabled') === 'true',
        sessionCode: getSetting('sessionCode') || '',
        expiryTs: parseInt(getSetting('sessionCodeExpiry') || '0')
      });
    }

    // ── Instructor: save settings ────────────────────────────────────────────
    if (action === 'saveSettings') {
      const code     = (p.code     || '').trim().toUpperCase();
      const enabled  = p.enabled === 'true';
      const expiryTs = parseInt(p.expiryTs || '0');
      setSetting('sessionCode',        code);
      setSetting('sessionCodeEnabled', enabled ? 'true' : 'false');
      setSetting('sessionCodeExpiry',  expiryTs > 0 ? String(expiryTs) : '0');
      // Active session config
      if (p.batch)    setSetting('activeBatch',    p.batch);
      if (p.centre)   setSetting('activeCentre',   p.centre);
      if (p.client)   setSetting('activeClient',   p.client);
      if (p.trainer)  setSetting('activeTrainer',  p.trainer);
      if (p.diamonds) setSetting('activeDiamonds', p.diamonds);
      if (p.reportPassword) setSetting('reportPassword', p.reportPassword);
      return respond({
        status: 'ok', sessionCode: code,
        sessionCodeEnabled: enabled, expiryTs: expiryTs
      });
    }

    // ── Batch report (for retail owner dashboard) ───────────────────────────
    if (action === 'getBatchReport') {
      const batchParam = (p.batch || '').trim().toUpperCase();
      const passParam  = (p.pass  || '').trim();
      const storedPass = getSetting('reportPassword') || '';
      if (!storedPass || passParam !== storedPass) {
        return respond({ status: 'error', reason: 'wrong_password' });
      }
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
      if (!sheet) return respond({ status: 'error', reason: 'no_data' });
      const data = sheet.getDataRange().getValues();
      const headers = data[0];
      const idx = {
        batch: headers.indexOf('Batch Code'),
        name:  headers.indexOf('Name'),
        desig: headers.indexOf('Designation'),
        c2s:   headers.indexOf('C2S Classification'),
        rspKey:headers.indexOf('RSP Classification'),
        rspLabel:headers.indexOf('RSP Label'),
        ri:    headers.indexOf('Readiness Total'),
        band:  headers.indexOf('Readiness Band'),
        fcs:   headers.indexOf('4Cs Percentage'),
        client:headers.indexOf('Client')
      };
      const rows = data.slice(1)
        .filter(r => (r[idx.batch]||'').toString().trim().toUpperCase() === batchParam)
        .map(r => ({
          name:     r[idx.name]  || '',
          desig:    r[idx.desig] || '',
          c2s:      r[idx.c2s]   || '',
          rspKey:   r[idx.rspKey]|| '',
          rspLabel: r[idx.rspLabel]||'',
          ri:       r[idx.ri]    || 0,
          band:     r[idx.band]  || '',
          fcs:      r[idx.fcs]   || 0,
          client:   r[idx.client]|| ''
        }));
      if (!rows.length) return respond({ status: 'error', reason: 'no_data' });
      const client = rows[0].client || batchParam;
      return respond({ status: 'ok', rows, client });
    }

    // ── Default: response count ──────────────────────────────────────────────
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    return respond({ status: 'ok', responses: sheet ? sheet.getLastRow() - 1 : 0 });

  } catch(err) {
    return respond({ status: 'error', message: err.toString() });
  }
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// GAS doesn't support real CORS headers on doGet, but deploying as
// "Anyone (even anonymous)" + using no-cors fetch mode on client handles it.
// This doOptions stub satisfies pre-flight for modern browsers.
function doOptions(e) {
  return ContentService
    .createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT);
}

// ═══ ONE-TIME SETUP ══════════════════════════════════════════════════════════

// Run fixHeaders() manually once to fix existing response sheet
function fixHeaders(){
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if(!sheet) sheet = ss.insertSheet(SHEET_NAME);
  ensureHeaders(sheet);
  SpreadsheetApp.getUi().alert('Headers fixed! ' + HEADERS.length + ' columns set.');
}

// Run setupSettings() manually once to create/update the Settings sheet
function setupSettings(){
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SETTINGS_SHEET);
  if (!sh) {
    getSettingsSheet(); // creates fresh with all rows
    SpreadsheetApp.getUi().alert('ARP_Settings sheet created with all keys.');
    return;
  }
  // Sheet exists — add any missing keys
  const required = [
    ['sessionCodeEnabled','false'],
    ['sessionCode',''],
    ['sessionCodeExpiry','0'],
    ['activeBatch',''],
    ['activeCentre',''],
    ['activeClient',''],
    ['activeTrainer',''],
    ['activeDiamonds','natural'],
    ['reportPassword','']
  ];
  const data = sh.getDataRange().getValues();
  const existingKeys = data.slice(1).map(r => r[0]);
  let added = 0;
  required.forEach(function(row){
    if(!existingKeys.includes(row[0])){
      sh.appendRow(row);
      added++;
    }
  });
  SpreadsheetApp.getUi().alert('Done! ' + added + ' missing key(s) added to ARP_Settings.');
}
