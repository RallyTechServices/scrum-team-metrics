Ext.define("Rally.TechnicalServices.calculator.DefectResponseTimeCalculator", {
    extend: "Rally.data.lookback.calculator.TimeInStateCalculator",

    config: {
        closedStateNames: ['Fixed','Closed','Junked','Duplicate'],
        productionDefects: [],
        allDefects: [],
        showOnlyProduction: false,
        chartType: 'column', /* column or pie */
        summaryType: 'Summary', // || 'Team'
        projectsByOID: {} // required for 'Team' summaryType
    },
    
    _isCreatedAfterStart: function(snapshot) {
        var me = this;
        
        if ( me.config.showOnlyProduction) {
            var production_defect_oids = Ext.Array.map(this.config.productionDefects,function(d){
                return d.get('ObjectID')
            });
            
            return 
                snapshot.CreationDate >= Rally.util.DateTime.toIsoString(me.config.startDate)
                && Ext.Array.contains(production_defect_oids,snapshot.ObjectID);
        }
        return (snapshot.CreationDate >= Rally.util.DateTime.toIsoString(me.config.startDate));

    },
    
    _isResolved: function(snapshot) {
        var me = this;
        var killed_states = this.config.closedStateNames;

        if ( me.config.showOnlyProduction) {
            var production_defect_oids = Ext.Array.map(this.config.productionDefects,function(d){
                return d.get('ObjectID')
            });
            
            return (
                Ext.Array.contains(killed_states,snapshot.State)
                && Ext.Array.contains(production_defect_oids,snapshot.ObjectID)
                && snapshot.CreationDate >= Rally.util.DateTime.toIsoString(me.config.startDate)
            );
        }

        return ( 
            Ext.Array.contains(killed_states,snapshot.State)
            && snapshot.CreationDate >= Rally.util.DateTime.toIsoString(me.config.startDate) 
        );

    },
    
    runCalculation: function (snapshots) {
        var me = this;
        
        this.startDate = this.startDate || this._getStartDate(snapshots);
        this.endDate = this.endDate || this._getEndDate(snapshots);
            
        var final_snaps = Ext.Array.filter(snapshots, function(snapshot){
            return ( Ext.Array.contains(me.closedStateNames, snapshot.State) 
                 && snapshot._ValidTo == "9999-01-01T00:00:00.000Z" );
        });
        
        var cycle_times = Ext.Array.map(final_snaps,function(snapshot){
            console.log(snapshot._ValidFrom, snapshot.CreationDate);
            var creation_date_in_js = Rally.util.DateTime.fromIsoString(snapshot.CreationDate);
            var state_date_in_js =    Rally.util.DateTime.fromIsoString(snapshot._ValidFrom);
            
            return Rally.util.DateTime.getDifference(state_date_in_js,creation_date_in_js,me.granularity);
        });
        
        var average = Ext.Array.mean(cycle_times);
        
        var series = [{name:'Average Response Time',data: [average]}];
        
        if ( me.chartType == "pie" ) {
            series = [{type:'pie', data: [['average',average]] }];
        }
        return {
            series: series
        }
    },
    
    _removeFutureSeries: function (chartData, seriesIndex, cutOffIndex ) { 
        
        if(chartData.series[seriesIndex].data.length > cutOffIndex && cutOffIndex > -1) {
            var idx = cutOffIndex;
            
            while(idx < chartData.series[seriesIndex].data.length) {
                chartData.series[seriesIndex].data[idx] = null;
                idx++;
            }
        }
    }
    
 });