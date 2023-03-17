function myFunction() {
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
  const htmlTexts = inputFiles.map(x => x.getBlob().getDataAsString());
  const idList = htmlTexts.map(htmlText => {
    const splitText = htmlText.split('</div>');
    const targetRecord = splitText.filter(x => /WOS:\d*<\/a>/.test(x));
    return targetRecord.map(record => {
      const wosId = /(?<=WOS:)\d*/.exec(record)[0];
      const tempPmid = /PMID:\D*\d*/.exec(record);
      const pmid = tempPmid ? /\d*$/.exec(tempPmid)[0] : '';
      return [pmid, wosId];
    });
  }); 
  const pmidIdx = 0;
  idList.forEach((id, idx) => {
    const pmidList = id.map(x => x[pmidIdx] !== '' ? x[pmidIdx] : null).filter(x => x);
    const idMap = new Map(id.filter(x => x[pmidIdx] !== ''));
    const uniquePmidList = Array.from(new Set(pmidList));
    const pubmedData = wostoolcommon.getPubmedData(uniquePmidList);
    const outputData = pubmedData.map((pubmed, idx) => {
      const wosId = idx > 0 ? idMap.get(pubmed[pmidIdx]) : 'wosID';
      return [wosId, ...pubmed];
    });
    const targetSheet = idx > 0 ? outputFile.insertSheet() : outputFile.getSheets()[idx];
    targetSheet.getRange(1, 1, outputData.length, outputData[0].length).setValues(outputData);
  });
}
