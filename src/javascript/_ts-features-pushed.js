Ext.define('Rally.technicalservices.chart.FeaturesPushed', {
    extend: 'Rally.ui.chart.Chart',
    alias: 'widget.tsfeaturespushed',

    config: {

        loadMask: false,

        chartConfig: {
            colors: [Rally.technicalservices.Color.featurePushedColor],

            chart: {
                plotBackgroundColor: null,
                plotBorderWidth: 0,
                plotShadow: false,
                type: 'column'
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
                    stacking: 'normal'
                },
                series: {
                    borderWidth: 0,
                    dataLabels: {
                        enabled: true,
                        format: '{point.name}'
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
        this.chartData.categories = this._getCategories(config.featureSummaryCalculator);
        this.callParent([this.config]);

    },
    initComponent: function() {
        this.callParent(arguments);
    },
    _getTitle: function(){
        return Ext.String.format('<div style="text-align:center"><span style="font-size:20px;color:black;"><b>{0}</b></span></div>', this.title);
    },

    _getSeries: function(calculator){
       var sprint_hash = calculator.featurePushedSprintHash,
            data = [];

        _.each(calculator.featurePushedSprintHash, function(count, sprint){
            data.push(count);
        });


        var series =  [{
            name: 'Pushed Features',
            data: data
        }];
        return series;
    },
    _getCategories: function(calculator){
        return _.keys(calculator.featurePushedSprintHash);
    },
    //Overriding this function because we want to set colors ourselves.
    _setChartColorsOnSeries: function (series) {
        return null;
    }
});

