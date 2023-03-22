function test(){
  const test = wostoolcommon.getPubmedData('36415024, 36546715, 36484305, 36708079, 36213991, 36328588, 35095078, 34806607, 36575000, 35908952');
  const test1 = 0;
}
function issue57(){
  const inputFiles = driveCommon.getFilesArrayByFolderId(ScriptProperties.getProperty('inputFolderId'));  
  if (!inputFiles){
    return;
  }
  const outputFolder = driveCommon.getFolder(ScriptProperties.getProperty('outputFolderId'));
  if (!outputFolder){
    return;
  }
  const outputFile = SpreadsheetApp.create(driveCommon.todayYyyymmdd());
  DriveApp.getFileById(outputFile.getId()).moveTo(outputFolder);
  const pmidIdx = 0;
  const depIdx = 1;
  const dpIdx = 2;
  const monthIdx = 1;
  const shortMonths = wostoolcommon.getShortMonthName();
  inputFiles.forEach((file, idx) => {
    console.log(file.getName());
    const targetYM = /\d{4}_\d{2}/.exec(file.getName());
    if (!targetYM){
      return;
    }
    const ym = targetYM[0].split('_').join('');
    const monthShortName = shortMonths[Number(targetYM[0].split('_')[monthIdx]) - 1];
    const htmlText = file.getBlob().getDataAsString();
    const splitText = htmlText.split('</div>');
    const targetRecord = splitText.filter(x => /WOS:\d*<\/a>/.test(x));
    const idList = targetRecord.map(record => {
      const wosId = /(?<=WOS:)\d*/.exec(record)[0];
      const tempPmid = /PMID:\D*\d*/.exec(record);
      const pmid = tempPmid ? /\d*$/.exec(tempPmid)[0] : '';
      return [pmid, wosId];
    });
    const pmidList = idList.map(x => x[pmidIdx] !== '' ? x[pmidIdx] : null).filter(x => x);
    const uniquePmidList = Array.from(new Set(pmidList));
    if (uniquePmidList.length === 0){
      return;
    }
    const getPubmedFlag = new Map(
      [
        ['noPmidCheck', true],
        ['noOutputFile', true],
      ],
    );
    const pubmedData = wostoolcommon.getPubmedData(uniquePmidList, getPubmedFlag);
    Utilities.sleep(1000);
    const dpYmd = wostoolcommon.splitDp(pubmedData, dpIdx);
    const idMap = new Map(idList);
    const outputData = pubmedData.map((pubmed, idx) => {
      const wosId = idx > 0 ? idMap.get(pubmed[pmidIdx]) : 'wosID';
      // Compare DEP and file years. If DEP is blank, compare with DP.
      const check = idx > 0 
        ? pubmed[depIdx] 
          ? new RegExp(`${ym}`).test(pubmed[depIdx]) 
          : new RegExp(`${monthShortName}`).test(dpYmd[idx].get('month'))
        : 'check';
      return [wosId, ...pubmed, check];
    });
    const targetSheet = idx > 0 ? outputFile.insertSheet() : outputFile.getSheets()[idx];
    targetSheet.setName(file.getName().replace('.json', ''));
    targetSheet.getRange(1, 1, outputData.length, outputData[0].length).setValues(outputData);
  });
}
function issue57Summary(){
  const outputFolder = driveCommon.getFolder(ScriptProperties.getProperty('outputFolderId'));
  const latestFileId = driveCommon.getLastUpdated(outputFolder, false);
  const targetSs = SpreadsheetApp.openById(latestFileId);
  const summarySheetName = 'summary';
  const summarySheet = targetSs.getSheetByName(summarySheetName) ? targetSs.getSheetByName(summarySheetName): targetSs.insertSheet();
  summarySheet.clearContents();
  summarySheet.setName(summarySheetName);
  targetSs.moveActiveSheet(1);
  const pmidIdx = 1;
  const checkIdx = 4;
  const checkSheetList = targetSs.getSheets().map(sheet => {
    if (sheet.getName() === summarySheetName){
      return;
    }
    const values = sheet.getDataRange().getValues().filter(x => !x[checkIdx]).map(x => [sheet.getName(), ...x, `https://pubmed.ncbi.nlm.nih.gov/${x[pmidIdx]}/`]);
    return values.length > 0 ? values : null;
  }).filter(x => x).flat();
  const outputHeader = ['fileName', ...targetSs.getSheets()[1].getRange(1, 1, 1, targetSs.getSheets()[1].getLastColumn()).getValues()[0], 'URL'];
  const outputData = [outputHeader, ...checkSheetList];
  summarySheet.getRange(1, 1, outputData.length, outputData[0].length).setValues(outputData);
}
