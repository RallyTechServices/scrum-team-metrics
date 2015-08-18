Ext.define('Rally.technicalservices.calculator.FeatureBurnup',{
    extend: 'Rally.data.lookback.calculator.TimeSeriesCalculator',
    config: {
        releaseOids: undefined,
        completedState: undefined,
        timeboxScope: undefined
    },
    constructor: function(config) {
        this.mergeConfig(config);
        this.callParent([this.config]);
    },
    runCalculation: function (snapshots) {

        this._calculateCycleTimes(snapshots);

        var calculatorConfig = this._prepareCalculatorConfig(),
            seriesConfig = this._buildSeriesConfig(calculatorConfig);

        var calculator = this.prepareCalculator(calculatorConfig);
        calculator.addSnapshots(snapshots, this._getStartDate(snapshots), this._getEndDate(snapshots));

        return this._transformLumenizeDataToHighchartsSeries(calculator, seriesConfig);
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
    },
    _calculateCycleTimes: function(snapshots){
        /**
         * _getFeatureCycleTime is calculated as the average cycle time from either
         * (1) the first day of the release if the feature was planned
         * (2) the day the feature was added to the release if the feature was added
         *
         * to the day the feature was set to the completed state.
         *
         * @param addedFeatureSnapshots
         * @param featuresDoneSnapshots
         * @returns {number}
         * @private
         */

        var release_start_date = Rally.util.DateTime.toIsoString(this.timeboxScope.getRecord().get('ReleaseStartDate')),
            completed_values = [this.completedState];

            var cycle_times = [],
                snaps_by_oid = Rally.technicalservices.LookbackToolbox.aggregateSnapsByOid(snapshots),
                durations = [];

            _.each(snaps_by_oid, function(snaps, oid){
                var start_date = Rally.util.DateTime.fromIsoString(snaps[0]._ValidFrom),
                    end_date = null,
                    prev_snap = null;

                for (var i =0; i < snaps.length; i++){
                    var snap = snaps[i];
                    if (Ext.Array.contains(completed_values, snap.State) &&
                        (prev_snap == null || !Ext.Array.contains(completed_values, prev_snap.State))){
                        end_date = Rally.util.DateTime.fromIsoString(snap._ValidFrom);
                    }
                    prev_snap = snap;
                }

                if (Date.parse(start_date) < Date.parse(release_start_date)){
                    start_date = release_start_date;
                }

                if (end_date && start_date){
                    cycle_times.push({objectId: oid, startDate: start_date, endDate: end_date});
                    durations.push(Rally.util.DateTime.getDifference(new Date(end_date), new Date(start_date), 'day'));
                }
            });
            console.log('cycle-times', Ext.Array.mean(durations), cycle_times, snaps_by_oid);

            this.avgCycleTime = Ext.Array.mean(durations);

    }
});
