Ext.define('Rally.technicalservices.chart.FeaturesDelivered', {
    extend: 'Ext.panel.Panel', //'Rally.ui.chart.Chart',
    alias: 'widget.tsfeaturesdelivered',
    border: 0,

    constructor: function(config) {
        this.mergeConfig(config);
        this.callParent([this.config]);
    },
    initComponent: function() {
        this.callParent(arguments);

        var promises = [
            this._fetchFeaturesComplete(),
            this._fetchDoneItemsWithIncompleteDoD(),
            this._fetchTotalFeatures()
        ];
        console.log('blah');
        Deft.Promise.all(promises).then({
            scope: this,
            success: function(results){
                var completedWithIncompleteDoD = this._getFeatureWithIncompleteDoDCount(results[1]),
                    completed_features = results[0],
                    total_features = results[2];

                var chart = this.add({
                    xtype: 'rallychart',
                    loadMask: false,
                    chartConfig: this._getChartConfig(total_features,completed_features,completedWithIncompleteDoD),
                    chartData: this._getChartData(completed_features,completedWithIncompleteDoD,total_features),
                    _setChartColorsOnSeries: function (series) {
                        return null;
                    }
                });
                chart.setHeight(this.height);
                chart.setWidth(this.width);
            },
            failure: function(msg){
                console.log('faliaure', msg)
            }
        });
    },
    _getChartConfig: function(totalFeatures, completedFeatures, incompleteDoDFeatures){
        var title = this._getTitle(completedFeatures,totalFeatures,incompleteDoDFeatures);

        var x = this.width * .35,
            y = this.height * .35;

        console.log('x,y',x,y)
        return {
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
                text: title,
                //align: 'center',
                verticalAlign: 'middle',
                x: -x *.35,
                y: -y *.65,
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
                    center: ['35%', '35%'],
                    size: '75%'
                }
            }
        };
    },
    _getChartData: function(completedFeatures, completedWithIncompleteDoD, totalFeatures){
        var data = [{
            name: 'Delivered',
            y: completedFeatures - completedWithIncompleteDoD,
            color: Rally.technicalservices.Color.featureCompleteColor
        },{
            name: 'Delivered (Incompleted DoD)',
            y: completedWithIncompleteDoD,
            color: Rally.technicalservices.Color.featureCompleteIncompleteDodColor
        },{
            name: 'Not Delivered',
            y: Math.max(totalFeatures - (completedFeatures),0),
            color: Rally.technicalservices.Color.featureTotalColor
        }];

        return {
            series: [{
                name: 'Delivered',
                data: data,
                innerSize: '60%'
            }]
        };
    },
    _getTitle: function(completed_features, total_features, incomplete_dod_features){
         if (total_features > 0) {
            var pct_features_delivered = Number(completed_features / total_features * 100).toFixed(1),
                pct_incompleted_dod = Number(incomplete_dod_features / total_features * 100).toFixed(1);

            return Ext.String.format('<div style="text-align:center"><span style="font-size:24px;color:black"><b>{0}%</b></span>' +
                '<br/><span style="font-size:12px;color:silver">Delivered</span><br/>' +
                '<span style="font-size:18px;color:black"><b>{1}%</b></span>' +
                '<br/><span style="font-size:12px;color:silver">Incomplete DoD</span></div>',
                pct_features_delivered, pct_incompleted_dod);
        } else {
            return Ext.String.format('<div style="text-align:center"><span style="font-size:24px;color:black"><b>N/A</b></span>' +
                '<br/><span style="font-size:12px;color:silver">No<br/>Features</span><br/></div>');
        }
    },
    _fetchTotalFeatures: function(){
        var filters = this.timeboxScope.getQueryFilter();

        return Rally.technicalservices.WsapiToolbox.fetchWsapiCount(this.featureModelName, filters);
    },
    _fetchFeaturesComplete: function(){
        var filters = this.timeboxScope.getQueryFilter();

        var state_filters = [];
        _.each(this.completedStates, function(s){
            state_filters.push({
                property: 'State.Name',
                value: s
            });
        });
        state_filters = Rally.data.wsapi.Filter.or(state_filters);
        filters = filters.and(state_filters);

        return Rally.technicalservices.WsapiToolbox.fetchWsapiCount(this.featureModelName, filters);
    },
    _fetchDoneItemsWithIncompleteDoD: function(){

        var filters = [];
        _.each(this.completedStates, function(s){
            filters.push({
                property: 'Feature.State.Name',
                value: s
            });
        });
        filters = Rally.data.wsapi.Filter.or(filters);

        filters = filters.and(this.timeboxScope.getQueryFilter());

        filters = filters.and(Ext.create('Rally.data.wsapi.Filter',{
            property: 'c_DoDStoryType',
            operator: '!=',
            value: ''
        }));

        filters = filters.and(Ext.create('Rally.data.wsapi.Filter',{
            property: 'ScheduleState',
            operator: '!=',
            value: "Accepted"
        }));

        return Rally.technicalservices.WsapiToolbox.fetchWsapiRecords('HierarchicalRequirement',filters,['Feature','ObjectID']);
    },
    _getFeatureWithIncompleteDoDCount: function(records){
        var features = [];
        _.each(records, function(r){
            if (r.get('Feature')){
                features = Ext.Array.merge(features, [r.get('Feature').ObjectID]);
            }
        });
        return features.length;
    }


});

