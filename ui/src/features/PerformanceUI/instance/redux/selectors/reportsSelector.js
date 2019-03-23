import dateFormat from "dateformat";
import { createSelector } from 'reselect'

export const reports = (state) => state.ReportsReducer.get('reports');
export const aggregateReport = (state) => state.ReportsReducer.get('aggregate_report');
export const errorOnGetReports = (state) => state.ReportsReducer.get('error_get_reports');
export const report = (state) => state.ReportsReducer.get('report');
export const errorOnGetReport = (state) => state.ReportsReducer.get('error_get_report');
export const processingGetReports = (state) => state.ReportsReducer.get('processing_get_reports');


export const getAggregateReort = createSelector(aggregateReport,(report)=>{
    const latencyGraph = [],
        errorsCodeGraph = [],
        errorCodes = {},
        errorsGraph = [],
        errors = {},
        rps = [],
        errorsBar = [],
        scenarios = [];
    if (report) {
        const startTime = new Date(report.start_time).getTime();
        report.intermediates.forEach((bucket, index) => {
            const latency = bucket.latency;
            const time = new Date(startTime + (bucket.bucket * 1000));
            latencyGraph.push({
                name: `${dateFormat(time, 'h:MM:ss')}`,
                median: latency.median,
                p95: latency.p95,
                p99: latency.p99,
            });
            rps.push({name: `${dateFormat(time, 'h:MM:ss')}`, mean: bucket.rps.mean});

            if (Object.keys(bucket.codes).length > 0) {
                errorsCodeGraph.push({name: `${dateFormat(time, 'h:MM:ss')}`, ...bucket.codes, ...bucket.errors});
                Object.keys(bucket.codes).forEach((code) => {
                    errorCodes[code] = true;
                });
                Object.keys(bucket.errors).forEach((error) => {
                    errorCodes[error] = true;
                })
            }

        });

        Object.keys(report.aggregate.codes).forEach((code) => {
            errorsBar.push({name: code, count: report.aggregate.codes[code]})
        });
        Object.keys(report.aggregate.errors).forEach((error) => {
            errorsBar.push({name: error, count: report.aggregate.errors[error]})
        });
        Object.keys(report.aggregate.scenarioCounts).forEach((key) => {
            scenarios.push({name: key, value: report.aggregate.scenarioCounts[key]})
        })

    }

    return {
        latencyGraph,
        errorsCodeGraph,
        errorCodes,
        errorsGraph,
        errors,
        rps,
        errorsBar,
        scenarios
    }
});
