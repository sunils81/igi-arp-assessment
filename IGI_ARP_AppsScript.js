// IGI ASSOCIATE READINESS PROFILE — Google Apps Script v10
// Features ported from IGI 4Cs Quiz script:
//   • LockService (concurrent submission safety)
//   • PDF saved to named Drive folder (not root)
//   • Training Dashboard sheet (rebuilt on every submit)
//   • Batch Performance sheet (RSP + Readiness breakdown per batch)
//   • 4Cs Heatmap sheet (which knowledge questions had most gaps)
//   • RSP Stage Distribution sheet (PP/TA/PS/EA/TrA per centre/client)
//   • Code Usage Log (every session code attempt logged)
//   • fixHeaders() force-rebuilds all 41 columns (one-time fix)
//   • setupSheets() bootstraps all sheets at once
// v10: Also fixes RSP field mapping (rspStageKey/rspStage → sheet columns)

const SHEET_NAME     = 'ARP_Responses';
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

// Column index map (1-based) — keeps rebuild functions readable
const COL = {};
HEADERS.forEach(function(h, i){ COL[h] = i + 1; });

// ═══ SETTINGS HELPERS ════════════════════════════════════════════════════════

function getSettingsSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SETTINGS_SHEET);
  if (!sh) {
    sh = ss.insertSheet(SETTINGS_SHEET);
    sh.getRange('A1:B1').setValues([['Key','Value']]);
    sh.getRange('A1:B1').setBackground('#0D1B2E').setFontColor('#C9A84C').setFontWeight('bold');
    const defaults = [
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
    defaults.forEach(function(row, i){
      sh.getRange(i+2, 1, 1, 2).setValues([row]);
    });
    sh.setColumnWidth(1, 200);
    sh.setColumnWidth(2, 220);
  }
  return sh;
}

function getSetting(key) {
  const sh = getSettingsSheet();
  const data = sh.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === key) return String(data[i][1]).trim();
  }
  return null;
}

function getSettingBool(key) {
  const val = getSetting(key);
  return val ? val.toLowerCase() === 'true' : false;
}

function setSetting(key, value) {
  const sh = getSettingsSheet();
  const data = sh.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === key) { sh.getRange(i + 1, 2).setValue(value); return; }
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
    hr.setFontFamily('Arial');
    sheet.setFrozenRows(1);
    HEADERS.forEach((_,i) => sheet.setColumnWidth(i+1, i<2?130:i<6?140:i<14?130:160));
  }
}

// ═══ HELPERS ═════════════════════════════════════════════════════════════════

function getOrCreateSheet(ss, name) {
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  return sh;
}

