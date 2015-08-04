Ext.define('Rally.technicalservices.chart.FeatureSummary', {
    extend: 'Rally.ui.chart.Chart',
    alias: 'widget.tsfeaturesummary',

    config: {

        loadMask: false,

        chartConfig: {
            colors: [
                Rally.technicalservices.Color.featureTotalColor,
                Rally.technicalservices.Color.featurePlanned,
                Rally.technicalservices.Color.featureAdded,
                Rally.technicalservices.Color.featureDescoped,
                Rally.technicalservices.Color.featurePushedColor
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
                column: {
                    stacking: 'normal',
                    colorByPoint: true
                },
                series: {
                    borderWidth: 0,
                    dataLabels: {
                        enabled: false,
                        format: '{point.y}'
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

        var series =  [{
            name: 'Snapshot',
            data: [
            ['Total', calculator.featuresCurrentOrOnLastDayOfRelease.length],
            ['Planned',calculator.featuresOnDay0.length],
            ['Added',calculator.featuresAdded.length],
            ['Descoped',calculator.featuresDescoped.length],
            ['Pushed',calculator.featuresPushedCount]
        ]
            }];
        return series;
    },
    _setChartColorsOnSeries: function () {
        return null;
    }
});

