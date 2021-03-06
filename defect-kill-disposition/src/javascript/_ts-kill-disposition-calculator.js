 Ext.define("Rally.TechnicalServices.calculator.DefectKillDispositionCalculator", {
     extend: "Rally.data.lookback.calculator.TimeSeriesCalculator",

     config: {
        closedStateNames: ['Fixed','Closed','Junked','Duplicate'],
        productionDefects: [],
        allDefects: [],
        showOnlyProduction: false
     },
     
    getDerivedFieldsOnInput: function () {
        var me = this;
        var killed_states = this.config.closedStateNames;
        var production_defect_oids = Ext.Array.map(this.config.productionDefects,function(d){
            return d.get('ObjectID')
        });
        
        var derived_fields = [];
        if ( me.config.showOnlyProduction) {
            
            derived_fields = Ext.Array.map(killed_states, function(state){
                return {
                    'as': state,
                    'f' : function(snapshot) {
                       
                        return (
                            snapshot.State == state
                            && Ext.Array.contains(production_defect_oids,snapshot.ObjectID)
                            && snapshot.CreationDate >= Rally.util.DateTime.toIsoString(me.config.startDate)
                        );
                    }
                }
            });
        } else {
            derived_fields = Ext.Array.map(killed_states, function(state){
                return {
                    'as': state,
                    'f' : function(snapshot) {
                        return (
                            snapshot.State == state
                            && snapshot.CreationDate >= Rally.util.DateTime.toIsoString(me.config.startDate)
                        );
                    }
                }
            });
        }
        return derived_fields;
    },
     
    getMetrics: function () {
        var me = this;
        var killed_states = this.config.closedStateNames;
        
        var metrics = Ext.Array.map(killed_states, function(state){
            return {
                'filterField': state,
                'as': state,
                'f': 'filteredCount',
                'filterValues':[true],
                'display': 'area'
            }
        });
        
        return metrics
    },

    runCalculation: function (snapshots) {
        var chartData = this.callParent(arguments);
        var today = Rally.util.DateTime.add(new Date(),"day",1); //include today
        Ext.Array.each(chartData.series,function(series,idx){
            this._removeFutureSeries(chartData, idx, this._indexOfDate(chartData,today,true));
        },this);

        console.log('chartData',chartData);
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