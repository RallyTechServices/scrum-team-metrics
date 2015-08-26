Ext.define('Rally.technicalservices.calculator.FeatureSummary',{
    config: {
        completedStates: ["Operate","Done"],
        plannedDate: undefined,
        timeboxScope: undefined,
        featureModelName: "PortfolioItem/Feature",
        releases: undefined
    },
    notCalculated: 0,

    /**
     * Features associated with the current Release that are currently in the completedState
     */
    featuresCompleted: undefined,
    totalFeatures: undefined,
    plannedFeatures: undefined,
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
            fetch = ['ObjectID','c_FeatureDeploymentType','State','Project'];

        var promises = [
            Rally.technicalservices.LookbackToolbox.fetchLookbackRecords(this._getStartFind(release_oids), fetch,['Project']),
            Rally.technicalservices.LookbackToolbox.fetchLookbackRecords(this._getEndFind(release_oids), fetch,['State','Project']),
            this.getDoneItemsWithIncompleteDoD()
        ];

        Deft.Promise.all(promises).then({
            scope: this,
            success: function(results){
                this.startRecords = results[0];
                this.endRecords = results[1];

                this.featuresOnDay0 = _.map(results[0], function(r){ return r.get('ObjectID')}),
                this.featuresCurrentOrOnLastDayOfRelease = _.map(results[1], function(r){return r.get('ObjectID')}),
                this.featuresDescoped = Ext.Array.difference(this.featuresOnDay0, this.featuresCurrentOrOnLastDayOfRelease),
                this.featuresAdded = Ext.Array.difference(this.featuresCurrentOrOnLastDayOfRelease, this.featuresOnDay0);
                this.featuresCompleted = this._getCompletedFeatureOids(results[1]);
                this.doneFeaturesWithIncompleteDoD = this._getFeatureWithIncompleteDoDCount(results[2]);
                this._setDeployableFeatures(results[0],results[1]);
                deferred.resolve();
            },
            failure: function(msg){
                deferred.reject(msg);
            }
        });
        return deferred;
    },
    _getCompletedFeatureOids: function(records){
        var completed_records = [],
            completed_states = this.completedStates;

        _.each(records, function(r){
            var state = r.get('State') || null;
            if (Ext.Array.contains(completed_states, state)){
                completed_records.push(r.get('ObjectID'));
            }
        }, this);
        return completed_records;
    },
    _setDeployableFeatures: function(day0Features, currentFeatures){
        var non_deployable = [],
            deployable = [];


         _.each(currentFeatures, function(f){
            var deployment_type = f.get('c_FeatureDeploymentType');
            if (deployment_type && /^N\/A/.test(deployment_type)){
                non_deployable.push(f.get('ObjectID'));
            } else {
                deployable.push(f.get('ObjectID'));
            }
        });

        _.each(day0Features, function(f){
            var deployment_type = f.get('c_FeatureDeploymentType'),
                oid = f.get('ObjectID');
            if (!Ext.Array.contains(deployable, oid) &&
                    !Ext.Array.contains(non_deployable, oid)){

                if (/^N\/A/.test(deployment_type)){
                    non_deployable.push(oid);
                } else {
                    deployable.push(oid);
                }
            }
        });

        this.deployableFeatures = deployable;
        this.nonDeployableFeatures = non_deployable;

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

        var state_filters = [];
        _.each(this.completedStates, function(state){
            state_filters.push({
                property: 'Feature.State.Name',
                value: state
            });
        });
        filters = filters.and(Rally.data.wsapi.Filter.or(state_filters));

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
        return features.length;
    }
});

