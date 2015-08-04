Ext.define('Rally.technicalservices.WsapiToolbox',{
    singleton: true,
    fetchWsapiCount: function(model, query_filters){
        var deferred = Ext.create('Deft.Deferred');

        var store = Ext.create('Rally.data.wsapi.Store',{
            model: model,
            fetch: ['ObjectID'],
            filters: query_filters,
            limit: 1,
            pageSize: 1
        }).load({
            callback: function(records, operation, success){
                console.log('getCount callback',query_filters.toString(),operation);
                if (success){
                    deferred.resolve(operation.resultSet.totalRecords);
                } else {
                    deferred.reject(Ext.String.format("Error getting {0} count for {1}: {2}", model, query_filters.toString(), operation.error.errors.join(',')));
                }
            }
        });
        return deferred;
    },
    fetchWsapiRecords: function(model, query_filters, fetch_fields){
        var deferred = Ext.create('Deft.Deferred');

        var store = Ext.create('Rally.data.wsapi.Store',{
            model: model,
            fetch: fetch_fields,
            filters: query_filters,
            limit: Infinity
        }).load({
            callback: function(records, operation, success){
                console.log('getCount callback',query_filters.toString(),operation);
                if (success){
                    deferred.resolve(records);
                } else {
                    deferred.reject(Ext.String.format("Error getting {0} for {1}: {2}", model, query_filters.toString(), operation.error.errors.join(',')));
                }
            }
        });
        return deferred;
    }
});
