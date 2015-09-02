
Ext.define('Rally.technicalservices.chart.FeatureRisk', {
    extend: 'Ext.panel.Panel', //'Rally.ui.chart.Chart',
    alias: 'widget.tsriskpie',

    config: {
        timeboxScope: undefined,
        dataFetch: ["FormattedID","Name","Project","Iteration","EndDate","ScheduleState","Description"],
        riskField: 'c_SecurityBusinessRisk',
        riskValue: 'High',
        riskRegex: 'Business risk: High',
        benchmarkDate: undefined
    },
    height: 300,
    border: 0,
    layout: {type: 'hbox'},

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


        var data = this._getSummaryData(records);

        return {
            series: [{
                name: 'Risk Color',
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
    _getSummaryData: function(records){
        var accepted = 0,
            non_commited = 0,
            committed = 0,
            benchmark_date = this.benchmarkDate;

        _.each(records, function(r){

            if (this._isRisk(r)){
                console.log(r.get('ScheduleState'));
                if (r.get('ScheduleState') == "Accepted"){
                    accepted++;
                } else {
                    var date = null,
                        iteration = r.get('Iteration');

                    if (iteration){
                        date = Rally.util.DateTime.fromIsoString(iteration.EndDate)
                    }

                    if (date < benchmark_date){
                        committed++;
                    } else {
                        non_commited++;
                    }
                }
            }
        }, this);

        var formatted_date = Rally.util.DateTime.format(this.benchmarkDate, 'm/d');

        return [{
            name: "Total Accepted",
            y: accepted,
            color: Rally.technicalservices.Color.storiesAcceptedCount
        },{
            name: 'Total Committed by ' + formatted_date,
            y: committed,
            color: Rally.technicalservices.Color.storiesCommitted
        },{
            name: 'Total Non-Committed after ' + formatted_date,
            y: non_commited,
            color: Rally.technicalservices.Color.storiesNonCommitted
        }];

    },
    _isRisk: function(r){
        var description = r.get('Description'),
            is_risk = false,
            risk_regex = new RegExp(this.riskRegex,"gi");

        if (risk_regex.test(description)){
            is_risk = true;
        }

        if (r.get(this.riskField) == this.riskValue){
            is_risk = true;
        }
        return is_risk;

    },
    _getSummaryChartConfig: function(){
        //var x = this.width * .35,
        //    y = this.height * .25 + 25;

        return  {
            colors: [
                Rally.technicalservices.Color.storiesAcceptedCount,
                Rally.technicalservices.Color.storiesCommitted,
                Rally.technicalservices.Color.storiesNonCommitted
            ],

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
                pointFormat: '<b>{point.y} User Stories</b> ({point.percentage:.1f}%)'
            },
            plotOptions: {
                pie: {
                    dataLabels: {
                        enabled: true,
                        distance: 10,
                        style: {
                            color: 'black',
                            fontSize: '10px'
                        },
                        format: '{point.name}<br/>{point.y} User Stories ({point.percentage:.1f}%)'
                    }
                }
            },
            legend: {
                enabled: true
            }
        };
    },
    _fetchData: function(){
        var filters = this.timeboxScope.getQueryFilter(),
            fetch = this.dataFetch;

        fetch.push(this.riskField);

        return Rally.technicalservices.WsapiToolbox.fetchWsapiRecords('HierarchicalRequirement', filters, fetch);
    },
    //Overriding this function because we want to set colors ourselves.
    _setChartColorsOnSeries: function (series) {
        return null;
    }
});

