'use strict';
module.exports = {
    isAllRunnersInExpectedPhase
};

function isAllRunnersInExpectedPhase(report, phaseStatus) {
    const postStatsUpdate = [];
    report.subscribers.forEach(subscribers => {
        postStatsUpdate.push(subscribers.phase_status);
    });
    const uniquePostStatsUpdatePhases = [...new Set(postStatsUpdate)];

    const isInStage = (postStatsUpdate.length === (report.parallelism || 1) && uniquePostStatsUpdatePhases.length === 1 && uniquePostStatsUpdatePhases[0] === phaseStatus);
    return isInStage;
}
