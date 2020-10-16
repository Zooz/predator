'use strict';

module.exports.getExportedReportName = (reportData,fileFormat) => {
    const testName = reportData.test_name;
    const reportId = reportData.report_id;
    const startTime = reportData.start_time.toISOString();
    return testName+"_"+reportId+"_"+startTime+"."+fileFormat;
}

module.exports.getContentType = (fileFormat) => {
    const mapping = {
        "csv" : "text/csv"
    }
    return mapping[fileFormat];
}

module.exports.processCompareReportsInput = (query) =>{
    let reportIds = query.report_ids[0].split(",");
    let testIds = query.test_ids[0].split(",");
    //Validate length of arrays
    if (reportIds.length != testIds.length){
        let error = new Error("Test and Report IDs length mismatch");
        error.statusCode = 400;
        throw error;
    }
    return {"reportIds": reportIds, "testIds": testIds};
}

module.exports.getCompareReportName = (aggregateReportArray,fileFormat) => {
    let fileName = "";
    for (let index in aggregateReportArray){
        if (index == aggregateReportArray.length-1){
            fileName+=aggregateReportArray[index].test_name;
        }else{
            fileName+=aggregateReportArray[index].test_name+"_";
        }
    }
    fileName+="_comparison_";
    for (let index in aggregateReportArray){
        if (index == aggregateReportArray.length-1){
            fileName+=aggregateReportArray[index].report_id;
        }else{
            fileName+=aggregateReportArray[index].report_id+"_";
        }
    }
    fileName+="."+fileFormat;
    return fileName;
}