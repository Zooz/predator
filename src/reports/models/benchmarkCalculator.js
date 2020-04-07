
const FIVE_PREFIX = '5';
const FOUR_PREFIX = '4';
const RPS = 'rps';

module.exports.calculate = (testBenchmark, reportData, configObject) => {
    const benchmarkObject = extractCalculateObject(testBenchmark);
    const reportObject = extractCalculateObject(reportData);
    return calculateObjectScore(benchmarkObject, reportObject, configObject);
};

function calculateObjectScore(benchmarkObject, reportObject, configObject) {
    const allReportKeys = Object.keys(reportObject);
    let score = 0;
    let data = {};
    allReportKeys.forEach(field => {
        const fieldScore = extractFieldScore(benchmarkObject, reportObject, field);
        const percentage = configObject[field].percentage / 100;
        score += (fieldScore * percentage);
        data[field] = {
            benchmark_value: benchmarkObject[field],
            report_value: reportObject[field],
            percentage,
            score: fieldScore * percentage
        };
    });
    return { data, score };
}

function extractCalculateObject(dataObject) {
    return {
        rps: dataObject.rps.mean,
        percentile_ninety: dataObject.latency.p95,
        percentile_fifty: dataObject.latency.median,
        client_errors: extractNumberOfErrorsPrefix(dataObject.codes, FOUR_PREFIX),
        server_errors: calculateServerErrors(dataObject)

    };
}

function calculateServerErrors(dataObject) {
    const totalErrors = Object.values(dataObject.errors).reduce((accumulator, value) => accumulator + value, 0);
    const errorCodeFive = extractNumberOfErrorsPrefix(dataObject.codes, FIVE_PREFIX);
    return totalErrors + errorCodeFive;
}

function extractNumberOfErrorsPrefix(errors, prefix) {
    return Object.entries(errors)
        .filter(([key]) => key.startsWith(prefix))
        .reduce((accumulator, [key, value]) => accumulator + value, 0);
}

function extractFieldScore(benchmarkObject, reportObject, field) {
    // RPS is the only point we want benchmark will be lower then report result
    const isRps = field === RPS;
    const expectedHigherValue = isRps ? reportObject[field] : benchmarkObject[field];
    const expectedLowerValue = isRps ? benchmarkObject[field] : reportObject[field];
    return calaualteFieldScore(expectedHigherValue, expectedLowerValue);
}

function calaualteFieldScore(expectedHigherValue, expectedLowerValue) {
    if (expectedHigherValue >= expectedLowerValue) {
        return 100;
    }
    const percentage = expectedHigherValue / expectedLowerValue;
    return (percentage * 100);
}

// const object =
//     {
//         'rps': {
//             'mean': 9
//         },
//         'errors': {},
//         'codes': {},
//         'latency': {
//             'p95': 100,
//             'median': 150
//         }
//     };
//
// const object2 = {
//     'bucket': 60,
//     'requestsCompleted': 118,
//     'scenariosCreated': 60,
//     'scenariosAvoided': 0,
//     'scenariosCompleted': 59,
//     'pendingRequests': 1,
//     'scenarioCounts': {
//         'Scenario 1': 60
//     },
//     'errors': {},
//     'concurrency': 1,
//     'codes': {
//         '200': 59,
//         '301': 59
//     },
//     'latency': {
//         'median': 206.10000000000002,
//         'max': 591.9,
//         'min': 152.6,
//         'p95': 248.13728813559322,
//         'p99': 410.935593220339
//     },
//     'rps': {
//         'mean': 2.02,
//         'count': 119
//     },
//     'scenarioDuration': {
//         'median': 498.8,
//         'min': 427.5,
//         'max': 836.7,
//         'p95': 548.1779661016949,
//         'p99': 709.8864406779661
//     }
// };
//
// const config =
//     {
//         'percentile_ninety': {
//             'factor': 10,
//             'percentage': 20
//         },
//         'percentile_fifty': {
//             'factor': 10,
//             'percentage': 30
//         },
//         'server_errors': {
//             'factor': 10,
//             'percentage': 20
//         },
//         'client_errors': {
//             'factor': 10,
//             'percentage': 20
//         },
//         'rps': {
//             'factor': 10,
//             'percentage': 10
//         }
//     };
//
// const res = this.calculate(object, object2, config);
// console.log(res);
