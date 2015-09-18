Ext.define('Rally.technicalservices.chart.DefectResponseTime', {
    extend: 'Ext.panel.Panel', 
    alias: 'widget.tsdefectresponsetime',
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
         * @cfg {Boolean} 
         * Show only production defects (defects associated with an incident)
         */
        showOnlyProduction: false,
        
        /**
         * @cfg [{Boolean}] 
         * State names to include in the definition of 'Closed'
         */
        closedStateNames: ['Closed'],
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
        Rally.technicalservices.WsapiToolbox.fetchAllowedValues('Defect','State').then({
            scope: this,
            success: function(states){
                this.fieldValues = states;
                this.updateChart();
            },
            failure: function(msg) {
                Ext.Msg.alert("Problem with " + this.xtype, msg);
            }
        });
        
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

        this.setLoading("Getting defects...");
        Deft.Chain.pipeline([
            this._getDefectsInTimebox,
            this._separateIntoDiscoveryLocations
        ],this).then({
            scope: this,
            success: function(results){
                this._makeChart(results);
            },
            failure: function(msg) {
                Ext.Msg.alert("Problem with " + this.xtype, msg);
            }
        }).always(function() { 
            me.setLoading(false); 
        });
        
    },
    
    /*
     * returns a promise
     */
    _getDefectsInTimebox: function() {
        var model = "Defect";
        var fetch = ['FormattedID','CreationDate','Severity','Tags','c_IncidentCases','State','Project','ObjectID'];
        
        var severity_filters = Rally.data.wsapi.Filter.or([
            { property: 'Severity', value: 'Minor Problem' },
            { property: 'Severity', value: 'Major Problem' },
            { property: 'Severity', value: 'Crash/Data Loss' }
        ]);
        
        var filters = severity_filters;
        
        if ( !Ext.isEmpty(this.timeboxScope.getRecord()) ) {
            this.startDate = this.timeboxScope.getRecord().get('ReleaseStartDate');
            this.endDate = this.timeboxScope.getRecord().get('ReleaseDate');
        
            var date_filters = Rally.data.wsapi.Filter.and([
                { property:'CreationDate', operator: '>=', value: this.startDate },
                { property:'CreationDate', operator: '<=', value: this.endDate }
            ]);
        
            filters = date_filters.and(severity_filters);
        }
        return Rally.technicalservices.WsapiToolbox.fetchWsapiRecords(model, filters, fetch);
    },
    
    _separateIntoDiscoveryLocations: function(records) {
        var locations = { production: [], qa: [] };
        
        Ext.Array.each(records, function(record){
            if (this._hasIncident(record)) {
                locations.production.push(record);
            } else {
                locations.qa.push(record);
            }
        },this);
        
        return locations;
    },
    
    _isCID: function(defect) {
        var tags = Ext.Array.pluck( defect.get('Tags')._tagsNameArray, 'Name' );
        return Ext.Array.contains(tags,'CID');
    },
    
    _hasIncident: function(defect) {
        var cases_link = defect.get('c_IncidentCases');
        return ( !Ext.isEmpty(cases_link.LinkID) );
    },
    
    _makeChart: function(defects_by_location){
        var me = this;
        
        var projects_by_oid = {};
        Ext.Array.each(Ext.Array.push(defects_by_location.qa, defects_by_location.production), function(defect){
            projects_by_oid[defect.get('Project').ObjectID] = defect.get('Project')._refObjectName;
        });
        
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
                    CreationDate: {
                        '$gte': Rally.util.DateTime.toIsoString(this.startDate),
                        '$lte': Rally.util.DateTime.toIsoString(this.endDate)
                    },
                    _TypeHierarchy: 'Defect',
                    _ProjectHierarchy: this.context.getProject().ObjectID
                },
                compress: true,
                fetch: ['State','CreationDate','FormattedID','Name'],
                hydrate: ['State']
            },
            calculatorType: 'Rally.TechnicalServices.calculator.DefectResponseTimeCalculator',
            calculatorConfig: {
                trackLastValueForTheseFields: ['_ValidTo', '_ValidFrom', 'State'],
                productionDefects: defects_by_location.production,
                showOnlyProduction: me.showOnlyProduction,
                closedStateNames: me.closedStateNames,
                startDate: me.startDate,
                endDate: me.endDate,
                granularity: 'day',
                projectsByOID: projects_by_oid,
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
    
    // snapshots are one per defect and include a 
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
            var obj = { _ref: '/defect/' + record.get('ObjectID') };
            
            return "<a href='" + Rally.nav.Manager.getDetailUrl(obj) + "' target='_blank'>" + value + "</a>"
        }
        
        Ext.create('Rally.ui.dialog.Dialog', {
            id        : 'detailPopup',
            title     : 'Details for ' + project_name,
            width     : Ext.getBody().getWidth() - 25,
            height    : Ext.getBody().getHeight() - 25,
            closable  : true,
           // layout    : 'fit',
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
                columnCfgs           : [
                    { dataIndex: 'FormattedID', text: 'id', renderer: link_renderer },
                    { dataIndex: 'Name', text: 'Name', flex: 1 },
                    { dataIndex: 'State', text: 'State' },
                    { dataIndex: 'CreationDate', text: 'Creation Date', renderer: date_renderer },
                    { dataIndex: '_ValidFrom', text: 'End Date', renderer: date_renderer },
                    { dataIndex: '__cycle', text: 'Cycle Time (days)', renderer: cycle_time_renderer }
                ],
                store : store
            }]
        }).show();
        
    }
});
