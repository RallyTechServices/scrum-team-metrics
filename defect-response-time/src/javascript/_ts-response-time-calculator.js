Ext.define("Rally.TechnicalServices.calculator.DefectResponseTimeCalculator", {
    extend: "Rally.data.lookback.calculator.TimeInStateCalculator",

    config: {
        closedStateNames: ['Fixed','Closed','Junked','Duplicate'],
        productionDefects: [],
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
            
            return (
                snapshot.CreationDate >= Rally.util.DateTime.toIsoString(me.config.startDate)
                && Ext.Array.contains(production_defect_oids,snapshot.ObjectID)
            );
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
        
        console.log('closed states:', me.closedStateNames, snapshots.length);
        
        this.startDate = this.startDate || this._getStartDate(snapshots);
        this.endDate = this.endDate || this._getEndDate(snapshots);
            
        var final_snaps = Ext.Array.filter(snapshots, function(snapshot){
            return ( me._isResolved(snapshot)  && snapshot._ValidTo == "9999-01-01T00:00:00.000Z" );
        });
        
        var cycle_times_by_project = {};
        var cycle_times = [];
        
        Ext.Array.each(final_snaps,function(snapshot){
            var creation_date_in_js = Rally.util.DateTime.fromIsoString(snapshot.CreationDate);
            var state_date_in_js =    Rally.util.DateTime.fromIsoString(snapshot._ValidFrom);
            var project_oid = snapshot.Project;
            
            if ( ! cycle_times_by_project[project_oid] ) {
                cycle_times_by_project[project_oid] = [];
            }
            
            var time_difference = Rally.util.DateTime.getDifference(state_date_in_js,creation_date_in_js,'hour');
            cycle_times.push(time_difference);
            
            if ( project_oid == 20104652093 ) {
                console.log(snapshot.ObjectID, creation_date_in_js,state_date_in_js,time_difference);
            }
            snapshot.__cycle = time_difference;
            cycle_times_by_project[project_oid].push({ cycle: time_difference, snapshot: snapshot});
        });

        var series = [];
        var categories = [];
        
        if ( me.summaryType == "Summary" ) { 
            var average = Ext.Array.mean(cycle_times);
            
            if ( me.granularity == "day" ) {
                average = average / 24;
            }
            series = [{name:'Average Response Time',data: [average]}];
            
            if ( me.chartType == "pie" ) {
                series = [{type:'pie', data: [['average',average]] }];
            }
        } else {
            var series_data = [];
            var series_snapshots = {};
            
            Ext.Object.each(me.projectsByOID, function(project_oid, project_name){
                if ( ! Ext.isEmpty(cycle_times_by_project[project_oid]) ) {
                    var cycles = Ext.Array.pluck(cycle_times_by_project[project_oid],'cycle');
                    var average = Ext.Array.mean(cycles);
                    if ( me.granularity == "day" ) {
                        average = average / 24;
                    }
                    
                    series_data.push(average);
                    
                    series_snapshots[project_name] = Ext.Array.pluck(cycle_times_by_project[project_oid],'snapshot');
                    
                    categories.push(project_name);
                }
            });
            
            series = [{
                name:'Average Resolution Time', 
                data:series_data,
                options: { series_snapshots:series_snapshots },
                point: { 
                    events: {
                        click: function(evt) {
                            me.onPointClick(evt,series_snapshots);
                        }
                    }
                }
            }];
        }
        
        return {
            categories: categories,
            series: series
        }
    },
    
    onPointClick: function(evt) {
        // override with configuration setting
    }
    
 });