module.exports.validateBenchmarkWeights = (config) => {
    const benchmarkConfig = config.benchmark_config;
    if (benchmarkConfig){
        const p90Percentage = benchmarkConfig.benchmark_weights.percentile_ninety.percentage;
        const p50Percentage = benchmarkConfig.benchmark_weights.percentile_fifty.percentage;
        const serverErrorsPercentage = benchmarkConfig.benchmark_weights.server_errors.percentage;
        const clientErrorsPercentage = benchmarkConfig.benchmark_weights.client_errors.percentage;

        const percentageSum = p90Percentage + p50Percentage + serverErrorsPercentage + clientErrorsPercentage;
        if (percentageSum !== 100){
            const error = new Error('Benchmark weights needs to sum up to 100%');
            error.statusCode = 422;
            throw error;
        }
    }
};