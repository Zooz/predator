import dateFormat from "dateformat";
import {createSelector} from 'reselect'

export const reports = (state) => state.ReportsReducer.get('reports');
export const aggregateReport = (state) => state.ReportsReducer.get('aggregate_reports');
export const errorOnGetReports = (state) => state.ReportsReducer.get('error_get_reports');
export const report = (state) => state.ReportsReducer.get('report');
export const errorOnGetReport = (state) => state.ReportsReducer.get('error_get_report');
export const processingGetReports = (state) => state.ReportsReducer.get('processing_get_reports');
export const createBenchmarkSuccess = (state) => state.ReportsReducer.get('create_benchmark_success');
export const editNotesSuccess = (state) => state.ReportsReducer.get('edit_notes_success');
export const deleteReportSuccess = (state) => state.ReportsReducer.get('delete_report_success');
export const deleteReportFailure = (state) => state.ReportsReducer.get('delete_report_failure');
export const createBenchmarkFailure = (state) => state.ReportsReducer.get('create_benchmark_failure');
export const editReportFailure = (state) => state.ReportsReducer.get('edit_report_failure');
export const selectedReports = (state) => state.ReportsReducer.get('selected_reports');
export const benchmark = (state) => state.ReportsReducer.get('benchmark');

export const benchmarkWithKeys = createSelector(benchmark, (benchmark) => {
    if (benchmark) {
        return {
            rps: {
                benchmark_mean: benchmark.rps.mean
            },
            latency: {
                benchmark_p99: benchmark.latency.p99,
                benchmark_p95: benchmark.latency.p95,
                benchmark_median: benchmark.latency.median,
            },
            latencyKeys: ['benchmark_median', 'benchmark_p95', 'benchmark_p99'],
            rpsKeys: ['benchmark_mean'],
            errorsBarKeys: ['benchmark_count'],
            codes: benchmark.codes,
            errors: benchmark.errors,
        }
    }

})

export const selectedReportsAsArray = createSelector(selectedReports, (selectedReports) => {
    const selectedReportsAsList = Object.entries(selectedReports)
        .flatMap(selectedReport => {
            const testId = selectedReport[0];
            const selectedList = Object.entries(selectedReport[1])
                .filter((isSelected) => isSelected[1])
                .map((pairs) => pairs[0]);
            return selectedList.map((reportId) => {
                return {
                    testId,
                    reportId
                }
            })
        });
    return selectedReportsAsList;
});


export const isAtLeastOneReportSelected = createSelector(selectedReports, (selectedReports) => {
    //find report with value true
    const result = Object.values(selectedReports).find((value) => (Object.values(value).find((value) => value)));
    return !!result;
});

export const getAggregateReport = createSelector(aggregateReport, benchmarkWithKeys, (reports, benchmarkWithKeys) => {
    return buildAggregateReportData(reports, false, false, benchmarkWithKeys)[0] || {};
});

export const getAggregateReportsForCompare = createSelector(aggregateReport, (reports) => {
    return buildAggregateReportData(reports, true, true);
});


