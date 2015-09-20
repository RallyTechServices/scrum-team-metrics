Ext.define('Rally.technicalservices.chart.FeatureCycleTime', {
    extend: 'Ext.panel.Panel', 
    alias: 'widget.tsfeaturecycletime',
    logger: new Rally.technicalservices.Logger(),

    config: {
        /**
         * @cfg {Rally.app.TimeboxScope}  (required)
         * The timebox that will provide the beginning and end dates to search creation dates for
         */
        timeboxScope: undefined,
        /**
         * @cfg {Rally.app.Context}  (required)
         * The app context (current project, etc)
         */
        context: undefined,
        
        /**
         * 
         * @cfg {String}
         * 
         * Whether to show data in Summary view or by Team.  (Team|Summary)
         */
        summaryType: 'Summary'
        
    },
    height: 300,
    border: 0,

    fieldValues: [],
    
    constructor: function(config) {
        this.mergeConfig(config);
        
        this.callParent([this.config]);
        
        if ( Ext.isEmpty(this.timeboxScope) ) {
            throw "(" + this.xtype + ") Missing required attribute: timeboxScope";
        }
        
        if ( this.timeboxScope.type != 'release' ) {
            throw "(" + this.xtype + ") Timebox scope must be of type 'release'";
        }
        
        if ( Ext.isEmpty(this.context) ) {
            throw "(" + this.xtype + ") Missing required attribute: context";
        }
                
    },
    initComponent: function() {
        this.callParent(arguments);
        var me = this;
        
        this.setLoading("Getting valid states...",true);
        
        if ( !Ext.isEmpty(this.timeboxScope.getRecord()) ) {
            this.startDate = this.timeboxScope.getRecord().get('ReleaseStartDate');
            this.endDate = this.timeboxScope.getRecord().get('ReleaseDate');
        }
        
        if (!this.down('#chart_box') ) {
            this.add({
                xtype:'container',
                itemId:'chart_box',
                height: this.height - 10,
                minWidth: 250
            });
        }
        
        this.updateChart();

    },
    
    updateTimebox: function(timebox) {
        this.logger.log('updateTimebox', timebox);
        
        this.timeboxScope = timebox;
        if ( !Ext.isEmpty(this.timeboxScope.getRecord()) ) {
            this.startDate = this.timeboxScope.getRecord().get('ReleaseStartDate');
            this.endDate = this.timeboxScope.getRecord().get('ReleaseDate');
        }
        this.updateChart();
    },
    
    // assumes already have defect states saved
    updateChart: function() {
        var me = this;
        if ( me.down('rallychart') ) { me.down('rallychart').destroy();}

        // have to get the features in the release now so that we
        // can see what the cycle time was for the feature even if
        // it went through state changes while not in this release
        this._getFeaturesInRelease(this.timeboxScope).then({
            scope: this,
            success: function(features){
                var feature_oids = Ext.Array.map(features,function(feature){
                    return feature.get('ObjectID');
                });
                this._makeChart(feature_oids);
            },
            failure: function(msg) {
                Ext.Msg.alert("Problem with " + this.xtype, msg);
            }
        });
    },
    
    _getFeaturesInRelease: function(timebox_scope) {
        var release_name = timebox_scope.getRecord().get('Name');
        var model = "PortfolioItem/Feature";
        var fetch = ['ObjectID'];
       
        var state_filters = Rally.data.wsapi.Filter.or([
            {property:'State.Name', value:'Done'},
            {property:'State.Name', value:'Operate'}
        ]);
        
        var release_filter = Ext.create('Rally.data.wsapi.Filter', {property:'Release.Name', value:release_name});
        
        var filters = state_filters.and(release_filter);
        
        return Rally.technicalservices.WsapiToolbox.fetchWsapiRecords(model, filters, fetch);
    },
    
    _makeChart: function(feature_oids){
        var me = this;
        
        if ( this.down('rallychart') ) { this.down('rallychart').destroy();}
        
        this.down('#chart_box').removeAll();
        this.down('#chart_box').setLoading('Preparing Chart');
        
        this.logger.log('creating chart for start/end:', this.startDate, this.endDate);
        
        var colors = ['#fff'];
        this.chartType = 'pie';
        if ( me.summaryType != 'Summary' ) {
            this.chartType = 'column';
            colors = ['blue'];
        }
        
        var chart = this.down('#chart_box').add({
            xtype:'rallychart',
            height: this.height - 15,
            loadMask: false,
            storeType: 'Rally.data.lookback.SnapshotStore',
            storeConfig: {
                find: {
                    ObjectID: { '$in': feature_oids },
                    _TypeHierarchy: 'PortfolioItem/Feature',
                    CreationDate: {
                        '$lte': Rally.util.DateTime.toIsoString(this.endDate)
                    }
                },
                compress: true,
                fetch: ['State','CreationDate','Project','ObjectID','FormattedID','Name'],
                hydrate: ['State','Project']
            },
            calculatorType: 'Rally.TechnicalServices.calculator.FeatureCycleTimeCalculator',
            calculatorConfig: {
                trackLastValueForTheseFields: ['_ValidTo', '_ValidFrom', 'State'],
                startDate: me.startDate,
                endDate: me.endDate,
                granularity: 'day',
                summaryType: me.summaryType,
                chartType: me.chartType,
                onPointClick: me._displayDialogForClick
            },
            sort: {
                "_ValidFrom": 1
            },
            chartConfig: this._getChartConfig(me.summaryType),
            chartColors: colors
        });
        
        chart.on('chartRendered', function() { 
                this.down('#chart_box').setLoading(false);
            }, this);
    },
    
    _getChartConfig: function(summary_type) {
        if ( summary_type == "Summary" ) {
            return this._getSummaryChartConfig();
        } 
        return this._getTeamChartConfig();
    },
    
    _getSummaryChartConfig: function() {
        return  {
            chart: {
                type: 'pie'
            },
            title: {
                text: null
            },
            xAxis: {
                labels: { 
                    enabled: false
                }
            },
            legend: { 
                enabled: false
            },
            tooltip: {
                enabled: false
            },
            yAxis: {
                title: { 
                    text: null
                },
                min: 0
            },
            plotOptions: {
                'pie': {
                    colors: ['#fff'],
                    allowPointSelect: false,
                    dataLabels: {
                        distance: -100,
                        enabled: true,
                        style: {
                            color: 'gray',
                            fontSize: '25px'
                        },
                        formatter: function() {
                            return Ext.util.Format.number(this.y,'0.0') + " Days";
                        }
                    }
                },
                'column': {
                    marker: { enabled: false }
                }
            }
        };
    },
    
    _getTeamChartConfig: function() {
        return  {
            
            chart: {
                type: 'bar'
            },
            title: {
                text: null
            },
            tooltip: {
                formatter: function(){
                    return Ext.String.format('{0}<br/>{1}: <b>{2}</b>',this.x, this.series.name, Ext.util.Format.number(this.point.y,'0.0'));
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
                title: { text: 'Days'}
            },
            plotOptions: {
                bar: {
                    dataLabels: {
                        enabled: false
                    }
                }
            },
            legend: {
                enabled: false
            }
        };
    },
    
    // snapshots are one per item and include a 
    // field __cycle that was set by the calculator
    _displayDialogForClick: function(evt,snapshots) {
        var app = Rally.getApp();
        
        var point = evt.point;
        var project_name = point.category;
        var project_snaps = snapshots[project_name];
        
        
        app.logger.log('project snaps', project_snaps);
        
        var store = Ext.create('Rally.data.custom.Store',{ data: project_snaps });
        
        var date_renderer = function(v) {
            if ( Ext.isEmpty(v) ) { return ''; }
            return v.replace(/T.*$/,'');
        }
        
        var cycle_time_renderer = function(v) {
            if ( Ext.isEmpty(v) ) { return "--"; }
            
            return Ext.util.Format.number(v/24,'0.0');
        }
        
        var link_renderer = function(value, meta, record) {
            var obj = { _ref: '/portfolioitem/feature/' + record.get('ObjectID') };
            
            return "<a href='" + Rally.nav.Manager.getDetailUrl(obj) + "' target='_blank'>" + value + "</a>"
        }
        
        Ext.create('Rally.ui.dialog.Dialog', {
            id        : 'detailPopup',
            title     : 'Details for ' + project_name,
            width     : Ext.getBody().getWidth() - 25,
            height    : Ext.getBody().getHeight() - 25,
            closable  : true,
            items     : [{
                xtype:  'container',
                layout: { type: 'hbox'},
                items: [
                    { xtype: 'container', flex: 1}
                ]
            },
            {
                xtype                : 'rallygrid',
                sortableColumns      : true,
                showRowActionsColumn : false,
                showPagingToolbar    : false,
                width: Ext.getBody().getWidth() - 27,
                height:Ext.getBody().getWidth() - 25,
                columnCfgs           : [
                    { dataIndex: 'FormattedID', text: 'id', renderer: link_renderer },
                    { dataIndex: 'Name', text: 'Name', flex: 1 },
                    { dataIndex: 'State', text: 'State' },
                    { dataIndex: '__start_date', text: 'Start Date', renderer: date_renderer },
                    { dataIndex: '_ValidFrom', text: 'End Date', renderer: date_renderer },
                    { dataIndex: '__cycle', text: 'Cycle Time (days)', renderer: cycle_time_renderer }
                ],
                store : store
            }]
        }).show();
        
    }
});
