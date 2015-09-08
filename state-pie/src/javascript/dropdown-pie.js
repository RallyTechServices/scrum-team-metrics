
Ext.define('Rally.technicalservices.chart.DropdownFieldPie', {
    extend: 'Ext.panel.Panel', //'Rally.ui.chart.Chart',
    alias: 'widget.tsdropdownpie',

    config: {
        timeboxScope: undefined,
        dataFetch: ["FormattedID","Name"],
        pieField: undefined,
        modelName: undefined,
        artifactDisplayName: undefined
    },
    height: 300,
    border: 0,
    layout: {type: 'vbox'},

    constructor: function(config) {
        this.mergeConfig(config);
        this.callParent([this.config]);
    },

    initComponent: function() {
        this.callParent(arguments);

        this._fetchData().then({
            scope: this,
            success: function(records){
                this.records = records;
                this._showSummaryView(records);
            },
            failure: function(msg){

            }
        });
    },

    _showSummaryView: function(records){

        var chart = this.add({
            xtype: 'rallychart',
            loadMask: false,
            chartConfig: this._getSummaryChartConfig(),
            chartData: this._getSummaryChartData(records)
        });
        chart.setHeight(this.height - 25);
        chart.setWidth(this.width);
    },

    _getSummaryChartData: function(records){

        var data = Rally.technicalservices.MungingToolbox.getPieSeriesData(records, this.pieField);
        return {
            series: [{
                name: this.artifactDisplayName,
                data: data,
                size: '80%',
                dataLabels: {
                    formatter: function(){
                        return this.point.name + ': ' + this.y + '%'
                    }
                }
            }]
        };
    },
    _getSummaryChartConfig: function(){
        var x = this.width * .35,
            y = this.height * .25 + 25;
        return  {

            chart: {
                plotBackgroundColor: null,
                plotBorderWidth: 0,
                plotShadow: false,
                type: 'pie'
            },
            title: {
                text: null
            },
            tooltip: {
                pointFormat: '{point.y} ' + this.artifactDisplayName + ' <b>{point.percentage:.1f}%</b>'
            },
            plotOptions: {
                pie: {
                    dataLabels: {
                        enabled: true,
                        distance: -5,
                        style: {
                            color: 'black',
                            fontSize: '10px'
                        },
                        format: '{point.name}: {point.percentage:.1f}%'
                    }
                }
            },
            center: [x, y],
            size: '50%'
        };
    },

    _fetchData: function(){
        var filters = this.timeboxScope.getQueryFilter(),
            fetch = this.dataFetch;

        fetch.push(this.pieField);
        return Rally.technicalservices.WsapiToolbox.fetchWsapiRecords(this.modelName, filters, fetch);
    },
    //Overriding this function because we want to set colors ourselves.
    _setChartColorsOnSeries: function (series) {
        return null;
    }
});

