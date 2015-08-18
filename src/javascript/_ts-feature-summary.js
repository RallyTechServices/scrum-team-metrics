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
                text: '',
                align: 'center',
                useHTML: true
            },
            tooltip: {
                pointFormat: '<b>{point.y}</b>'
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
                enabled: false
            },
            plotOptions: {
                series: {
                    borderWidth: 0,
                    dataLabels: {
                        formatter: function(){

                        }
                    },
                    stacking: "normal",
                    tooltip: {
                        pointFormat: '{series.name}: <b>{point.y}</b>'

                    }
                }
            }
        },
        chartData: {
            series: []
        }

    },
    constructor: function(config) {
        this.mergeConfig(config);
        console.log('tsfeaturesummary')

        this.chartData.series = this._getSeries(config.featureSummaryCalculator);
        this.chartConfig.title.text = this._getTitle();
        this.callParent([this.config]);

    },
    initComponent: function() {
        this.callParent(arguments);
        this.setWidth(300);
    },
    _getTitle: function(){
        return Ext.String.format('<div style="text-align:center"><span style="font-size:20px;color:black;"><b>{0}</b></span></div>', this.title);
    },

    _getSeries: function(calculator){
        console.log('_getSeries', calculator);

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
                data: deployable_data
            }, {
                name: 'Non-Deployable',
                data: non_deployable_data
            }];

        console.log('chartData',categories, series);
            //['Total', calculator.featuresCurrentOrOnLastDayOfRelease.length],
            //['Planned',calculator.featuresOnDay0.length],
            //['Added',calculator.featuresAdded.length],
            //['Descoped',calculator.featuresDescoped.length],
            //['Delivered',calculator.completedFeatures]
        return series;
    },
    _setChartColorsOnSeries: function () {
        return null;
    }
});

