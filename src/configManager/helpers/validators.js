const swaggerValidator = require('express-ajv-swagger-validation');

module.exports.validateBenchmarkWeights = (req, res, next) => {
    const benchmarkWeights = req.body.benchmark_weights;
    if (benchmarkWeights){
        const p90Percentage = benchmarkWeights.percentile_ninety.percentage;
        const p50Percentage = benchmarkWeights.percentile_fifty.percentage;
        const serverErrorsPercentage = benchmarkWeights.server_errors.percentage;
        const clientErrorsPercentage = benchmarkWeights.client_errors.percentage;
        const rpsPercentage = benchmarkWeights.rps.percentage;

        const percentageSum = p90Percentage + p50Percentage + serverErrorsPercentage + clientErrorsPercentage + rpsPercentage;
        if (percentageSum !== 100){
            const error = new Error('Benchmark weights needs to sum up to 100%');
            error.statusCode = 422;
            return next(error);
        }
    }
    return next();
};

module.exports.validateBenchmarkProperties = (req, res, next) => {
    const benchmarkThreshold = req.body.benchmark_threshold;
    const benchmarkThresholdWebhookUrl = req.body.benchmark_threshold_webhook_url;
    const benchmarkWeights = req.body.benchmark_weights;

    if (benchmarkThreshold || benchmarkThresholdWebhookUrl || benchmarkWeights){
        if (!benchmarkThreshold || !benchmarkThresholdWebhookUrl || !benchmarkWeights){
            const errMsg = 'body request should have all of properties: benchmark_threshold,benchmark_threshold_webhook_url,benchmark_weights';
            const swaggerValidatorError = new swaggerValidator.InputValidationError([errMsg], req.path, req.method, { beautifyErrors: true });
            return next(swaggerValidatorError);
        }
    }
    return next();
};