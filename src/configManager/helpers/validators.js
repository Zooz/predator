module.exports.validateBenchmarkWeights = (req, res, next) => {
    const benchmarkWeights = req.body.benchmark_weights;
    if (benchmarkWeights){
        const p95Percentage = benchmarkWeights.percentile_ninety_five.percentage;
        const p50Percentage = benchmarkWeights.percentile_fifty.percentage;
        const serverErrorsPercentage = benchmarkWeights.server_errors_ratio.percentage;
        const clientErrorsPercentage = benchmarkWeights.client_errors_ratio.percentage;
        const rpsPercentage = benchmarkWeights.rps.percentage;

        const percentageSum = p95Percentage + p50Percentage + serverErrorsPercentage + clientErrorsPercentage + rpsPercentage;
        if (percentageSum !== 100){
            const error = new Error('Benchmark weights needs to sum up to 100%');
            error.statusCode = 422;
            return next(error);
        }
    }
    return next();
};