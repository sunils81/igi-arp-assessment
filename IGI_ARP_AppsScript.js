// IGI ASSOCIATE READINESS PROFILE — Google Apps Script v6
// Paste ALL → Save → Deploy → New Version (same URL stays)
// Run fixHeaders() manually once to sync existing sheet headers

const SHEET_NAME = 'ARP_Responses';
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
  'Combined Profile','Insight Title'
];

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
      d.insightTitle||''
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

function doGet(e){
  try{
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    return ContentService
      .createTextOutput(JSON.stringify({status:'ok', responses: sheet?sheet.getLastRow()-1:0}))
      .setMimeType(ContentService.MimeType.JSON);
  }catch(err){
    return ContentService
      .createTextOutput(JSON.stringify({status:'error'}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Run once manually to fix existing sheet
function fixHeaders(){
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if(!sheet) sheet = ss.insertSheet(SHEET_NAME);
  ensureHeaders(sheet);
  SpreadsheetApp.getUi().alert('Headers fixed! ' + HEADERS.length + ' columns set.');
}
