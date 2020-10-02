function generateCSVReport(jsonReport){
    let outputCSV = "";
    //Header Row
    let first_entry = true;
    for (let index in jsonReport["headers"]){
        if (first_entry){
            outputCSV+=jsonReport["headers"][index];
            first_entry = false;
        }else{
            outputCSV+=","+jsonReport["headers"][index];
        }
    }
    //Data Rows
    for (let index in jsonReport["data"]){
        first_entry = true;
        outputCSV+='\n';
        for (let key in jsonReport["data"][index]){
            if (first_entry){
                if (jsonReport["data"][index][key] === undefined){
                    jsonReport["data"][index][key] = 0;
                }
                outputCSV+=jsonReport["data"][index][key];
                first_entry = false;
            }else{
                if (jsonReport["data"][index][key] === undefined){
                    jsonReport["data"][index][key] = 0;
                }
                outputCSV+=","+jsonReport["data"][index][key];
            }
            
        }
    }
    return outputCSV;
}

function generateJSONReport(report){
    let dataExtracted = {"headers":[
        "timestamp",
        "timemillis",
        "median",
        "p95",
        "p99",
        "rps",
    ],"data":{}}; //Fixed headers
    
    let startTime = new Date(report["start_time"]);
    let data = report["intermediates"];

    //Dynamic status code headers
    let statusHeaders= new Set();

    for (let index in data){
        let time_diff = new Date(data[index]["timestamp"])-startTime;
        let newEntry={
            "timestamp":data[index]["timestamp"],
            "timemillis": time_diff - (time_diff % 30000),
            "median": data[index]["latency"]["median"],
            "p95": data[index]["latency"]["p95"],
            "p99": data[index]["latency"]["p99"],
            "rps": data[index]["rps"]["mean"],
        }
        for (let code in data[index]["codes"]){
            let header = "status_"+code.toString();
            if (statusHeaders.has(header) === false){
                statusHeaders.add(header);
            }
            newEntry[header] = data[index]["codes"][code];
        }
        dataExtracted["data"][newEntry["timemillis"]] = newEntry;
    }
    statusHeaders.forEach((entry)=>{
        dataExtracted["headers"].push(entry);
    })
    return dataExtracted;
}

module.exports.exportReport = async(aggregateReport, fileFormat) => {
    switch (fileFormat){
        case 'csv':{
            let jsonReport = generateJSONReport(aggregateReport);
            return generateCSVReport(jsonReport);
        }
        default:{
            const error = new Error('Unsupported file format');
            error.statusCode = 406;
            throw error;
        }
    }
};

function nextChar(c) {
    return String.fromCharCode(((c.charCodeAt(0) + 1 - 65) % 25) + 65);
}

function generateJSONCompareReport(aggregateReports){
    let data ={"headers":["timestamp","timemillis"],"data":{}};
    let character = 'A';
    for (let index in aggregateReports){
        let result = generateJSONReport(aggregateReports[index]);
        //Update headers set
        for (let headerIndex in result["headers"]){
            if (result["headers"][headerIndex] != "timestamp" && result["headers"][headerIndex] != "timemillis" ){
                data["headers"].push(character+"_"+result["headers"][headerIndex]);
            }
        }
        for (let entry in result["data"]){
            if (data["data"][entry] === undefined){
                //new timestamp
                data["data"][entry] = {"timestamp":result["data"][entry]["timestamp"], "timemillis":entry };
            }
            delete result["data"][entry]["timestamp"];
            delete result["data"][entry]["timemillis"];
            
            for (let key in result["data"][entry]){
                data["data"][entry][character+"_"+key] = result["data"][entry][key];
            }
        }
        character = nextChar(character);
    }
    return data;
}

module.exports.exportCompareReport = async(aggregateReports,fileFormat) => {
    switch (fileFormat){
        case 'csv':{
            let jsonCompareReport = generateJSONCompareReport(aggregateReports);
            return generateCSVReport(jsonCompareReport);
        }
        default:{
            const error = new Error('Unsupported file format');
            error.statusCode = 406;
            throw error;
        }
    }
};
