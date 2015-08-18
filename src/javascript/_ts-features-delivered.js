Ext.define('Rally.technicalservices.chart.FeaturesDelivered', {
    extend: 'Rally.ui.chart.Chart',
    alias: 'widget.tsfeaturesdelivered',

    config: {
        featureSummaryCalculator: undefined,

        loadMask: false,

        chartConfig: {
            colors: [
                Rally.technicalservices.Color.featureCompleteColor,
                Rally.technicalservices.Color.featureCompleteIncompleteDodColor,
                Rally.technicalservices.Color.featureTotalColor
            ],

            chart: {
                plotBackgroundColor: null,
                plotBorderWidth: 0,
                plotShadow: false,
                type: 'pie'
            },
            title: {
                text: '',
                align: 'center',
                verticalAlign: 'middle',
                y: -20,
                useHTML: true
            },
            tooltip: {
                pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
            },
            plotOptions: {
                pie: {
                    dataLabels: {
                        enabled: false
                    },
                    center: ['50%', '50%'],
                    size: '75%'
                }
            }
        },
        chartData: {
            series: []
        }

    },
    constructor: function(config) {
        this.mergeConfig(config);
        this.chartConfig.title.text = this._getTitle();
        this.chartData.series = this._getSeries(config.featureSummaryCalculator);

        this.callParent([this.config]);
    },
    initComponent: function() {
        this.callParent(arguments);
        this.setWidth(300);
    },
    _getSeries: function(calculator){
        console.log('_getSeries', calculator);

        var data = [{
            name: 'Delivered',
            y: calculator.featuresCompleted.length - calculator.doneFeaturesWithIncompleteDoD,
            color: Rally.technicalservices.Color.featureCompleteColor
        },{
            name: 'Delivered (Incompleted DoD)',
            y: calculator.doneFeaturesWithIncompleteDoD,
            color: Rally.technicalservices.Color.featureCompleteIncompleteDodColor
        },{
            name: 'Not Delivered',
           // y: calculator.featuresCurrentOrOnLastDayOfRelease.length - (calculator.completedFeatures),
            y: calculator.featuresOnDay0.length - (calculator.featuresCompleted.length),
            color: Rally.technicalservices.Color.featureTotalColor
        }];


        return [{
            name: 'Delivered',
            data: data,
            innerSize: '60%'
        }];
    },
    _getTitle: function(){
        var completed_features = this.featureSummaryCalculator.featuresCompleted.length,
            pct_features_delivered = Number(completed_features/this.featureSummaryCalculator.featuresOnDay0.length * 100).toFixed(1),
            pct_incompleted_dod = Number(this.featureSummaryCalculator.doneFeaturesWithIncompleteDoD/this.featureSummaryCalculator.featuresOnDay0.length * 100).toFixed(1);

        return Ext.String.format('<div style="text-align:center"><span style="font-size:24px;color:black"><b>{0}%</b></span>' +
            '<br/><span style="font-size:12px;color:silver">Delivered</span><br/>' +
            '<span style="font-size:18px;color:black"><b>{1}%</b></span>' +
            '<br/><span style="font-size:12px;color:silver">Incomplete DoD</span></div>',
            pct_features_delivered, pct_incompleted_dod);
    },
    //Overriding this function because we want to set colors ourselves.
    _setChartColorsOnSeries: function (series) {
        return null;
    }

});

