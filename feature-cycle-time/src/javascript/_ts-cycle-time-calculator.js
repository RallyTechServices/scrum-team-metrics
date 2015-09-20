Ext.define("Rally.TechnicalServices.calculator.FeatureCycleTimeCalculator", {
    extend: "Rally.data.lookback.calculator.TimeInStateCalculator",

    config: {
        devStateNames: ['Dev','Test','Deploy', 'Develop', 'In-Flight'], // 'In-Scope' from old state values
        closedStateNames: ['Done','Operate'],
        chartType: 'column', /* column or pie */
        summaryType: 'Summary', // || 'Team'
        projectsByOID: {} // required for 'Team' summaryType
    },

    runCalculation: function (snapshots) {
        var me = this;
        
        var start_times_by_oid = {};
        
        this.startDate = this.startDate || this._getStartDate(snapshots);
        this.endDate = this.endDate || this._getEndDate(snapshots);
        
        var start_snaps = Ext.Array.filter(snapshots, function(snapshot){
            return ( Ext.Array.contains(me.devStateNames, snapshot.State ) );
        });
        
        Ext.Array.each( start_snaps, function(snapshot){
            var oid = snapshot.ObjectID;
            var start_date = snapshot._ValidFrom;
            var state = snapshot.State;
            if ( start_times_by_oid[oid] ) {
                if ( start_date < start_times_by_oid[oid] ) {
                    start_times_by_oid[oid] = start_date;
                }
            } else {
                start_times_by_oid[oid] = start_date;
            }
        });
        
        var final_snaps = Ext.Array.filter(snapshots, function(snapshot){
            return ( Ext.Array.contains(me.closedStateNames, snapshot.State) 
                 && snapshot._ValidTo == "9999-01-01T00:00:00.000Z" );
        });
        
        var snapshots_by_project = {};
        var cycle_times = [];
        
        Ext.Array.each(final_snaps,function(snapshot){
            var start_date = start_times_by_oid[snapshot.ObjectID];
            var creation_date_in_js = Rally.util.DateTime.fromIsoString(snapshot.CreationDate);
            
            var start_date_in_js = null;
            if ( Ext.isEmpty(start_date) ) {
                console.log("No start date, using creation date:", snapshot.FormattedID);
                start_date = snapshot.CreationDate;
                start_date_in_js = creation_date_in_js;
            } else {
                start_date_in_js = Rally.util.DateTime.fromIsoString(start_date);
            }
            
            snapshot.__start_date = start_date;
            
            var state_date_in_js = Rally.util.DateTime.fromIsoString(snapshot._ValidFrom);
            var project_key = snapshot.Project.Name;
            
            if ( ! snapshots_by_project[project_key] ) {
                snapshots_by_project[project_key] = [];
            }
            
            var time_difference = Rally.util.DateTime.getDifference(state_date_in_js,start_date_in_js,'hour');
            snapshot.__cycle = time_difference;
            console.log('--', snapshot.FormattedID, start_date, snapshot._ValidFrom, time_difference);
            
            cycle_times.push(time_difference);
            snapshots_by_project[project_key].push(snapshot);
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
            Ext.Object.each(snapshots_by_project, function(project_key, project_snapshots){
                if ( ! Ext.isEmpty(project_snapshots) ) {

                    var cycles = Ext.Array.pluck(project_snapshots,'__cycle');
                    var average = Ext.Array.mean(cycles);
                    if ( me.granularity == "day" ) {
                        average = average / 24;
                    }
                    series_data.push(average);
                    categories.push(project_key);
                }
            });
            series = [{
                name:'Average Cycle Time', 
                data:series_data,
                options: { series_snapshots: snapshots_by_project },
                point: { 
                    events: {
                        click: function(evt) {
                            me.onPointClick(evt,snapshots_by_project);
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