function getOrCreatePdfFolder(ss) {
  const folderName = 'IGI ARP — Profile PDFs';
  const ssFile  = DriveApp.getFileById(ss.getId());
  const parents = ssFile.getParents();
  const parent  = parents.hasNext() ? parents.next() : DriveApp.getRootFolder();
  const found   = parent.getFoldersByName(folderName);
  return found.hasNext() ? found.next() : parent.createFolder(folderName);
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function colorRow(sheet, rowNum, readinessBand) {
  const bg = readinessBand === 'Outstanding' ? '#F9F3E3' :
             readinessBand === 'Proficient'  ? '#E8F5EE' :
             readinessBand === 'Developing'  ? '#EEF4FB' : '#FEF2F2';
  sheet.getRange(rowNum, 1, 1, HEADERS.length).setBackground(bg);
  const fcsCol = COL['4Cs Percentage'];
  const fcsVal = sheet.getRange(rowNum, fcsCol).getValue();
  if (Number(fcsVal) < 56) {
    sheet.getRange(rowNum, fcsCol).setBackground('#FEF2F2').setFontColor('#C94A4A').setFontWeight('bold');
  }
  const bandCell = sheet.getRange(rowNum, COL['Readiness Band']);
  const bandColors = {Outstanding:'#B87A10', Proficient:'#1D9E75', Developing:'#378ADD', Foundation:'#C9613A'};
  if (bandColors[readinessBand]) bandCell.setFontColor(bandColors[readinessBand]).setFontWeight('bold');
}

function logCodeAttempt(ss, code, accepted, reason, mobile) {
  const sheet = getOrCreateSheet(ss, 'Code Usage Log');
  if (sheet.getLastRow() === 0) {
    const h = ['Timestamp','Code Entered','Result','Reason','Mobile'];
    sheet.getRange(1,1,1,h.length).setValues([h])
      .setFontWeight('bold').setBackground('#0D1B2E').setFontColor('#C9A84C');
    sheet.setFrozenRows(1);
    [160,160,100,320,140].forEach((w,i) => sheet.setColumnWidth(i+1, w));
  }
  sheet.appendRow([new Date(), code||'(empty)', accepted?'ACCEPTED':'REJECTED', reason||'', mobile||'']);
  const lr = sheet.getLastRow();
  sheet.getRange(lr, 3).setFontWeight('bold').setFontColor(accepted ? '#1a7a3c' : '#c0392b');
}


// ═══ doPost ══════════════════════════════════════════════════════════════════

function doPost(e){
  const lock = LockService.getDocumentLock();
  try { lock.waitLock(15000); }
  catch(err) { return jsonResponse({status:'error', message:'Server busy. Please try again.'}); }

  try {
    const d  = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);
    if(!sheet) sheet = ss.insertSheet(SHEET_NAME);
    ensureHeaders(sheet);

    // ── Duplicate refId guard ─────────────────────────────────────────────
    // Prevents double-writes when the PDF fallback path fires a second fetch.
    // The refId is unique per assessment (generated once on the client).
    if (d.refId) {
      const lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        const existingRefs = sheet.getRange(2, COL['Ref ID'], lastRow - 1, 1).getValues();
        for (let i = 0; i < existingRefs.length; i++) {
          if (String(existingRefs[i][0]).trim() === String(d.refId).trim()) {
            // Already recorded — if this submission has a PDF, update that cell only
            if (d.pdfBase64) {
              try {
                const folder   = getOrCreatePdfFolder(ss);
                const safeName = String(d.name||'').replace(/[^A-Za-z0-9 _-]/g,'').substring(0,40)||'Associate';
                const blob     = Utilities.newBlob(Utilities.base64Decode(d.pdfBase64), MimeType.PDF,
                                   'IGI_ARP_'+d.refId+'_'+safeName+'.pdf');
                const file     = folder.createFile(blob);
                file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
                const pdfUrl   = file.getUrl();
                const pdfCol   = COL['PDF Link'];
                sheet.getRange(i + 2, pdfCol).setFormula('=HYPERLINK("'+pdfUrl+'","View PDF")')
                  .setFontColor('#1a73e8').setFontWeight('bold');
              } catch(x) { /* PDF update failed silently — row is already saved */ }
            }
            lock.releaseLock();
            return jsonResponse({status:'duplicate', refId: d.refId, message:'Already recorded.'});
          }
        }
      }
    }

    // ── Duplicate mobile guard ────────────────────────────────────────────
    // Belt-and-suspenders: even if the client check is bypassed, reject here.
    if (d.mobile) {
      const lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        const iMob   = HEADERS.indexOf('Mobile');
        const iBatch = HEADERS.indexOf('Batch Code');
        const mobs   = sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getValues();
        const inMob  = String(d.mobile).trim();
        const inBatch= String(d.batchCode||'').trim().toUpperCase();
        for (let i = 0; i < mobs.length; i++) {
          const rowMob   = String(mobs[i][iMob]  ||'').trim();
          const rowBatch = String(mobs[i][iBatch] ||'').trim().toUpperCase();
          if (rowMob === inMob && (!inBatch || rowBatch === inBatch)) {
            lock.releaseLock();
            return jsonResponse({status:'error', message:'This mobile number has already completed the assessment for this batch.'});
          }
        }
      }
    }

    // Session code server-side revalidation
    const codeCheck = verifySessionCode(ss, d.sessionCode || '');
    if (codeCheck.required && !codeCheck.ok) {
      logCodeAttempt(ss, d.sessionCode||'', false, 'Submission rejected: '+codeCheck.reason, d.mobile||'');
      lock.releaseLock();
      return jsonResponse({status:'error', message: codeCheck.reason});
    }

    let c2s={}, rsp={}, tagScores={};
    try{ c2s = JSON.parse(d.c2sScores||'{}'); }catch(x){}
    try{ rsp = JSON.parse(d.rspScores||'{}'); }catch(x){}
    try{ tagScores = JSON.parse(d.fcsTagScores||'{}'); }catch(x){}

    // Save PDF to named Drive folder
    let pdfUrl = '';
    if(d.pdfBase64){
      try {
        const folder  = getOrCreatePdfFolder(ss);
        const safeName = String(d.name||'').replace(/[^A-Za-z0-9 _-]/g,'').substring(0,40)||'Associate';
        const fileName = 'IGI_ARP_'+(d.refId||'')+'_'+safeName+'.pdf';
        const blob     = Utilities.newBlob(Utilities.base64Decode(d.pdfBase64), MimeType.PDF, fileName);
        const file     = folder.createFile(blob);
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        pdfUrl = file.getUrl();
      } catch(x) { pdfUrl = 'Error: '+x.toString(); }
    }

    // RSP field mapping — index.html sends rspStageKey/rspStage/rspLabel
    const rspPrimary        = d.rspStageKey || d.rspPrimary        || '';
    const rspClassification = d.rspStage    || d.rspClassification || '';
    const rspLabel          = d.rspLabel    || '';

    const row = [
      d.timestamp||new Date().toISOString(), d.refId||'',
      d.trainerName||'', d.batchCode||'', d.igiCentre||'', d.clientParam||'',
      d.name||'', d.mobile||'', d.branch||'', d.designation||'',
      d.experience||'', d.country||'', d.diamondType||'', d.timeTaken||'',
      d.c2sPrimary||'', d.c2sClassification||'', d.c2sLabel||'', d.c2sScores||'',
      c2s['1']||0, c2s['2']||0, c2s['3']||0, c2s['4']||0,
      rspPrimary, rspClassification, rspLabel, d.rspScores||'',
      rsp['H']||0, rsp['F']||0, rsp['C']||0, rsp['A']||0,
      d.fcsScore||0, d.fcsPct||0, d.fcsGrade||'', d.fcsTagScores||'',
      d.readinessTotal||0, d.readinessBand||'', d.knowledgePts||0, d.behaviouralPts||0,
      d.comboProfile||'', d.insightTitle||'',
      pdfUrl ? '=HYPERLINK("'+pdfUrl+'","View PDF")' : ''
    ];

    sheet.appendRow(row);
    colorRow(sheet, sheet.getLastRow(), d.readinessBand||'Foundation');

    if (codeCheck.required && codeCheck.ok && d.sessionCode) {
      incrementCodeUsage(ss);
      logCodeAttempt(ss, d.sessionCode, true, 'Submission accepted', d.mobile||'');
    }

    // Rebuild all analytics sheets
    rebuildTrainingDashboard(ss);
    rebuildBatchPerformance(ss);
    rebuildRSPDistribution(ss);
    rebuild4CsHeatmap(ss);

    lock.releaseLock();
    return jsonResponse({status:'ok', refId: d.refId||''});

  } catch(err) {
    lock.releaseLock();
    return jsonResponse({status:'error', message: err.toString()});
  }
}


