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
    sh.setColumnWidth(1, 200);
    sh.setColumnWidth(2, 200);
  }
  return sh;
}

function getSetting(key) {
  const sh = getSettingsSheet();
  const data = sh.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === key) return data[i][1];
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

  try {
    // ── Public: is a session code required right now? ────────────────────────
    if (action === 'settingsPublic') {
      const enabled = getSetting('sessionCodeEnabled') === 'true';
      return json({ codeRequired: enabled });
    }

    // ── Public: validate a session code ─────────────────────────────────────
    if (action === 'verifyCode') {
      const enabled = getSetting('sessionCodeEnabled') === 'true';
      if (!enabled) return json({ valid: true, reason: 'code_not_required' });
      const stored = (getSetting('sessionCode') || '').toString().trim().toUpperCase();
      const submitted = (p.code || '').trim().toUpperCase();
      if (!stored) return json({ valid: false, reason: 'no_code_set' });
      if (submitted === stored) return json({ valid: true });
      return json({ valid: false, reason: 'wrong_code' });
    }

    // ── Instructor: get current settings (for the panel) ────────────────────
    if (action === 'getSettings') {
      return json({
        status: 'ok',
        sessionCodeEnabled: getSetting('sessionCodeEnabled') === 'true',
        sessionCode: getSetting('sessionCode') || ''
      });
    }

    // ── Instructor: save settings ────────────────────────────────────────────
    if (action === 'saveSettings') {
      const code = (p.code || '').trim().toUpperCase();
      const enabled = p.enabled === 'true';
      setSetting('sessionCode', code);
      setSetting('sessionCodeEnabled', enabled ? 'true' : 'false');
      return json({ status: 'ok', sessionCode: code, sessionCodeEnabled: enabled });
    }

    // ── Default: response count ──────────────────────────────────────────────
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    return json({ status: 'ok', responses: sheet ? sheet.getLastRow() - 1 : 0 });

  } catch(err) {
    return json({ status: 'error', message: err.toString() });
  }
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
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

// Run setupSettings() manually once to create the Settings sheet
function setupSettings(){
  getSettingsSheet(); // creates it if it doesn't exist
  SpreadsheetApp.getUi().alert('ARP_Settings sheet ready. sessionCodeEnabled=false, code is blank.');
}
