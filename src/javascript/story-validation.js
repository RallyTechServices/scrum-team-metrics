Ext.define('Rally.technicalservices.UserStoryValidationRules',{
    extend: 'Rally.technicalservices.ValidationRules',

    requiredFields: undefined, //
    iterations: [],

    constructor: function(config){
        Ext.apply(this, config);
        this.requiredFields = ['Owner','Feature'];
    },
    ruleFn_unscheduledIterationScheduleState: function(r){
        /**
         * If Iteration = unscheduled and state In-Progress raise flag
         */
        if (!r.get('Iteration') && r.get('ScheduleState') != 'Defined'){
            return Ext.String.format('{0} is an invalid state for an unscheduled Iteration', r.get('ScheduleState'));
        }
        return null;
    },
    
    ruleFn_missingFieldsStory: function(r) {
        var missingFields = [];

        _.each(this.requiredFields, function (f) {
            if (!r.get(f)) {
                missingFields.push(r.getField(f).displayName);
            }
        });
        if (missingFields.length === 0) {
            return null;
        }
        return Ext.String.format('Missing fields: {0}', missingFields.join(', '));
    },
    
    ruleFn_blockedFieldsPopulated: function(r){
        /**
         * Story is blocked and Blocker Category != null, Blocker Creation Date != null,
         * blocker Owner != null, blockerState != null
         */
        var requiredBlockerFields = ['c_BlockerCategory','c_BlockerOwnerFirstLast','c_BlockerState'],
            missingFields = [];
        if (r.get('Blocked')){

            _.each(requiredBlockerFields, function (f) {
                if (!r.get(f)) {
                    missingFields.push(r.getField(f).displayName);
                }
            });
            if (missingFields.length > 0){
                return Ext.String.format('Missing required fields for a blocked story:  {0}', missingFields.join(','));
            }
        }
        return null;
    },
    ruleFn_blockedNotInProgress: function(r){
        /**
         * Story is blocked, schedulestate must be In-Progress
         */
        if (r.get('Blocked')){
            if (r.get('ScheduleState') != 'In-Progress'){
                return Ext.String.format('Invalid State ({0}) for blocked story', r.get('ScheduleState'));
            }
        }
        return null;
    },
    ruleFn_sprintCompleteNotAccepted: function(r){
        /**
         * If sprint is in the past, then the story must be Completed or Accepted
         */
        var msg = null;
        if (r.get('Iteration') && r.get('ScheduleState') != 'Accepted'){
            var iteration_ref = r.get('Iteration')._ref;
            Ext.Array.each(this.iterations, function(i){
                if (i.get('_ref') == iteration_ref){
                    if (Rally.util.DateTime.fromIsoString(i.get('EndDate')) < new Date()){
                        msg = Ext.String.format("Story not Accepted after Iteration {0} has ended.", i.get('Name'));
                    }
                    return false;
                }
            });

        }
        return msg;
    }
});

