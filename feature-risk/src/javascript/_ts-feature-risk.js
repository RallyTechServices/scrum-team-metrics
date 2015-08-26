
Ext.define('Rally.technicalservices.chart.FeatureRisk', {
    extend: 'Ext.panel.Panel', //'Rally.ui.chart.Chart',
    alias: 'widget.tsfeatureriskpie',

    config: {
        featureModelName: undefined,
        completedStates: undefined,
        timeboxScope: undefined
    },
    height: 300,
    border: 0,
    layout: {type: 'vbox'},
    displayColorClassificationMapping: {
        '#107c1e': 'On Track',
        '#df1a7b': 'High Risk',
        '#fce205': 'Moderate Risk',
        '#f9a814': 'High Risk',
        '#ee6c19': 'High Risk'
    },
    classificationChartColorMapping: {
        'Other': Rally.technicalservices.Color.classificationOther,
        'On Track': Rally.technicalservices.Color.classificationOnTrack,
        'Moderate Risk': Rally.technicalservices.Color.classificationModerateRisk,
        'High Risk': Rally.technicalservices.Color.classificationHighRisk,
    },

    constructor: function(config) {
        this.mergeConfig(config);
        this.callParent([this.config]);
    },
    initComponent: function() {
        this.callParent(arguments);

        this._fetchFeatureColors().then({
            scope: this,
            success: function(records){
                this.records = records;
                this.add({
                    xtype: 'rallybutton',
                    text: 'Team View',
                    cls: 'secondary rly-small',
                    listeners: {
                        scope: this,
                        click: this._changeView
                    }
                });
                this._showSummaryView(records);
            },
            failure: function(msg){

            }
        });
    },
    _changeView: function(btn){
        if (this.down('rallychart')){
            this.down('rallychart').destroy();
        }

        if (btn.text == "Team View"){
            this._showTeamView(this.records);
            btn.setText("< Back to Summary");

        } else {
            this._showSummaryView(this.records);
            btn.setText("Team View");
        }
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
    _showTeamView: function(records){
        var chart_data = this._getTeamChartData(records);

        var chart = this.add({
            xtype: 'rallychart',
            loadMask: false,
            chartConfig: this._getTeamChartConfig(),
            chartData: chart_data,
            _setChartColorsOnSeries: function (series) {
                return null;
            }

        });
        chart.setHeight(this.height - 25);
        chart.setWidth(this.width);
    },
    _getSummaryChartData: function(records){

        var color_data = {},
            data = [];

        _.each(records, function(r){
            var color = r.get('DisplayColor') || 'Other';
            var classification = this.displayColorClassificationMapping[color] || 'Other';
            color_data[classification] = color_data[classification] || 0;
            color_data[classification]++;
        }, this);

        _.each(this.classificationChartColorMapping, function(color, classification){
            data.push({
                name: classification,
                y: color_data[classification] || 0,
                color: this.classificationChartColorMapping[classification]
            });
        }, this);

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
    _getSummaryChartConfig: function(){
        var x = this.width * .35,
            y = this.height * .25 + 25;
            console.log('x,y', this.width, this.height, x, y);
        return  {
            colors: [
                Rally.technicalservices.Color.classificationOnTrack,
                Rally.technicalservices.Color.classificationHighRisk,
                Rally.technicalservices.Color.classificationModerateRisk,
                Rally.technicalservices.Color.classificationOther
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
                pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
            },
            plotOptions: {
                pie: {
                    dataLabels: {
                        enabled: true,
                        distance: -3,
                        style: {
                            color: 'black',
                            fontSize: '10px'
                        },
                        format: '{point.name}: {point.y}'
                    },
                    center: [x, y],
                    size: '50%'
                }
            }
        };
    },
    _getTeamChartConfig: function() {
        return  {
            colors: [
                Rally.technicalservices.Color.classificationOnTrack,
                Rally.technicalservices.Color.classificationHighRisk,
                Rally.technicalservices.Color.classificationModerateRisk,
                Rally.technicalservices.Color.classificationOther
            ],

            chart: {
                type: 'bar'
            },
            title: {
                text: null
            },
            tooltip: {
                formatter: function(){
                    return Ext.String.format('{0}<br/>{1}: <b>{2}</b>',this.x, this.series.name, Number(this.point.y));
                }
            },
            xAxis: {
                type: 'category',
                labels: {
                    formatter: function(){
                        return Ext.String.format('<span title="{0}">{1}</span>',this.value, Ext.util.Format.ellipsis(this.value, 15));
                    }
                }
            },
            yAxis: {
                title: { text: '# Features'}
            },
            plotOptions: {
                bar: {
                    dataLabels: {
                        enabled: false
                    }
                },
                series: {
                    stacking: 'normal'
                }
            },
            legend: {
                enabled: false
            }
        };
    },
    _getTeamChartData: function(records){
        //categories - projects
        //series = risks
        var project_hash = {},
            classifications = _.keys(this.classificationChartColorMapping);

        _.each(records, function(r){
            var proj = r.get('Project')._refObjectName;

            if (!_.has(project_hash, proj)){
                project_hash[proj] = {name: proj};
                _.each(classifications, function(c){
                    project_hash[proj][c] = 0;
                });
            }
        });

        _.each(records, function(r){
            var color = r.get('DisplayColor') || 'Other',
                key = r.get('Project')._refObjectName;

            var classification = this.displayColorClassificationMapping[color] || 'Other';
            project_hash[key][classification]++;
        }, this);

        var sorted_projects = _.sortBy(project_hash, function(obj){ return -obj["High Risk"] || 0; });

        var categories = _.pluck(sorted_projects, "name"),
            data = {},
            series = [];

        _.each(classifications, function(cl){
            data[cl] = [];
            var totals = [];
            _.each(categories, function(ct){
                var total = Ext.Array.sum(_.reject(_.values(project_hash[ct]), function(val){ return isNaN(val);}));
                if (total > 0){
                    data[cl].push(project_hash[ct][cl]);
                } else {
                    data[cl].push(0);
                }

            });
            series.push({
                name: cl,
                data: data[cl] || [],
                color: this.classificationChartColorMapping[cl],
                totals: totals
            });
        }, this);

        return {
            categories: categories,
            series: series
        }

    },
    _fetchFeatureColors: function(){
        var filters = this.timeboxScope.getQueryFilter(),
            fetch = ['ObjectID','DisplayColor','Project'];

        var state_filters = [];
        _.each(this.completedStates, function(s){
            state_filters.push({
                property: 'State.Name',
                operator: '!=',
                value: s
            });
        });

        state_filters = Rally.data.wsapi.Filter.and(state_filters);
        filters = filters.and(state_filters);

        return Rally.technicalservices.WsapiToolbox.fetchWsapiRecords(this.featureModelName, filters, fetch);
    },
    //Overriding this function because we want to set colors ourselves.
    _setChartColorsOnSeries: function (series) {
        return null;
    }
});
