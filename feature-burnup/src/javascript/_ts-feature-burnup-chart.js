Ext.define('Rally.technicalservices.chart.FeatureBurnup', {
    extend: 'Rally.ui.chart.Chart',
    alias: 'widget.tsfeatureburnup',

    config: {

        /**
         * Input configurations
         */
        timeboxScope:  undefined,
        releases: undefined,
        context: undefined,
        featureModelName: undefined,
        completedStates: undefined,

        loadMask: false,
        /**
         * Chart configurations
         */

        calculatorType: 'Rally.technicalservices.calculator.FeatureBurnup',
        calculatorConfig: undefined,
        storeType: 'Rally.data.lookback.SnapshotStore',

        storeConfig: {
            fetch: [
                'ObjectID',
                'Release',
                '_PreviousValues.Release',
                '_ValidFrom',
                'State',
                '_PreviousValues.State'
            ],
            sort: {
                '_ValidFrom': 1
            },
            limit: Infinity,
            compress: true,
            removeUnauthorizedSnapshots: true,
            hydrate: ['State','_PreviousValues.State']
        },

        chartConfig: {
            colors: ['#2f7ed8','#8bbc21'],

            chart: {
                defaultSeriesType: 'area',
                zoomType: 'xy'
            },
            title: {
                text: ''
            },
            xAxis: {
                categories: [],
                tickmarkPlacement: 'on',
                tickInterval: 5,
                labels: {
                    rotation: -45,
                    formatter: function(){
                        return Rally.util.DateTime.format(Rally.util.DateTime.fromIsoString(this.value), 'M-d');
                    }
                }
            },
            yAxis: [
                {
                    title: {
                        text: 'Feature Count'
                    }
                }
            ],
            legend: {
                align: 'center',
                verticalAlign: 'bottom',
                backgroundColor: 'white',
                borderColor: '#CCC',
                borderWidth: 1,
                shadow: false
            },
            tooltip: {
                formatter: function() {
                    return '' + this.x + '<br />' + this.series.name + ': ' + this.y;
                }
            },
            plotOptions: {
                series: {
                    marker: {
                        enabled: false,
                        states: {
                            hover: {
                                enabled: true
                            }
                        }
                    },
                    groupPadding: 0.01
                },
                column: {
                    stacking: null,
                    shadow: false
                }
            }
        }

    },
    constructor: function(config) {
        this.mergeConfig(config);


        var release_start_date = Rally.util.DateTime.toIsoString(config.timeboxScope.getRecord().get('ReleaseStartDate'), true),
            release_end_date = Rally.util.DateTime.toIsoString(config.timeboxScope.getRecord().get('ReleaseDate'), true);

        var release_oids = _.map(config.releases, function(rel){return rel.get('ObjectID')});

        this.config.calculatorConfig = {
            releaseOids: release_oids,
            completedStates: config.completedStates,
            startDate: release_start_date,
            endDate: release_end_date,
            projectOid: config.context.getProject().ObjectID,
            timeboxScope: config.timeboxScope
        };

        var find = {
            _TypeHierarchy: config.featureModelName,
            _ProjectHierarchy: config.context.getProject().ObjectID,
            _ValidTo:  {$gte: release_start_date},
            _ValidFrom: {$lte: release_end_date},
             Release: {$in: release_oids}
        };
        this.storeConfig.find = find;
        this.callParent([this.config]);

    },
    _validateAggregation: function () {
        if (!this._haveDataToRender()) {
            return this._setErrorMessage(this.aggregationErrorMessage);
        }
        this._setSubtitle(this.calculator.avgCycleTime);
        this._renderChart();
    },
    _setSubtitle: function(avgCycleTime){
        var cycle_time = "N/A";
        if (!isNaN(avgCycleTime)){
            this.chartConfig.title = { text:  Ext.String.format('<div style="text-align:center"><span style="font-size:20px;color:black;"><b>Average Cycle Time: {0} days</b></span></div>',avgCycleTime.toFixed(1))};
        } else {
            this.chartConfig.title = { text:  Ext.String.format('<div style="text-align:center"><span style="font-size:14px;color:black;">Average Cycle Time:  N/A (0 Features Delivered)</span></div>')};
        }


    },

    initComponent: function() {
        this.callParent(arguments);
    },
    //Overriding this function because we want to set colors ourselves.
    _setChartColorsOnSeries: function (series) {
        return null;
    }
});


