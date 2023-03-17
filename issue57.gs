function issue57() {
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
  const depIdx = 2;
  inputFiles.forEach((file, idx) => {
    console.log(file.getName());
    const targetYM = /\d{4}_\d{2}/.exec(file.getName());
    if (!targetYM){
      return;
    }
    const ym = targetYM[0].split('_').join('');
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
    const pubmedData = wostoolcommon.getPubmedData(uniquePmidList);
    const idMap = new Map(idList);
    const outputData = pubmedData.map((pubmed, idx) => {
      const wosId = idx > 0 ? idMap.get(pubmed[pmidIdx]) : 'wosID';
      // Compare DEP and file years.
      const check = idx > 0 ? new RegExp(`${ym}`).test(pubmed[depIdx]) : 'check';
      return [wosId, pubmed[pmidIdx], pubmed.slice(depIdx, pubmed.length + 1), check];
    });
    const targetSheet = idx > 0 ? outputFile.insertSheet() : outputFile.getSheets()[idx];
    targetSheet.setName(file.getName().replace('.json', ''));
    targetSheet.getRange(1, 1, outputData.length, outputData[0].length).setValues(outputData);
  });
}
