Ext.define('Rally.technicalservices.ValidationRules',{

    ruleFnPrefix: 'ruleFn_',
    requiredFields: undefined,

    constructor: function(config){
        Ext.apply(this, config);
    },
    getRules: function(){
        var ruleFns = [],
            ruleRe = new RegExp('^' + this.ruleFnPrefix);

        for (var fn in this)
        {
            if (ruleRe.test(fn)){
                ruleFns.push(fn);
            }
        }
        return ruleFns;
    },
    statics: {
        getUserFriendlyRuleLabel: function(ruleName){
            switch(ruleName){
                case 'ruleFn_missingFieldsStory':
                    return '[User Story] Missing required fields';

                case 'ruleFn_missingFieldsFeature':
                    return '[Feature] Missing required fields';

                case 'ruleFn_stateSynchronization':
                    return '[Feature] State is not aligned with story states';

                case 'ruleFn_featureTargetSprintMatchesRelease':
                    return '[Feature] Target Sprint not aligned with Release';

                case 'ruleFn_storiesPlannedByFeatureTargetSprint':
                    return '[Feature] Child stories are planned after Feature Target Sprint';

                case 'ruleFn_featureStateShouldMatchTargetSprint':
                    return '[Feature] State not aligned with Target Sprint';

                case 'ruleFn_unscheduledIterationScheduleState':
                    return '[User Story] In-Progress with unscheduled Iteration';

                case 'ruleFn_blockedFieldsPopulated':
                    return '[User Story] Blocked fields not populated';

                case 'ruleFn_blockedNotInProgress':
                    return '[User Story] Blocked but not In-Progress';

                case 'ruleFn_sprintCompleteNotAccepted':
                    return '[User Story] Past Iteration not complete';
                    
                case 'ruleFn_stateForTargetSprint': 
                    return '[Feature] Past TargetSprint not done';
                case 'ruleFn_featureIsRisk':
                    return '[Feature] is a Risk';
                case 'ruleFn_featureTargetSprintPushed':
                    return '[Feature] Target Sprint was pushed';
                case 'ruleFn_validateCodeDeploymentSchedule':
                    return '[Feature] Code Deployment Schedule not valid';
            }
        }
    }
});