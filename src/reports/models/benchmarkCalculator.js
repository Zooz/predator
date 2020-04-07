
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
    return calculateFieldScore(expectedHigherValue, expectedLowerValue);
}

function calculateFieldScore(expectedHigherValue, expectedLowerValue) {
    if (expectedHigherValue >= expectedLowerValue) {
        return 100;
    }
    const percentage = expectedHigherValue / expectedLowerValue;
    return (percentage * 100);
}
