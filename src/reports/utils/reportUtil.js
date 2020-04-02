'use strict';
module.exports={
    isAllRunnersInExpectedPhase
};

function isAllRunnersInExpectedPhase(report, phaseStatus) {
    let postStatsUpdate = [];
    report.subscribers.forEach(subscribers => {
        postStatsUpdate.push(subscribers.phase_status);
    });
    let uniquePostStatsUpdatePhases = [...new Set(postStatsUpdate)];

    let isInStage = (postStatsUpdate.length === (report.parallelism || 1) && uniquePostStatsUpdatePhases.length === 1 && uniquePostStatsUpdatePhases[0] === phaseStatus);
    return isInStage;
}
