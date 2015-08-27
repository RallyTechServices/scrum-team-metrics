Ext.define('Rally.technicalservices.chart.FeatureSummary', {
    extend: 'Rally.ui.chart.Chart',
    alias: 'widget.tsfeaturesummary',

    config: {

        loadMask: false,

        chartConfig: {
            colors: [
                Rally.technicalservices.Color.featureDeployedColor,
                Rally.technicalservices.Color.featureNonDeployedColor
            ],

            chart: {
                plotBackgroundColor: null,
                plotBorderWidth: 0,
                plotShadow: false,
                type: 'bar'
            },
            title: {
                text: null
            },
            xAxis: {
                type: 'category',
                labels: {
                    enabled: true
                }
            },
            yAxis: {
                title: {
                    text: 'Feature Count'
                }
            },
            legend: {
                layout: 'vertical',
                align: 'right',
                verticalAlign: 'bottom',
                floating: true,
                y: -30
            },
            tooltip: {
                formatter: function () {

                    return this.series.name + ': ' + this.y + '<br/>' +
                        'Total: ' + this.point.stackTotal;
                }
            },
            plotOptions: {
                series: {
                    point: {
                        events: {
                            click: function(){
                                console.log('select',this);
                                var data = Ext.create('Rally.technicalservices.DataPopover',{
                                    modelName: this.series.chart.userOptions.chart.modelName,
                                    fetch: this.series.chart.userOptions.chart.fetch,
                                    title: Ext.String.format("{0} {1} Features ({2} items)", this.category, this.series.name, this.oids.length || 0),
                                    oids: this.oids
                                });
                                data.show();
                            }
                        }
                    },
                    borderWidth: 0,
                    stacking: "normal"
                }
            }
        },
        chartData: {
            series: []
        }

    },
    constructor: function(config) {
        this.mergeConfig(config);

        this.chartData.series = this._getSeries(config.featureSummaryCalculator);
        this.callParent([this.config]);

    },
    initComponent: function() {
        this.callParent(arguments);
    },

    _getSeries: function(calculator){

        var categories = ['Total','Planned','Added','Descoped','Delivered'],
            deployable_data = [0,0,0,0,0],
            non_deployable_data = [0,0,0,0,0],
            model = calculator.featureModelName,
            serverFilters = [];

        if (calculator.deployableFeatures && calculator.deployableFeatures.length > 0){
            deployable_data = [
                {y: _.intersection(calculator.featuresCurrentOrOnLastDayOfRelease || [], calculator.deployableFeatures).length, oids: _.intersection(calculator.featuresCurrentOrOnLastDayOfRelease || [], calculator.deployableFeatures)},
                {y: _.intersection(calculator.featuresOnDay0 || [], calculator.deployableFeatures).length,oids: _.intersection(calculator.featuresOnDay0 || [], calculator.deployableFeatures)},
                {y: _.intersection(calculator.featuresAdded || [], calculator.deployableFeatures).length, oids: _.intersection(calculator.featuresAdded || [], calculator.deployableFeatures)},
                {y: _.intersection(calculator.featuresDescoped || [], calculator.deployableFeatures).length, oids: _.intersection(calculator.featuresDescoped || [], calculator.deployableFeatures)},
                {y: _.intersection(calculator.featuresCompleted || [], calculator.deployableFeatures).length, oids: _.intersection(calculator.featuresCompleted || [], calculator.deployableFeatures)}
            ];
        }

        if (calculator.nonDeployableFeatures && calculator.nonDeployableFeatures.length > 0){
            non_deployable_data = [
                {y: _.intersection(calculator.featuresCurrentOrOnLastDayOfRelease || [], calculator.nonDeployableFeatures).length, oids: _.intersection(calculator.featuresCurrentOrOnLastDayOfRelease || [], calculator.nonDeployableFeatures)},
                {y: _.intersection(calculator.featuresOnDay0 || [], calculator.nonDeployableFeatures).length, oids:_.intersection(calculator.featuresOnDay0 || [], calculator.nonDeployableFeatures)},
                {y: _.intersection(calculator.featuresAdded || [], calculator.nonDeployableFeatures).length, oids: _.intersection(calculator.featuresAdded || [], calculator.nonDeployableFeatures)},
                {y: _.intersection(calculator.featuresDescoped || [], calculator.nonDeployableFeatures).length, oids:_.intersection(calculator.featuresDescoped || [], calculator.nonDeployableFeatures)},
                {y: _.intersection(calculator.featuresCompleted || [], calculator.nonDeployableFeatures).length, oids: _.intersection(calculator.featuresCompleted || [], calculator.nonDeployableFeatures)}
            ];
        }
        this.chartData.categories = categories;
        this.chartConfig.chart.modelName = calculator.featureModelName;
        this.chartConfig.chart.fetch = ["FormattedID","Name","Project","State"];

        var series =  [{
                name: 'Deployable',
                data: deployable_data,
            }, {
                name: 'Non-Deployable',
                data: non_deployable_data
        }];

        return series;
    },

    _setChartColorsOnSeries: function () {
        return null;
    }
});

