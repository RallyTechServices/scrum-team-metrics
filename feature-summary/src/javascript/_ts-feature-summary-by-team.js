Ext.define('Rally.technicalservices.chart.FeatureSummaryByTeam', {
    extend: 'Rally.ui.chart.Chart',
    alias: 'widget.tsfeaturesummarybyteam',

    config: {

        loadMask: false,

        chartConfig: {
            colors: [
                Rally.technicalservices.Color.featurePlanned,
                Rally.technicalservices.Color.featureAdded,
                Rally.technicalservices.Color.featureDescoped,
                Rally.technicalservices.Color.featureNonDeployedColor
            ],

            chart: {
                zoomType: 'xy'
            },
            title: {
                text: null
            },
            xAxis: {
                type: 'category',
                labels: {
                    //rotation: -60,
                    style: {
                        fontSize: '11px',
                        fontFamily: 'Verdana, sans-serif'
                    },
                    useHTML: true,
                    formatter: function(){
                        return '<span title="' + this.value + '"> ' + Ext.util.Format.ellipsis(this.value, 15) + '</span>';
                    }
                }
            },
            yAxis: {
                title: {
                    text: 'Feature Count'
                }
            },
            plotOptions: {
                series: {
                    borderWidth: 0,
                    stacking: "normal"
                }
            },
            tooltip: {
                formatter: function () {
                    var total = 0,
                        x = this.point.x,
                        descoped = 0,
                        y = this.y;

                    _.each(this.series.chart.series, function(s){
                         if (s.name == "Descoped"){
                            descoped = s.yData[x];
                        } else {
                            total += s.yData[x];
                        }
                    });

                    if (this.series.name == "Descoped"){
                        y = -descoped;
                    }

                    if (this.series.name == "Planned"){
                        y = y - descoped;
                    }

                    return this.x + '<br/>' + this.series.name + ': ' + y + '<br/>' +
                        'Total: ' + total;
                }
            },
            legend: {
                layout: 'vertical',
                align: 'right',
                verticalAlign: 'bottom',
                floating: true,
                y: -30
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
    _getSeries: function(calculator){

        var categories = this._getCategories(calculator);

        var start_records = calculator.startRecords,
            end_records = calculator.endRecords,
            added_oids = calculator.featuresAdded,
            descoped_oids = calculator.featuresDescoped,
            planned_oids = calculator.featuresOnDay0,
            completed_states = calculator.completedStates,
            proj_hash = {};
        console.log('---',descoped_oids, planned_oids,completed_states);

        _.each(start_records, function(r){
            var proj = r.get('Project').Name,
                oid = r.get('ObjectID');

            if (!proj_hash[proj]){
                proj_hash[proj] = {planned: 0, added: 0, descoped: 0, done: 0}
            }
            if (Ext.Array.contains(planned_oids, oid)){
                proj_hash[proj].planned++;
            }
            if (Ext.Array.contains(descoped_oids, oid)){
                proj_hash[proj].descoped++;
            }
        });

        _.each(end_records, function(r){
            var proj = r.get('Project').Name,
                oid = r.get('ObjectID');

            if (!proj_hash[proj]){
                proj_hash[proj] = {planned: 0, added: 0, descoped: 0, done: 0}
            }
            if (Ext.Array.contains(added_oids,oid)){
                proj_hash[proj].added++;
            }
            if (Ext.Array.contains(completed_states, r.get('State'))){
                proj_hash[proj].done++;
            }
        });

        console.log('---',proj_hash);

        this.chartData.categories = categories;

        var planned_data = [],
            descoped_data = [],
            added_data = [],
            done_data = [];

        _.each(categories, function(proj){
            var proj_obj = proj_hash[proj] || {},
                descoped = proj_hash[proj].descoped || 0;

            planned_data.push(proj_obj.planned || 0 - descoped);
            descoped_data.push(-descoped);
            added_data.push(proj_obj.added || 0);
            done_data.push(proj_obj.done || 0);
        });

        console.log('---',categories, planned_data, descoped_data,added_data, done_data);
        var series =  [{
            name: 'Added',
            type: 'bar',
            data: added_data,
           // stack: 'total'
        },{
            name: 'Planned',
            type: 'bar',
            data: planned_data,
            //  stack: 'total'
        },{
            name: 'Descoped',
            type: 'bar',
            data: descoped_data
        //},{
        //    name: 'Done',
        //    type: 'spline',
        //    data: done_data
        }];

        return series;
    },
    _getCategories: function(calculator){
        var categories = Ext.Array.merge(this._getTeamArray(calculator.startRecords), this._getTeamArray(calculator.endRecords));
        return Ext.Array.sort(categories);
    },
    _getTeamArray: function(records){
        var teams = [];
        _.each(records, function(r){
            var team = r.get('Project').Name;
            if (!Ext.Array.contains(teams,team)){
                teams.push(team);
            }
        });
        return teams;
    },
    _setChartColorsOnSeries: function () {
        return null;
    }
});


