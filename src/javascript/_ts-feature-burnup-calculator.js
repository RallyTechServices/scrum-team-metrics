Ext.define('Rally.technicalservices.calculator.FeatureBurnup',{
    extend: 'Rally.data.lookback.calculator.TimeSeriesCalculator',
    config: {
        releaseOids: undefined,
        completedState: undefined
    },
    constructor: function(config) {
        this.mergeConfig(config);
        this.callParent([this.config]);
    },
    getMetrics: function () {
        var completedState = this.completedState;

        return [
            {
                "field": "ReleaseFeature",
                "as": "Total Features",
                "display": "line",
                "f": "sum"
            },
            {
                "field": "ReleaseFeature",
                "as": "Delivered Features",
                "f": "filteredSum",
                "filterField": "State",
                "filterValues": [completedState],
                "display": "area"
            }];
    },
    getDerivedFieldsOnInput: function(){
        var releases = this.releaseOids;

        return [{
            "as": "ReleaseFeature",
            "f": function(snapshot){
                if (snapshot.Release && Ext.Array.contains(releases, snapshot.Release)) {
                    return 1;
                }
                return 0;
            }
        }];
    }
});
