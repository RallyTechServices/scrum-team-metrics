Ext.define('Rally.technicalservices.calculator.FeatureSummary',{
    config: {
        completedState: "Done",
        plannedDate: undefined,
        timeboxScope: undefined,
        featureModelName: "PortfolioItem/Feature",
        releases: undefined
    },
    displayColorsOfRisk: undefined,
    notCalculated: -1,
    pushedField: 'c_FeatureTargetSprint',

    /**
     * Features on Track(for current project scope):
     * Features on track = All features for release that are not Done and not Yellow or Red in Color (note the color is set manually).
     *
     */
    onTrackFeatures: undefined,
    /**
     * Features associated with the current Release that are currently in the completedState
     */
    completedFeatures: undefined,
    totalFeatures: undefined,
    plannedFeatures: undefined,
    pushedFeatures: undefined,
    newFeaturesInRelease: undefined,
    descopedFeatures: undefined,
    doneFeaturesWithIncompleteDod: undefined,

    constructor: function (config) {
        this.mergeConfig(config);
        this.callParent([this.config]);
    },
    _getStartFind: function(release_oids){
        var release_start_date = Rally.util.DateTime.toIsoString(this.timeboxScope.getRecord().get('ReleaseStartDate'));

        return {
            _TypeHierarchy: this.featureModelName,
            _ProjectHierarchy: this.context.getProject().ObjectID,
            __At: release_start_date,
            Release: {$in: release_oids}
        };
    },
    _getEndFind: function(release_oids){
        var release_end_date = Rally.util.DateTime.toIsoString(this.timeboxScope.getRecord().get('ReleaseDate'));
        if (release_end_date > new Date()){
            release_end_date = "current";
        }
        return {
            _TypeHierarchy: this.featureModelName,
            _ProjectHierarchy: this.context.getProject().ObjectID,
            __At: release_end_date,
            Release: {$in: release_oids}
        };
    },
    calculate: function(){
        var deferred = Ext.create('Deft.Deferred'),
            release_oids = _.map(this.releases, function(r){return r.get('ObjectID')}),
            fetch = ['ObjectID'];

        var promises = [
            Rally.technicalservices.LookbackToolbox.fetchLookbackRecords(this._getStartFind(release_oids), fetch),
            Rally.technicalservices.LookbackToolbox.fetchLookbackRecords(this._getEndFind(release_oids), fetch),
            this._fetchFeaturesComplete(),
            this._fetchFeatureColors(),
            this.getDoneItemsWithIncompleteDoD(),
            this._fetchFeaturesPushed()
        ];

        Deft.Promise.all(promises).then({
            scope: this,
            success: function(results){
                this.featuresOnDay0 = _.map(results[0], function(r){ return r.get('ObjectID')}),
                this.featuresCurrentOrOnLastDayOfRelease = _.map(results[1], function(r){return r.get('ObjectID')}),
                this.featuresDescoped = Ext.Array.difference(this.featuresOnDay0, this.featuresCurrentOrOnLastDayOfRelease),
                this.featuresAdded = Ext.Array.difference(this.featuresCurrentOrOnLastDayOfRelease, this.featuresOnDay0);
                this.completedFeatures = results[2] || this.notCalculated;
                this.featureColorData = results[3];

                this.doneFeaturesWithIncompleteDoD = this._getFeatureWithIncompleteDoDCount(results[4]);
                this.featuresPushedCount = this._getFeaturesPushedCount(results[5]);
                deferred.resolve();
            },
            failure: function(msg){
                console.log('failure', msg);
            }
        });
        return deferred;
    },
    _fetchFeatureColors: function(){
        var filters = this.timeboxScope.getQueryFilter(),
            fetch = ['ObjectID','DisplayColor','State'];

        filters = filters.and(Ext.create('Rally.data.wsapi.Filter',{
            property: 'State.Name',
            operator: '!=',
            value: this.completedState
        }));

        return Rally.technicalservices.WsapiToolbox.fetchWsapiRecords(this.featureModelName, filters, fetch);
    },
    _fetchFeaturesComplete: function(){
        var filters = this.timeboxScope.getQueryFilter();

        filters = filters.and(Ext.create('Rally.data.wsapi.Filter',{
            property: 'State.Name',
            operator: '=',
            value: this.completedState
        }));

        return Rally.technicalservices.WsapiToolbox.fetchWsapiCount(this.featureModelName, filters);
    },
    _fetchFeaturesPushed: function(){
        var release_oids = _.map(this.releases, function(rel){return rel.get('ObjectID')});
        var find = {
            _TypeHierarchy: this.featureModelName,
            _ProjectHierarchy: this.context.getProject().ObjectID,
            Release: {$in: release_oids},
            "_PreviousValues.c_FeatureTargetSprint": {$exists: true}
        };
        var fetch = ['c_FeatureTargetSprint','_PreviousValues.c_FeatureTargetSprint','ObjectID','_ValidFrom'];
        return Rally.technicalservices.LookbackToolbox.fetchLookbackRecords(find, fetch);
    },
    getDoneItemsWithIncompleteDoD: function(){
        var filters = this.timeboxScope.getQueryFilter();

        filters = filters.and(Ext.create('Rally.data.wsapi.Filter',{
            property: 'c_DoDStoryType',
            operator: '!=',
            value: ''
        }));

        filters = filters.and(Ext.create('Rally.data.wsapi.Filter',{
            property: 'ScheduleState',
            operator: '!=',
            value: "Accepted"
        }));

        filters = filters.and(Ext.create('Rally.data.wsapi.Filter',{
            property: 'Feature.State.Name',
            value: this.completedState
        }));
        //TODO - process the data to return the number of features
        return Rally.technicalservices.WsapiToolbox.fetchWsapiRecords('HierarchicalRequirement',filters,['Feature','ObjectID']);
    },
    _getFeatureWithIncompleteDoDCount: function(records){
        var features = [];
        _.each(records, function(r){
            if (r.get('Feature')){
                features = Ext.Array.merge(features, [r.get('Feature').ObjectID]);
            }
        });
        console.log('features', features);
        return features.length;
    },
    _getFeaturesPushedCount: function(records){
        var snaps_by_oid = Rally.technicalservices.LookbackToolbox.aggregateSnapsByOidForModel(records),
            pushed_features = [],
            sprints = {};

        _.each(snaps_by_oid, function(snaps, oid){
            _.each(snaps, function(snap){
                 var prev_sprint = snap["_PreviousValues.c_FeatureTargetSprint"] ||  null;
                if (prev_sprint){
                    pushed_features = Ext.Array.merge(pushed_features, [oid]);
                    if (sprints[prev_sprint] == undefined){
                        sprints[prev_sprint] = 0;
                    }
                    sprints[prev_sprint]++;
                }
            });
        });

        console.log('snaps', sprints, pushed_features);
        this.featurePushedSprintHash = sprints;
        return pushed_features.length;
    }
});

