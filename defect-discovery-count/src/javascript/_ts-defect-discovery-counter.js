Ext.define('Rally.technicalservices.chart.DefectDiscoveryCounter', {
    extend: 'Ext.panel.Panel', 
    alias: 'widget.tsdefectdiscoverycounter',
    logger: new Rally.technicalservices.Logger(),

    config: {
        /**
         * @cfg {Rally.app.TimeboxScope}  (required)
         * The timebox that will provide the beginning and end dates to search creation dates for
         */
        timeboxScope: undefined
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
                
    },
    initComponent: function() {
        this.callParent(arguments);
        var me = this;
        
        this.setLoading("Getting valid states...",true);
        Rally.technicalservices.WsapiToolbox._fetchAllowedValues('Defect','State').then({
            scope: this,
            success: function(states){
                this.fieldValues = states;
                this.updateChart();
            },
            failure: function(msg) {
                Ext.Msg.alert("Problem with " + this.xtype, msg);
            }
        });
        
        
    },
    
    // assumes already have defect states saved
    updateChart: function() {
        var me = this;
        this.setLoading("Getting defects...");
        Deft.Chain.pipeline([
            this._getDefectsInTimebox,
            this._separateIntoDiscoveryLocations,
            this._calculateSeriesData
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
        var fetch = ['FormattedID','CreationDate','Severity','Tags','c_IncidentCases','State'];
        
        var severity_filters = Rally.data.wsapi.Filter.or([
            { property: 'Severity', value: 'Minor Problem' },
            { property: 'Severity', value: 'Major Problem' },
            { property: 'Severity', value: 'Crash/Data Loss' }
        ]);
        
        var filters = severity_filters;
        
        if ( !Ext.isEmpty(this.timeboxScope.getRecord()) ) {
            var startDate = this.timeboxScope.getRecord().get('ReleaseStartDate');
            var endDate = this.timeboxScope.getRecord().get('ReleaseDate');
        
            var date_filters = Rally.data.wsapi.Filter.and([
                { property:'CreationDate', operator: '>=', value: startDate },
                { property:'CreationDate', operator: '<=', value: endDate }
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
    
    // expect an array { production:[d1,d2,...], qa:[d3,d4...]}
    // return series for each state
    _calculateSeriesData: function(locations_hash) {
        var serieses = [];
        Ext.Array.each(this.fieldValues.reverse(), function(field_value){
            this.logger.log('field_value:', field_value);
            var series = {type:'bar',name:field_value,data:[],stack:1};
            
            var count = 0;
            Ext.Array.each(locations_hash.production, function(defect) {
                if ( defect.get('State') == field_value ) {
                    count = count + 1;
                }
            });
            series.data.push(count);
            
            count = 0;
            Ext.Array.each(locations_hash.qa, function(defect) {
                if ( defect.get('State') == field_value ) {
                    count = count + 1;
                }
            });
            series.data.push(count);

            serieses.push(series);
        },this);
        
        return serieses;
    },
    
    _isCID: function(defect) {
        var tags = Ext.Array.pluck( defect.get('Tags')._tagsNameArray, 'Name' );
        return Ext.Array.contains(tags,'CID');
    },
    
    _hasIncident: function(defect) {
        var cases_link = defect.get('c_IncidentCases');
        return ( !Ext.isEmpty(cases_link.LinkID) );
    },
    
    _makeChart: function(serieses){
        var categories = ['Production', 'QA'];
        
        if ( this.down('rallychart') ) { this.down('rallychart').destroy();}
        
        this.add({
            xtype:'rallychart',
            height: this.height - 15,
            loadMask: false,
            chartData: {
                series: serieses
            },
            chartColors: Rally.technicalservices.Color.colors,
            chartConfig: this._getChartConfig(categories)
        });
    },
    
    _getChartConfig: function(categories) {
        return  {
            chart: {},
            title: {
                text: null
            },
            tooltip: {
                formatter: function(){
                    return Ext.String.format('{0}: <b>{1}</b>',this.series.name, this.y);
                }
            },
            yAxis: {
                min: 0
            },
            xAxis: [{
                categories:  categories
            }],
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
                reversed: true
            }
        };
    }
});
