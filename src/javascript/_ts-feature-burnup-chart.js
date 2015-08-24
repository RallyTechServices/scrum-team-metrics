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

        loadMask: false,
        /**
         * Chart configurations
         */
       // loadMask: false,

        calculatorType: 'Rally.technicalservices.calculator.FeatureBurnup',
        calculatorConfig: undefined,
        storeType: 'Rally.data.lookback.SnapshotStore',


        storeConfig: {
            fetch: [
                'ObjectID',
               // 'c_FeatureTargetSprint',
               // '_PreviousValues.c_FeatureTargetSprint',
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
                text: '',
                useHTML: true
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
                align: 'left',
                x: 0,
                verticalAlign: 'top',
                y: 30,
                floating: true,
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

        this.chartConfig.title.text = this._getTitle(config.title);

        var release_start_date = Rally.util.DateTime.toIsoString(config.timeboxScope.getRecord().get('ReleaseStartDate'), true),
            release_end_date = Rally.util.DateTime.toIsoString(config.timeboxScope.getRecord().get('ReleaseDate'), true);

        var release_oids = _.map(config.releases, function(rel){return rel.get('ObjectID')});

        this.config.calculatorConfig = {
            releaseOids: release_oids,
            completedState: config.completedState,
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
        this.chartConfig.subtitle = { text:  Ext.String.format('Average Cycle Time: {0} days',avgCycleTime.toFixed(1))};

    },
    _getTitle: function(){
        return Ext.String.format('<div style="text-align:center"><span style="font-size:20px;color:black;"><b>{0}</b></span></div>', this.title);
    },

    initComponent: function() {
        this.callParent(arguments);
    },
    //Overriding this function because we want to set colors ourselves.
    _setChartColorsOnSeries: function (series) {
        return null;
    }
});


