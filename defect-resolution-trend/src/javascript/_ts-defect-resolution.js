Ext.define('Rally.technicalservices.chart.DefectResolutionTrend', {
    extend: 'Ext.panel.Panel', 
    alias: 'widget.tsdefectresolutiontrendchart',
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
        
    },
    
    // assumes already have defect states saved
    updateChart: function() {
        var me = this;
        
        //if ( this.showOnlyProduction ) {
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
//        } else {
//            this._makeChart({qa:[],production:[]});
//        }
        
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
        if ( this.down('rallychart') ) { this.down('rallychart').destroy();}
        var me = this;
        
        this.logger.log("adding chart", defects_by_location);
        
        var projects_by_oid = {};
        Ext.Array.each(Ext.Array.push(defects_by_location.qa, defects_by_location.production), function(defect){
            projects_by_oid[defect.get('Project').ObjectID] = defect.get('Project')._refObjectName;
        });
        
        this.logger.log('projects_by_oid', projects_by_oid);
        
        var chart = this.add({
            xtype:'rallychart',
            height: this.height - 15,
            //loadMask: false,
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
                fetch: ['State','Release','CreationDate'],
                hydrate: ['State']
            },
            calculatorType: 'Rally.TechnicalServices.calculator.DefectResolutionTrendCalculator',
            calculatorConfig: {
                productionDefects: defects_by_location.production,
                allDefects: Ext.Array.merge(defects_by_location.production, defects_by_location.qa),
                showOnlyProduction: me.showOnlyProduction,
                startDate: me.startDate,
                endDate: me.endDate,
                granularity: 'day',
                workDays: ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
                projectsByOID: projects_by_oid,
                summaryType: me.summaryType
            },
            sort: {
                "_ValidFrom": 1
            },
            chartColors: Rally.technicalservices.Color.colors,
            chartConfig: this._getChartConfig()
        });
        
        if (this.summaryType == "Team") {
            chart.on('chartRendered', this._splitChartIntoSparkLines,this,{ single: true});
        }
    },
    
    _splitChartIntoSparkLines: function(chart) {
        var serieses = chart.chartData.series;
        var categories = chart.chartData.categories;
        chart.hide();
        console.log('--', serieses);

        
        var data = Ext.Array.map(serieses, function(series){
            return { Name: series.name, Data: series.data }
        });
        
        var store =  Ext.create('Rally.data.custom.Store', {
            data: data,
            sorters: [{property:'Name', direction:'ASC'}]
        });
        
        console.log('->', store);
        
        this.grid = this.add({
            xtype:'rallygrid',
            store: store,
            width: this.width || 400,
            height: this.height,
            showPagingToolbar: false,
            columnCfgs: [
                {text: 'Name', flex: 1, dataIndex: 'Name'},
                {text: 'Trend', dataIndex: 'Data', width: 200, padding: 0, margin: 0, renderer: function(value, meta, record){
//                    meta.tdCls = meta.tdCls + 'chart-target';
                    return '<div class="chart-target" style="height:25px;"></div>';
                }}
            ]
        });

        this.grid.on('viewready', this._renderSparkLines, this);
        
    },
    
    _renderSparkLines: function() {
        var store = this.grid.store;
        for ( var i=0; i< store.getTotalCount(); i++ ) {
            var record = store.getAt(i);
            var holder = Ext.DomQuery.select('.chart-target', this.grid.view.getNode(i));
            if ( !Ext.isEmpty(record) && holder.length) {
                var columnElement = holder[0];
                columnElement.innerHTML = '';
                
                var columnValue = record.get('Data');
                
                var series = [{
                    name:record.get('Name'),
                    data:record.get('Data'),
                    marker: { enabled: false }
                }];
                
                                
                Ext.create('Rally.ui.chart.Chart',{
                    width: 250,
                    chartData: {
                        series: series
                    },
                    chartConfig: {
                        chart: {
                            type:'area',
                            style: {
                                overflow: 'visible'
                            },
                            margin: [2,0,2,0],
                            height: 25
                        },
                        title: {
                            text: ''
                        },
                        credits: { enabled: false },
                        xAxis: { 
                            labels:{ enabled: false },
                            title: { text: null },
                            tickLength: 0
                        },
                        yAxis: { 
                            labels:{ enabled: false },
                            title: { text:  null },
                            endOnTick: false,
                            startOnTick: false,
                            tickPositions: [0]
                        },
                        legend: { enabled: false },
                        tooltip: { enabled: false }
                    },
                    renderTo: columnElement
                });
            }
        }
    },
    
    _getChartConfig: function() {
        return  {
            chart: {},
            title: {
                text: null
            },
            xAxis: {
                tickmarkPlacement: 'on',
                tickInterval: 14,
                labels: { rotation: -65, align: 'right' }

            },
            tooltip: {
                formatter: function(){
                    return Ext.String.format('{0}: <b>{1}</b>',this.series.name, this.y);
                }
            },
            yAxis: {
                title: { 
                    text: null
                },
                min: 0
            },
            plotOptions: {
                'line': {
                    marker: { enabled: false }
                }
            }
        };
    }
});
