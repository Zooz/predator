'use strict';

const uuid = require('uuid');

module.exports.generateStats = (phaseStatus) => {
    let stats;
    switch (phaseStatus) {
    case 'error':
        const error = new Error('Error thrown');
        stats = {
            runner_id: uuid(),
            phase_status: 'error',
            stats_time: Date.now().toString(),
            data: JSON.stringify({message: error.message}),
            error
        };
        break;
    case 'started_phase':
        const startedPhaseInfo = {
            'duration': 120,
            'arrivalRate': 500,
            'mode': 'uniform',
            'index': 0
        };
        stats = {
            runner_id: uuid(),
            phase_index: startedPhaseInfo.index.toString(),
            phase_status: 'started_phase',
            stats_time: Date.now().toString(),
            data: JSON.stringify(startedPhaseInfo)
        };
        break;
    case 'intermediate':
        const intermediatePhaseInfo = {
            'timestamp': '2019-01-22T14:43:24.910Z',
            'scenariosCreated': 101,
            'scenariosCompleted': 101,
            'requestsCompleted': 101,
            'latency': {
                'min': 258.2,
                'max': 1060.6,
                'median': 357.2,
                'p95': 1042,
                'p99': 1059
            },
            'rps': {
                'count': 101,
                'mean': 90.99
            },
            'scenarioDuration': {
                'min': 259.5,
                'max': 1062.2,
                'median': 359.3,
                'p95': 1044.3,
                'p99': 1060.6
            },
            'scenarioCounts': {
                'Get response code 200': 101
            },
            'errors': {},
            'codes': {
                '200': 101
            },
            'matches': 0,
            'customStats': {},
            'counters': {},
            'concurrency': 0,
            'pendingRequests': 0,
            'scenariosAvoided': 0
        };
        stats = {
            runner_id: uuid(),
            phase_status: 'intermediate',
            stats_time: Date.now().toString(),
            data: JSON.stringify(intermediatePhaseInfo)
        };
        break;
    case 'done':
        const donePhaseInfo = {
            'timestamp': '2019-01-22T14:44:37.667Z',
            'scenariosCreated': 150,
            'scenariosCompleted': 150,
            'requestsCompleted': 150,
            'latency': {
                'min': 63.3,
                'max': 1060.6,
                'median': 310.7,
                'p95': 1028.7,
                'p99': 1057.6
            },
            'rps': {
                'count': 150,
                'mean': 0.14
            },
            'scenarioDuration': {
                'min': 64.3,
                'max': 1062.2,
                'median': 312.1,
                'p95': 1030.5,
                'p99': 1059.1
            },
            'scenarioCounts': {
                'Get response code 200': 150
            },
            'errors': {},
            'codes': {
                '200': 150
            },
            'matches': 0,
            'customStats': {},
            'counters': {},
            'concurrency': 0,
            'pendingRequests': 0,
            'scenariosAvoided': 0
        };
        stats = {
            runner_id: uuid(),
            phase_status: 'done',
            stats_time: Date.now().toString(),
            data: JSON.stringify(donePhaseInfo)
        };
        break;
    case 'aborted':
        const abortedPhaseInfo = {

        };
        stats = {
            runner_id: uuid(),
            phase_status: 'aborted',
            stats_time: Date.now().toString(),
            data: JSON.stringify(abortedPhaseInfo)
        };
        break;
    default:
        break;
    }

    return stats;
};