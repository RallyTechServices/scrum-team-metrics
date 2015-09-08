 Ext.define('Rally.technicalservices.chart.FeaturesPushed', {
    extend: 'Ext.panel.Panel', //'Rally.ui.chart.Chart',
    alias: 'widget.tsfeaturespushed',
/*
Todo:  make this a panel and then create the chart.
 */
    config: {

        records: undefined,
        releases: undefined,
        context: undefined,
        featureModelName: undefined,

        loadMask: false,



    },
     constructor: function(config) {
         this.mergeConfig(config);
         this.callParent([this.config]);
     },
     initComponent: function() {
         this.callParent(arguments);

         if (this.records == undefined){
             this.setLoading('Loading historical data...');
             this._fetchFeaturesPushed().then({
                 scope: this,
                 success: function(records){
                     this._displayChart(records);
                     this.setLoading(false);
                 },
                 failure: function(msg){
                     Rally.ui.notify.Notifier.showError({message: msg});
                     this.setLoading(false);
                 }
             });
         } else {
             this.initData(this.records);
         }
     },

     _displayChart: function(records){

        var pushed_hash = this._buildFeaturesPushedHash(records),
            categories = this._getCategories(pushed_hash),
            series= this._getSeries(categories, pushed_hash);

         var chart = this.add({
             xtype: 'rallychart',
             loadMask: false,
             chartConfig: this._getChartConfig(),
             chartData: {
                 series: series,
                 categories: categories
             }
         });
         chart.setHeight(this.height - 25);
         chart.setWidth(this.width);
    },
     _getChartConfig: function(){
         return  {
             colors: [Rally.technicalservices.Color.featurePushedColor],

             chart: {
                 plotBackgroundColor: null,
                     plotBorderWidth: 0,
                     plotShadow: false,
                     type: 'column'
             },
             title: {
                 text: null
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
         }
     },
    _fetchFeaturesPushed: function(){
        var release_oids = _.map(this.releases, function(rel){return rel.get('ObjectID')});
        var find = {
            _TypeHierarchy: this.featureModelName,
            _ProjectHierarchy: this.context.getProject().ObjectID,
            Release: {$in: release_oids},
            "_PreviousValues.c_FeatureTargetSprint": {$exists: true}
        };
        var fetch = ['c_FeatureTargetSprint','_PreviousValues.c_FeatureTargetSprint','ObjectID','_ValidFrom'];
        return Rally.technicalservices.LookbackToolbox.fetchLookbackRecords(find, fetch);
    },
    _buildFeaturesPushedHash: function(records){
        var snaps_by_oid = Rally.technicalservices.LookbackToolbox.aggregateSnapsByOidForModel(records),
            pushed_features = [],
            sprints = {};

        _.each(snaps_by_oid, function(snaps, oid){
            _.each(snaps, function(snap){
                var prev_sprint = snap["_PreviousValues.c_FeatureTargetSprint"] ||  null;
                if (prev_sprint){
                    pushed_features = Ext.Array.merge(pushed_features, [oid]);
                    if (sprints[prev_sprint] == undefined){
                        sprints[prev_sprint] = 0;
                    }
                    sprints[prev_sprint]++;
                }
            });
        });

        return sprints;
    },
    _getSeries: function(categories, pushed_hash){
       var data = [];

        _.each(categories, function(sprint){
            data.push(pushed_hash[sprint] || 0);
        });

        var series =  [{
            name: 'Pushed Features',
            data: data
        }];
        return series;
    },
    _getCategories: function(pushed_hash){
        var keys = Ext.Array.sort(_.keys(pushed_hash));
        return keys;
    },
    //Overriding this function because we want to set colors ourselves.
    _setChartColorsOnSeries: function (series) {
        return null;
    }
});

