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
                //layout: 'vertical',
                align: 'right',
                verticalAlign: 'bottom',
                floating: true,
                y: 10
            },
            tooltip: {
                formatter: function () {
                    return this.series.name + ': ' + this.y + '<br/>' +
                        'Total: ' + this.point.stackTotal;
                }
            },
            plotOptions: {
                series: {
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
            non_deployable_data = [0,0,0,0,0];

        if (calculator.deployableFeatures && calculator.deployableFeatures.length > 0){
            deployable_data = [
                _.intersection(calculator.featuresCurrentOrOnLastDayOfRelease || [], calculator.deployableFeatures).length,
                _.intersection(calculator.featuresOnDay0 || [], calculator.deployableFeatures).length,
                _.intersection(calculator.featuresAdded || [], calculator.deployableFeatures).length,
                _.intersection(calculator.featuresDescoped || [], calculator.deployableFeatures).length,
                _.intersection(calculator.featuresCompleted || [], calculator.deployableFeatures).length
            ];
        }

        if (calculator.nonDeployableFeatures && calculator.nonDeployableFeatures.length > 0){
            non_deployable_data = [
                _.intersection(calculator.featuresCurrentOrOnLastDayOfRelease || [], calculator.nonDeployableFeatures).length,
                _.intersection(calculator.featuresOnDay0 || [], calculator.nonDeployableFeatures).length,
                _.intersection(calculator.featuresAdded || [], calculator.nonDeployableFeatures).length,
                _.intersection(calculator.featuresDescoped || [], calculator.nonDeployableFeatures).length,
                _.intersection(calculator.featuresCompleted || [], calculator.nonDeployableFeatures).length
            ];
        }
        this.chartData.categories = categories;

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

