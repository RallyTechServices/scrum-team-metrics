Ext.define('Rally.technicalservices.chart.StoriesAccepted', {
    extend: 'Rally.ui.chart.Chart',
    alias: 'widget.tsstoriesaccepted',

    config: {
        featureSummaryCalculator: undefined,

        loadMask: false,

        chartConfig: {
            colors: [
                Rally.technicalservices.Color.storiesAcceptedCount,
                Rally.technicalservices.Color.storiesTotalCount
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
        this.chartConfig.title.text = this._getTitle(config.featureSummaryCalculator);
        this.chartData.series = this._getSeries(config.featureSummaryCalculator);

        this.callParent([this.config]);
    },
    initComponent: function() {
        this.callParent(arguments);
        this.setWidth(300);
    },
    _getSeries: function(calculator){

        var data = [{
            name: 'Accepted',
            y: calculator.storiesAcceptedCounts.Accepted,
            color: Rally.technicalservices.Color.storiesAcceptedCount
        },{
            name: 'Not Accepted',
            y: calculator.storiesAcceptedCounts.Total - calculator.storiesAcceptedCounts.Accepted,
            color: Rally.technicalservices.Color.storiesTotalCount
        }];


        return [{
            name: 'Accepted Stories',
            data: data,
            innerSize: '60%'
        }];
    },
    _getTitle: function(calculator){
        var pct_accepted = Number(calculator.storiesAcceptedCounts.Accepted/calculator.storiesAcceptedCounts.Total * 100).toFixed(1);

        return Ext.String.format('<div style="text-align:center"><span style="font-size:24px;color:black"><b>{0}%</b></span>' +
            '<br/><span style="font-size:12px;color:silver">Stories Accepted</span></div>',
            pct_accepted);
    },
    //Overriding this function because we want to set colors ourselves.
    _setChartColorsOnSeries: function (series) {
        return null;
    }

});
