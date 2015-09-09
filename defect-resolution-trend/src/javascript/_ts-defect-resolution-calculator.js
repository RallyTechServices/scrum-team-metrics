Ext.define("Rally.TechnicalServices.calculator.DefectResolutionTrendCalculator", {
    extend: "Rally.data.lookback.calculator.TimeSeriesCalculator",

    config: {
        closedStateNames: ['Fixed','Closed','Junked','Duplicate'],
        productionDefects: [],
        allDefects: [],
        showOnlyProduction: false,
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
    
    getDerivedFieldsOnInput: function () {
        var me = this;

        var derived_fields = [];
        
        if ( me.summaryType == "Summary" ) { 
            Ext.Array.push(derived_fields, [
                {
                    'as': 'CreatedAfterStart',
                    'f' : function(snapshot) {
                        if ( me._isCreatedAfterStart(snapshot) ) { 
                            return 1;
                        }
                        return 0;
                    }
                },
                {
                    'as': 'Resolved',
                    'f' : function(snapshot) {
                        if ( me._isResolved(snapshot) ) {
                            return 1;
                        }
                        return 0;
                    }
                },
                {
                    'as': 'Trend',
                    'f' : function(snapshot) {
                        return snapshot.CreatedAfterStart - snapshot.Resolved;
                    }
                }
            ]);
        } else {
            Ext.Object.each(me.projectsByOID, function(project_oid, project_name){
                Ext.Array.push(derived_fields, [
                    {
                        'as': 'CreatedAfterStart-' + project_oid,
                        'f' : function(snapshot) {
                            if ( me._isCreatedAfterStart(snapshot) && snapshot.Project == project_oid) { 
                                return 1;
                            }
                            return 0;
                        }
                    },
                    {
                        'as': 'Resolved-' + project_oid,
                        'f' : function(snapshot) {
                            if ( me._isResolved(snapshot) && snapshot.Project == project_oid) {
                                return 1;
                            }
                            return 0;
                        }
                    },
                    {
                        'as': project_oid,
                        'f' : function(snapshot) {
                            return snapshot['CreatedAfterStart-'+project_oid] - snapshot['Resolved-'+project_oid];
                        }
                    }
                ]);
            });
        }
        
        return derived_fields;
    },
     
    getMetrics: function () {
        var me = this;
        var metrics = [];

        if ( me.summaryType == "Summary" ) { 
            metrics = [
                {
                    "field": "CreatedAfterStart",
                    'as':'Created',
                    'f':'sum'
                },
                {
                    'field': "Resolved",
                    'as':'Resolved',
                    'f':'sum'
                },
                {
                    'field':'Trend',
                    'as':'Trend (Created - Resolved)',
                    'f':'sum'
                }
            ];
        } else {
            Ext.Object.each(me.projectsByOID, function(project_oid, project_name){

                metrics.push({
                    'field':project_oid,
                    'as':project_name,
                    'f':'sum'
                });
            });
        }

        return metrics;
    },
    
    runCalculation: function (snapshots) {
        var chartData = this.callParent(arguments);
        var today = Rally.util.DateTime.add(new Date(),"day",1); //include today
        Ext.Array.each(chartData.series,function(series,idx){
            this._removeFutureSeries(chartData, idx, this._indexOfDate(chartData,today,true));
        },this);

        return chartData;
    },

    _indexOfDate: function(chartData, date, find_next_day_if_missing ) {
         var dateStr = Ext.Date.format(date, 'Y-m-d');
         var categories = chartData.categories;
         
         var idx = Ext.Array.indexOf(categories,dateStr);
         if ( idx > -1 ) {
            return idx;
         }
         if ( find_next_day_if_missing ) {
            var test_idx = categories.length - 1;
            while ( test_idx > -1 ) {
                if (categories[test_idx] > dateStr ) {
                    break;
                }
                test_idx = test_idx - 1;
            }
            return test_idx;
         }
         return -1;
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