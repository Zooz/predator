# Benchmarks
!!! TIP "Supported from version zooz/predator:1.3.0"

## Motivation
Load test results increase in their value and importance when compared to a certain benchmark. 

By creating a benchmark for a specific test, 
each subsequent test run for that test will be given a `score` from 0-100 summarizing the test run in one simple to analyze numerical value.

The <b>benchmarks</b> feature alongside the <b><u>[compare test runs](schedulesandreports.html#comparing-reports)</u></b> are tools that leverage `predators` reports 
and ensures that new releases stand up to your performance requirements. 

## Setting Up
### Test as a Benchmark
To set a test as a benchmark, choose a test run that you are satisfied with the results, open its report and click on `Set as Benchmark`.
Now, all future runs of this test will have their score calculated based on the benchmarks selected.

### Benchmark Weights
There are 5 factors taken from the test run results that affect the score of the run.

- <b>Median</b>: Percentage of the score affected by median results
- <b>P95</b>: Percentage of the score affected by p95 results
- <b>Server errors</b>: Percentage of the score affected by server errors ratio
- <b>Client errors</b>: Percentage of the score affected by client errors ratio
- <b>RPS</b>: Percentage of the score affected by requests per second results

Please refer to the <u>[configuration manual](configuration.md#benchmarks)</u> for further documentation.