// ═══ doGet ═══════════════════════════════════════════════════════════════════

function doGet(e){
  const p    = e && e.parameter ? e.parameter : {};
  const action = p.action || '';
  const cbFn   = p.callback || '';
  const ss     = SpreadsheetApp.getActiveSpreadsheet();

  function respond(obj) {
    const jsonStr = JSON.stringify(obj);
    if (cbFn) {
      return ContentService.createTextOutput(cbFn+'('+jsonStr+')')
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    return ContentService.createTextOutput(jsonStr).setMimeType(ContentService.MimeType.JSON);
  }

  try {
    if (action === 'checkMobile') {
      const mobile = (p.mobile||'').trim();
      const batch  = (p.batch ||'').trim().toUpperCase();
      const sheet  = ss.getSheetByName(SHEET_NAME);
      if (!mobile) return respond({attempted: false});
      if (sheet && sheet.getLastRow() > 1) {
        const lastRow = sheet.getLastRow();
        const data    = sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getValues();
        const iMob    = HEADERS.indexOf('Mobile');
        const iBatch  = HEADERS.indexOf('Batch Code');
        for (let i = 0; i < data.length; i++) {
          const rowMob   = String(data[i][iMob]  ||'').trim();
          const rowBatch = String(data[i][iBatch] ||'').trim().toUpperCase();
          // If batch is provided, scope the check to that batch only
          if (rowMob === mobile && (!batch || rowBatch === batch)) {
            return respond({attempted: true});
          }
        }
      }
      return respond({attempted: false});
    }

    if (action === 'settingsPublic') {
      const enabled  = getSettingBool('sessionCodeEnabled');
      const expiryTs = parseInt(getSetting('sessionCodeExpiry')||'0');
      if (enabled && expiryTs > 0 && Date.now() > expiryTs) {
        setSetting('sessionCodeEnabled','false');
        return respond({codeRequired:false, reason:'expired'});
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

    if (action === 'verifyCode') {
      const result = verifySessionCode(ss, p.code||'');
      logCodeAttempt(ss, p.code||'', result.ok, result.reason||'', p.mobile||'');
      return respond(result.ok
        ? {valid:true}
        : {valid:false, reason: result.reason});
    }

    if (action === 'getSettings') {
      return respond({
        status:'ok',
        sessionCodeEnabled: getSettingBool('sessionCodeEnabled'),
        sessionCode: getSetting('sessionCode')||'',
        expiryTs: parseInt(getSetting('sessionCodeExpiry')||'0')
      });
    }

    if (action === 'saveSettings') {
      const code     = (p.code||'').trim().toUpperCase();
      const enabled  = p.enabled === 'true';
      const expiryTs = parseInt(p.expiryTs||'0');
      setSetting('sessionCode',        code);
      setSetting('sessionCodeEnabled', enabled ? 'true' : 'false');
      setSetting('sessionCodeExpiry',  expiryTs > 0 ? String(expiryTs) : '0');
      if (p.batch)          setSetting('activeBatch',    p.batch);
      if (p.centre)         setSetting('activeCentre',   p.centre);
      if (p.client)         setSetting('activeClient',   p.client);
      if (p.trainer)        setSetting('activeTrainer',  p.trainer);
      if (p.diamonds)       setSetting('activeDiamonds', p.diamonds);
      if (p.reportPassword) setSetting('reportPassword', p.reportPassword);
      return respond({status:'ok', sessionCode:code, sessionCodeEnabled:enabled, expiryTs});
    }

    if (action === 'getBatchReport') {
      const batchParam = (p.batch||'').trim().toUpperCase();
      const passParam  = (p.pass ||'').trim();
      const storedPass = (getSetting('reportPassword')||'').trim();
      if (!storedPass || passParam !== storedPass)
        return respond({status:'error', reason:'wrong_password'});
      const sheet = ss.getSheetByName(SHEET_NAME);
      if (!sheet) return respond({status:'error', reason:'no_data'});
      const data    = sheet.getDataRange().getValues();
      const headers = data[0];
      const idx = {
        batch:    headers.indexOf('Batch Code'),
        name:     headers.indexOf('Name'),
        desig:    headers.indexOf('Designation'),
        c2s:      headers.indexOf('C2S Classification'),
        rspKey:   headers.indexOf('RSP Primary'),
        rspLabel: headers.indexOf('RSP Label'),
        ri:       headers.indexOf('Readiness Total'),
        band:     headers.indexOf('Readiness Band'),
        fcs:      headers.indexOf('4Cs Percentage'),
        client:   headers.indexOf('Client')
      };
      const rows = data.slice(1)
        .filter(r => (r[idx.batch]||'').toString().trim().toUpperCase() === batchParam)
        .map(r => ({
          name:r[idx.name]||'', desig:r[idx.desig]||'',
          c2s:r[idx.c2s]||'', rspKey:r[idx.rspKey]||'', rspLabel:r[idx.rspLabel]||'',
          ri:r[idx.ri]||0, band:r[idx.band]||'', fcs:r[idx.fcs]||0, client:r[idx.client]||''
        }));
      if (!rows.length) return respond({status:'error', reason:'no_data'});
      return respond({status:'ok', rows, client:rows[0].client||batchParam});
    }

    const sheet = ss.getSheetByName(SHEET_NAME);
    return respond({status:'ok', responses: sheet ? sheet.getLastRow()-1 : 0});

  } catch(err) {
    return respond({status:'error', message:err.toString()});
  }
}


// ═══ SESSION CODE ═════════════════════════════════════════════════════════════

function verifySessionCode(ss, code) {
  const enabled  = getSettingBool('sessionCodeEnabled');
  if (!enabled) return {ok:true, required:false, reason:'Code not required.'};

  const stored   = (getSetting('sessionCode')||'').trim().toUpperCase();
  const expiryTs = parseInt(getSetting('sessionCodeExpiry')||'0');

  if (!stored) return {ok:false, required:true, reason:'Session code not configured. Contact your trainer.'};

  const submitted = String(code||'').trim().toUpperCase();
  if (!submitted) return {ok:false, required:true, reason:'Session Code is required.'};
  if (submitted !== stored) return {ok:false, required:true, reason:'Invalid Session Code.'};

  if (expiryTs > 0 && Date.now() > expiryTs) {
    setSetting('sessionCodeEnabled','false');
    return {ok:false, required:true, reason:'This session code has expired.'};
  }

  return {ok:true, required:true, reason:'OK'};
}

function incrementCodeUsage(ss) {
  const sh = ss.getSheetByName(SETTINGS_SHEET);
  if (!sh) return;
  const data = sh.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === 'codeUsageCount') {
      sh.getRange(i+1, 2).setValue((Number(data[i][1])||0) + 1);
      return;
    }
  }
  sh.appendRow(['codeUsageCount', 1]);
}


// ═══ ANALYTICS: TRAINING DASHBOARD ═══════════════════════════════════════════
// Rebuilt on every submission. Shows all associates grouped by Readiness Band.

function rebuildTrainingDashboard(ss) {
  const src  = ss.getSheetByName(SHEET_NAME);
  const dash = getOrCreateSheet(ss, 'Training Dashboard');
  dash.clearContents();
  dash.clearFormats();

  const lastRow = src ? src.getLastRow() : 0;
  if (lastRow < 2) { dash.getRange(1,1).setValue('No responses yet.'); return; }

  const data = src.getRange(2, 1, lastRow-1, HEADERS.length).getValues();
  const h    = HEADERS;

  const iName   = h.indexOf('Name');
  const iDesig  = h.indexOf('Designation');
  const iBatch  = h.indexOf('Batch Code');
  const iCentre = h.indexOf('IGI Centre');
  const iClient = h.indexOf('Client');
  const iC2s    = h.indexOf('C2S Label');
  const iRsp    = h.indexOf('RSP Label');
  const iRI     = h.indexOf('Readiness Total');
  const iBand   = h.indexOf('Readiness Band');
  const iFcsPct = h.indexOf('4Cs Percentage');

  const BANDS = ['Outstanding','Proficient','Developing','Foundation'];
  const bandColors = {Outstanding:'#F9F3E3',Proficient:'#E8F5EE',Developing:'#EEF4FB',Foundation:'#FEF2F2'};
  const bandFg     = {Outstanding:'#B87A10',Proficient:'#1a7a3c',Developing:'#185FA5',Foundation:'#C9613A'};

  // Title
  dash.getRange(1,1,1,9).merge()
    .setValue('IGI Associate Readiness Profile — Training Dashboard')
    .setFontWeight('bold').setFontSize(14)
    .setBackground('#0D1B2E').setFontColor('#C9A84C')
    .setHorizontalAlignment('center').setFontFamily('Arial');

  // Summary stats
  const total = data.length;
  const avgRI = Math.round(data.reduce((s,r)=>s+(Number(r[iRI])||0),0)/total);
  const avgFcs = Math.round(data.reduce((s,r)=>s+(Number(r[iFcsPct])||0),0)/total);
  const risk = data.filter(r=>(Number(r[iFcsPct])||0)<56).length;
  dash.getRange(2,1,1,9).merge()
    .setValue('Total: '+total+' associates   |   Avg Readiness Index: '+avgRI+'/100   |   Avg 4Cs: '+avgFcs+'%   |   Knowledge Risk (<56%): '+risk)
    .setFontSize(11).setBackground('#F4F1EB').setHorizontalAlignment('center').setFontFamily('Arial');

  const colWidths = [160,130,130,110,120,130,160,70,80];
  const colLabels = ['Name','Designation','Batch Code','Centre','Client','C2S Style','RSP Stage','Index','4Cs %'];
  colWidths.forEach((w,i) => dash.setColumnWidth(i+1, w));

  let rowNum = 3;
  BANDS.forEach(function(band) {
    const rows = data.filter(r => r[iBand] === band);
    if (!rows.length) return;

    dash.getRange(rowNum,1,1,9).merge()
      .setValue(band+' — '+rows.length+' associate'+(rows.length!==1?'s':''))
      .setFontWeight('bold').setFontSize(12)
      .setBackground(bandColors[band]).setFontColor(bandFg[band])
      .setFontFamily('Arial');
    rowNum++;

    dash.getRange(rowNum,1,1,9).setValues([colLabels])
      .setFontWeight('bold').setBackground('#1A2F4E').setFontColor('#C9A84C').setFontFamily('Arial');
    rowNum++;

    rows.sort((a,b)=>(Number(b[iRI])||0)-(Number(a[iRI])||0)).forEach(function(r){
      const vals = [r[iName],r[iDesig],r[iBatch],r[iCentre],r[iClient],r[iC2s],r[iRsp],r[iRI],r[iFcsPct]+'%'];
      dash.getRange(rowNum,1,1,9).setValues([vals]).setBackground(bandColors[band]).setFontFamily('Arial');
      const fcs = Number(r[iFcsPct])||0;
      if (fcs < 56) dash.getRange(rowNum,9).setBackground('#FEF2F2').setFontColor('#C94A4A').setFontWeight('bold');
      rowNum++;
    });
    rowNum++;
  });
  dash.setFrozenRows(0);
}


// ═══ ANALYTICS: BATCH PERFORMANCE ════════════════════════════════════════════
// Per-batch summary: headcount, avg RI, avg 4Cs, RSP stage distribution, band spread.

function rebuildBatchPerformance(ss) {
  const src   = ss.getSheetByName(SHEET_NAME);
  const sheet = getOrCreateSheet(ss, 'Batch Performance');
  sheet.clearContents();
  sheet.clearFormats();

  const lastRow = src ? src.getLastRow() : 0;
  if (lastRow < 2) { sheet.getRange(1,1).setValue('No data yet.'); return; }

  const data = src.getRange(2,1,lastRow-1,HEADERS.length).getValues();
  const h    = HEADERS;
  const iBatch  = h.indexOf('Batch Code');
  const iClient = h.indexOf('Client');
  const iCentre = h.indexOf('IGI Centre');
  const iRI     = h.indexOf('Readiness Total');
  const iBand   = h.indexOf('Readiness Band');
  const iFcsPct = h.indexOf('4Cs Percentage');
  const iRspKey = h.indexOf('RSP Primary');

  // Group by batch
  const batchMap = {};
  data.forEach(function(r){
    const batch = r[iBatch]||'Unknown';
    if (!batchMap[batch]) batchMap[batch] = {
      client:r[iClient]||'', centre:r[iCentre]||'', count:0,
      sumRI:0, sumFcs:0, risk:0,
      bands:{Outstanding:0,Proficient:0,Developing:0,Foundation:0},
      rsp:{PP:0,TA:0,PS:0,EA:0,TrA:0}
    };
    const b = batchMap[batch];
    b.count++;
    b.sumRI  += Number(r[iRI])||0;
    b.sumFcs += Number(r[iFcsPct])||0;
    if ((Number(r[iFcsPct])||0) < 56) b.risk++;
    const band = r[iBand]||'Foundation';
    if (b.bands[band] !== undefined) b.bands[band]++;
    const rspKey = r[iRspKey]||'PP';
    if (b.rsp[rspKey] !== undefined) b.rsp[rspKey]++;
  });

  // Title
  sheet.getRange(1,1,1,14).merge()
    .setValue('IGI ARP — Batch Performance Summary')
    .setFontWeight('bold').setFontSize(13)
    .setBackground('#0D1B2E').setFontColor('#C9A84C')
    .setHorizontalAlignment('center').setFontFamily('Arial');

  const hdrs = ['Batch Code','Client','Centre','Count','Avg Index','Avg 4Cs','Risk <56%',
                'Outstanding','Proficient','Developing','Foundation','PP','TA','PS/EA/TrA'];
  sheet.getRange(2,1,1,hdrs.length).setValues([hdrs])
    .setFontWeight('bold').setBackground('#1A2F4E').setFontColor('#C9A84C').setFontFamily('Arial');
  sheet.setFrozenRows(2);
  [150,120,100,60,90,80,80,100,90,95,100,50,50,80].forEach((w,i)=>sheet.setColumnWidth(i+1,w));

  let rowNum = 3;
  Object.keys(batchMap).sort().forEach(function(batch){
    const b = batchMap[batch];
    const avgRI  = Math.round(b.sumRI  / b.count);
    const avgFcs = Math.round(b.sumFcs / b.count);
    const advRsp = b.rsp['PS']+(b.rsp['EA']||0)+(b.rsp['TrA']||0);
    const bg = avgRI >= 70 ? '#E8F5EE' : avgRI >= 55 ? '#EEF4FB' : '#FEF2F2';

    sheet.getRange(rowNum,1,1,14).setValues([[
      batch, b.client, b.centre, b.count, avgRI, avgFcs+'%', b.risk,
      b.bands.Outstanding, b.bands.Proficient, b.bands.Developing, b.bands.Foundation,
      b.rsp.PP, b.rsp.TA, advRsp
    ]]).setBackground(bg).setFontFamily('Arial');

    if (b.risk > 0) sheet.getRange(rowNum,7).setBackground('#FEF2F2').setFontColor('#C94A4A').setFontWeight('bold');
    sheet.getRange(rowNum,5).setFontWeight('bold')
      .setFontColor(avgRI>=70?'#1a7a3c':avgRI>=55?'#185FA5':'#C9613A');
    rowNum++;
  });
}


// ═══ ANALYTICS: RSP STAGE DISTRIBUTION ═══════════════════════════════════════
// Shows PP/TA/PS/EA/TrA breakdown across all batches and per client/centre.

function rebuildRSPDistribution(ss) {
  const src   = ss.getSheetByName(SHEET_NAME);
  const sheet = getOrCreateSheet(ss, 'RSP Distribution');
  sheet.clearContents();
  sheet.clearFormats();

  const lastRow = src ? src.getLastRow() : 0;
  if (lastRow < 2) { sheet.getRange(1,1).setValue('No data yet.'); return; }

  const data    = src.getRange(2,1,lastRow-1,HEADERS.length).getValues();
  const iRspKey = HEADERS.indexOf('RSP Primary');
  const iRspLbl = HEADERS.indexOf('RSP Label');
  const iClient = HEADERS.indexOf('Client');
  const iBatch  = HEADERS.indexOf('Batch Code');
  const iRI     = HEADERS.indexOf('Readiness Total');

  const STAGES = ['PP','TA','PS','EA','TrA'];
  const stageColors = {PP:'#FEF2F2',TA:'#FFF8E7',PS:'#EEF4FB',EA:'#E8F5EE',TrA:'#F9F3E3'};
  const stageFg     = {PP:'#C9613A',TA:'#B87A10',PS:'#185FA5',EA:'#1a7a3c',TrA:'#C9A84C'};
  const stageDesc   = {
    PP: 'Product Pusher — presents before exploring needs',
    TA: 'Transaction Achiever — gets transactions done, surface-level discovery',
    PS: 'Problem Solver — strong discovery, needs conviction in recommendation',
    EA: 'Expert Advisor — high expertise, needs consistent next-step completion',
    TrA:'Trusted Advisor — reference standard, should mentor others'
  };

  // Title
  sheet.getRange(1,1,1,8).merge()
    .setValue('IGI ARP — RSP Stage Distribution')
    .setFontWeight('bold').setFontSize(13)
    .setBackground('#0D1B2E').setFontColor('#C9A84C')
    .setHorizontalAlignment('center').setFontFamily('Arial');

  // Section 1: Overall distribution
  sheet.getRange(2,1).setValue('Overall RSP Distribution — All Associates')
    .setFontWeight('bold').setFontSize(12).setBackground('#F4F1EB');
  sheet.getRange(2,1,1,8).merge().setBackground('#F4F1EB');

  const total = data.length;
  sheet.getRange(3,1,1,5).setValues([STAGES])
    .setFontWeight('bold').setBackground('#1A2F4E').setFontColor('#C9A84C').setFontFamily('Arial');
  const overallCounts = {};
  STAGES.forEach(s => overallCounts[s] = 0);
  data.forEach(r => { const k = r[iRspKey]||'PP'; if(overallCounts[k]!==undefined) overallCounts[k]++; });
  const overallRow = STAGES.map(s => overallCounts[s]+' ('+Math.round((overallCounts[s]/total)*100)+'%)');
  sheet.getRange(4,1,1,5).setValues([overallRow]).setFontFamily('Arial');
  STAGES.forEach((s,i) => sheet.getRange(4,i+1).setBackground(stageColors[s]).setFontColor(stageFg[s]).setFontWeight('bold'));

  // Stage descriptions
  let rowNum = 5;
  STAGES.forEach(function(s){
    sheet.getRange(rowNum,1,1,8).merge()
      .setValue(s+': '+stageDesc[s])
      .setBackground(stageColors[s]).setFontColor(stageFg[s]).setFontStyle('italic').setFontFamily('Arial');
    rowNum++;
  });

  // Section 2: Per client breakdown
  rowNum += 1;
  sheet.getRange(rowNum,1,1,8).merge()
    .setValue('RSP Distribution by Client')
    .setFontWeight('bold').setFontSize(12).setBackground('#F4F1EB');
  rowNum++;

  sheet.getRange(rowNum,1,1,7).setValues([['Client','Count','PP','TA','PS','EA','TrA']])
    .setFontWeight('bold').setBackground('#1A2F4E').setFontColor('#C9A84C').setFontFamily('Arial');
  rowNum++;

  const clientMap = {};
  data.forEach(function(r){
    const client = r[iClient]||'Unknown';
    if (!clientMap[client]) clientMap[client] = {count:0,PP:0,TA:0,PS:0,EA:0,TrA:0};
    clientMap[client].count++;
    const k = r[iRspKey]||'PP';
    if (clientMap[client][k] !== undefined) clientMap[client][k]++;
  });

  Object.keys(clientMap).sort().forEach(function(client){
    const c = clientMap[client];
    sheet.getRange(rowNum,1,1,7).setValues([[client,c.count,c.PP,c.TA,c.PS,c.EA,c.TrA]])
      .setBackground('#F9F3E3').setFontFamily('Arial');
    rowNum++;
  });

  [150,100,60,60,60,60,60,200].forEach((w,i)=>sheet.setColumnWidth(i+1,w));
  sheet.setFrozenRows(3);
}


// ═══ ANALYTICS: 4Cs HEATMAP ══════════════════════════════════════════════════
// Shows which 4Cs tag categories had the highest gap rates across all associates.
// Reads the fcsTagScores JSON column and aggregates correct/total per tag.

function rebuild4CsHeatmap(ss) {
  const src   = ss.getSheetByName(SHEET_NAME);
  const sheet = getOrCreateSheet(ss, '4Cs Knowledge Heatmap');
  sheet.clearContents();
  sheet.clearFormats();

  const lastRow = src ? src.getLastRow() : 0;
  if (lastRow < 2) { sheet.getRange(1,1).setValue('No data yet.'); return; }

  const data       = src.getRange(2,1,lastRow-1,HEADERS.length).getValues();
  const iTagScores = HEADERS.indexOf('4Cs Tag Scores (JSON)');
  const iBatch     = HEADERS.indexOf('Batch Code');
  const iName      = HEADERS.indexOf('Name');
  const iFcsPct    = HEADERS.indexOf('4Cs Percentage');

  // Aggregate tag scores
  const tagAgg = {}; // { cut:{correct,total,responses}, color:{...}, ... }
  const tagLabels = {cut:'Cut',color:'Color',clarity:'Clarity',carat:'Carat',general:'General Knowledge'};

  data.forEach(function(r){
    const json = r[iTagScores];
    if (!json) return;
    let tags = {};
    try { tags = JSON.parse(json); } catch(x){ return; }
    Object.keys(tags).forEach(function(tag){
      const t = tags[tag];
      if (!t || typeof t.correct === 'undefined') return;
      if (!tagAgg[tag]) tagAgg[tag] = {correct:0,total:0,responses:0};
      tagAgg[tag].correct   += Number(t.correct)||0;
      tagAgg[tag].total     += Number(t.total)  ||0;
      tagAgg[tag].responses += 1;
    });
  });

  // Title
  sheet.getRange(1,1,1,6).merge()
    .setValue('IGI ARP — 4Cs Knowledge Gap Heatmap')
    .setFontWeight('bold').setFontSize(13)
    .setBackground('#0D1B2E').setFontColor('#C9A84C')
    .setHorizontalAlignment('center').setFontFamily('Arial');

  sheet.getRange(2,1,1,6).merge()
    .setValue('Avg accuracy per knowledge category across all assessed associates. Red = focused training required.')
    .setFontStyle('italic').setFontColor('#666').setHorizontalAlignment('center').setBackground('#F4F1EB');

  const hdrs = ['Category','Associates','Total Correct','Total Possible','Avg Accuracy','Status'];
  sheet.getRange(3,1,1,6).setValues([hdrs])
    .setFontWeight('bold').setBackground('#1A2F4E').setFontColor('#C9A84C').setFontFamily('Arial');
  sheet.setFrozenRows(3);
  [160,110,120,120,120,300].forEach((w,i)=>sheet.setColumnWidth(i+1,w));

  let rowNum = 4;
  const sortedTags = Object.keys(tagLabels); // keep natural order: cut, color, clarity, carat, general
  sortedTags.forEach(function(tag){
    const a   = tagAgg[tag] || {correct:0,total:0,responses:0};
    const pct = a.total > 0 ? Math.round((a.correct/a.total)*100) : 0;
    let status, bg, fc;
    if (a.responses === 0) {
      status='— No Data'; bg='#F5F5F5'; fc='#666';
    } else if (pct < 56) {
      status='🔴 RED FLAG — Immediate training required'; bg='#FEF2F2'; fc='#C94A4A';
    } else if (pct < 70) {
      status='🟡 Gap — Refresher recommended';            bg='#FFF8E7'; fc='#B87A10';
    } else if (pct < 85) {
      status='🔵 Developing — Good foundation';           bg='#EEF4FB'; fc='#185FA5';
    } else {
      status='🟢 Strong — Maintain with refreshers';      bg='#E8F5EE'; fc='#1a7a3c';
    }

    sheet.getRange(rowNum,1,1,6).setValues([[
      tagLabels[tag]||tag, a.responses, a.correct, a.total, pct+'%', status
    ]]).setBackground(bg).setFontFamily('Arial');
    sheet.getRange(rowNum,1).setFontWeight('bold');
    sheet.getRange(rowNum,5).setFontWeight('bold').setFontColor(fc);
    sheet.getRange(rowNum,6).setFontColor(fc).setFontWeight('bold');
    rowNum++;
  });

  // Per-batch 4Cs breakdown
  rowNum += 1;
  sheet.getRange(rowNum,1,1,6).merge()
    .setValue('4Cs Accuracy by Batch')
    .setFontWeight('bold').setFontSize(12).setBackground('#F4F1EB');
  rowNum++;

  sheet.getRange(rowNum,1,1,5).setValues([['Batch Code','Count','Avg 4Cs %','Risk (<56%)','Status']])
    .setFontWeight('bold').setBackground('#1A2F4E').setFontColor('#C9A84C').setFontFamily('Arial');
  rowNum++;

  const batchFcsMap = {};
  data.forEach(function(r){
    const batch = r[iBatch]||'Unknown';
    if (!batchFcsMap[batch]) batchFcsMap[batch] = {sum:0,count:0,risk:0};
    const pct = Number(r[iFcsPct])||0;
    batchFcsMap[batch].sum   += pct;
    batchFcsMap[batch].count += 1;
    if (pct < 56) batchFcsMap[batch].risk++;
  });

  Object.keys(batchFcsMap).sort().forEach(function(batch){
    const b   = batchFcsMap[batch];
    const avg = Math.round(b.sum/b.count);
    const bg  = avg >= 70 ? '#E8F5EE' : avg >= 56 ? '#FFF8E7' : '#FEF2F2';
    const status = avg >= 70 ? 'Strong' : avg >= 56 ? 'Developing' : 'Training required';
    sheet.getRange(rowNum,1,1,5).setValues([[batch,b.count,avg+'%',b.risk,status]])
      .setBackground(bg).setFontFamily('Arial');
    if (b.risk > 0) sheet.getRange(rowNum,4).setFontWeight('bold').setFontColor('#C94A4A');
    rowNum++;
  });

  // Legend
  rowNum++;
  sheet.getRange(rowNum,1,1,6).merge()
    .setValue('Legend: 🔴 RED FLAG < 56%   🟡 Gap 56–69%   🔵 Developing 70–84%   🟢 Strong ≥ 85%')
    .setFontStyle('italic').setFontColor('#444').setBackground('#F4F1EB').setHorizontalAlignment('center');
}


// ═══ ONE-TIME SETUP ══════════════════════════════════════════════════════════

// fixHeaders — MUST be run once after deploying to rebuild the 41-column header row.
// Also safe to run any time headers drift.
function fixHeaders(){
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if(!sheet) sheet = ss.insertSheet(SHEET_NAME);
  // Force a mismatch so ensureHeaders always rewrites
  const clearCols = Math.max(sheet.getLastColumn(), HEADERS.length);
  sheet.getRange(1,1,1,clearCols).clearContent();
  ensureHeaders(sheet);
  SpreadsheetApp.getUi().alert('Headers fixed! '+HEADERS.length+' columns set in '+SHEET_NAME+'.');
}

// setupSheets — bootstraps ALL sheets and Settings keys at once.
// Run once after deploying; safe to run multiple times.
function setupSheets(){
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Responses sheet
  const responses = getOrCreateSheet(ss, SHEET_NAME);
  const clearCols = Math.max(responses.getLastColumn(), HEADERS.length);
  if (responses.getLastRow() === 0 || responses.getRange(1,1).getValue() === '') {
    responses.getRange(1,1,1,clearCols).clearContent();
    ensureHeaders(responses);
  }

  // Settings sheet + all required keys
  getSettingsSheet();
  const requiredKeys = [
    ['sessionCodeEnabled','false'],
    ['sessionCode',''],
    ['sessionCodeExpiry','0'],
    ['activeBatch',''],
    ['activeCentre',''],
    ['activeClient',''],
    ['activeTrainer',''],
    ['activeDiamonds','natural'],
    ['reportPassword',''],
    ['codeUsageCount','0']
  ];
  const sh = ss.getSheetByName(SETTINGS_SHEET);
  const existing = sh.getDataRange().getValues().slice(1).map(r=>r[0]);
  let added = 0;
  requiredKeys.forEach(function(row){
    if (!existing.includes(row[0])){ sh.appendRow(row); added++; }
  });

  // Code Usage Log
  const logSheet = getOrCreateSheet(ss, 'Code Usage Log');
  if (logSheet.getLastRow() === 0) {
    const lh = ['Timestamp','Code Entered','Result','Reason','Mobile'];
    logSheet.getRange(1,1,1,lh.length).setValues([lh])
      .setFontWeight('bold').setBackground('#0D1B2E').setFontColor('#C9A84C');
    logSheet.setFrozenRows(1);
    [160,160,100,320,140].forEach((w,i)=>logSheet.setColumnWidth(i+1,w));
  }

  // Stub analytics sheets so they exist immediately
  ['Training Dashboard','Batch Performance','RSP Distribution','4Cs Knowledge Heatmap'].forEach(function(name){
    const s = getOrCreateSheet(ss, name);
    if (s.getLastRow() === 0) s.getRange(1,1).setValue('No responses yet — will populate automatically.');
  });

  SpreadsheetApp.getUi().alert(
    'Setup complete!\n\n' +
    '• ARP_Responses: '+HEADERS.length+' columns ready\n' +
    '• ARP_Settings: '+added+' key(s) added\n' +
    '• Analytics sheets created\n' +
    '• Code Usage Log ready\n\n' +
    'Next: set reportPassword in ARP_Settings before running a batch report.'
  );
}