function buildAggregateReportData(reports, withPrefix, startFromZeroTime, lastBenchmark = {}) {
    let prefix = withPrefix ? 'A_' : '';

    return reports.map((report) => {
        const latencyGraph = [],
            errorsCodeGraph = [],
            errorCodes = {},
            errorsGraph = [],
            errors = {},
            rps = [],
            errorsBar = [],
            scenarios = [],
            benchMark = {};
        let errorsCodeGraphKeysAsObjectAcc = {};

        const offset = startFromZeroTime ? new Date(report.start_time).getTime() : 0;

        const startTime = new Date(report.start_time).getTime() - offset;
        //intermediates
        report.intermediates.forEach((bucket, index) => {
            const latency = bucket.latency;
            const time = new Date(startTime + (bucket.bucket * 1000));
            const timeMills = time.getTime();
            latencyGraph.push({
                name: `${dateFormat(time, 'h:MM:ss')}`,
                [`${prefix}median`]: latency.median,
                [`${prefix}p95`]: latency.p95,
                [`${prefix}p99`]: latency.p99,
                ...lastBenchmark.latency,
                timeMills
            });
            rps.push({
                name: `${dateFormat(time, 'h:MM:ss')}`,
                timeMills,
                [`${prefix}mean`]: bucket.rps.mean, ...lastBenchmark.rps
            });


            const errorsData = buildErrorDataObject(bucket, prefix);
            errorsCodeGraphKeysAsObjectAcc = Object.assign(errorsCodeGraphKeysAsObjectAcc, errorsData);
            errorsCodeGraph.push({
                name: `${dateFormat(time, 'h:MM:ss')}`,
                timeMills, ...errorsData
            });

            const bucketErrorCodeData = lastBenchmark.codes ? {...bucket.codes, ...lastBenchmark.codes} : bucket;


            Object.keys(bucketErrorCodeData).forEach((code) => {
                errorCodes[`${prefix}${code}`] = true;
            });
            Object.keys(bucketErrorCodeData).forEach((error) => {
                errorCodes[`${prefix}${error}`] = true;
            })


        });

        // aggregate data
        buildErrorBars(errorsBar, report.aggregate, lastBenchmark, prefix);


        Object.keys(report.aggregate.scenarioCounts).forEach((key) => {
            scenarios.push({name: `${prefix}${key}`, value: report.aggregate.scenarioCounts[key]})
        });

        if (report.aggregate) {
            benchMark.rps = report.aggregate.rps;
            benchMark.latency = report.aggregate.latency;
            benchMark.errors = report.aggregate.errors;
            benchMark.codes = report.aggregate.codes;
        }
        const alias = prefix.substring(0, 1);

        const latencyGraphKeys = [`${prefix}median`, `${prefix}p95`, `${prefix}p99`];
        const rpsKeys = [`${prefix}mean`];
        const errorsBarKeys = [`${prefix}count`];

        const errorsCodeGraphKeys = Object.keys(errorsCodeGraphKeysAsObjectAcc)

        if (withPrefix) {
            prefix = String.fromCharCode(prefix.charCodeAt(0) + 1) + '_';
        }
        if (Object.keys(lastBenchmark).length > 0) {
            latencyGraphKeys.push(...lastBenchmark.latencyKeys);
            rpsKeys.push(...lastBenchmark.rpsKeys);
            errorsBarKeys.push('benchmark_count');
        }


        return {
            alias,
            latencyGraph,
            latencyGraphKeys,
            errorsCodeGraph,
            errorsCodeGraphKeys,
            errorCodes,
            errorsGraph,
            errors,
            rps,
            rpsKeys,
            errorsBar,
            errorsBarKeys,
            scenarios,
            benchMark,
            startTime: report.start_time,
            testName: report.test_name,
            duration: report.duration,
            notes: report.notes,
            isBenchmarkExist: Object.keys(lastBenchmark).length > 0
        }
    })
}


function buildErrorDataObject(bucket, prefix) {
    const errorsData = Object.entries({...bucket.codes, ...bucket.errors}).reduce((acc, cur) => {
        acc[`${prefix}${cur[0]}`] = cur[1];
        return acc;
    }, {});
    return errorsData;
}

function buildErrorBars(errorsBar, data, benchmark, prefix) {
    const allBenchmarkStatuses = Object.keys(benchmark).length > 0 ? {...benchmark.codes, ...benchmark.errors} : {};
    const reportStatuses = {...data.codes, ...data.errors};
    Object.keys(reportStatuses).forEach((status) => {
        const data = {name: status, [`${prefix}count`]: reportStatuses[status]};
        if (allBenchmarkStatuses[status]) {
            data.benchmark_count = allBenchmarkStatuses[status];
            delete allBenchmarkStatuses[status];
        }
        errorsBar.push(data)
    });
    const restOfBenchmarkStatuses = Object.keys(allBenchmarkStatuses);

    if (restOfBenchmarkStatuses.length > 0) {
        restOfBenchmarkStatuses.forEach((status) => {
            errorsBar.push({name: status, benchmark_count: restOfBenchmarkStatuses[status]});
        })
    }
}
