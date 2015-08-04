Ext.define('Rally.technicalservices.LookbackToolbox',{
    singleton: true,

    fetchLookbackSnapshotCount: function(find){
        var deferred = Ext.create('Deft.Deferred');

        Ext.create('Rally.data.lookback.SnapshotStore',{
            fetch: ['ObjectID'],
            find: find,
            limit: 1,
            pageSize: 1,
            removeUnauthorizedSnapshots: true
        }).load({
            callback: function(records, operation, success){
                console.log('getCount callback',success, records ,operation);
                if (success){
                    deferred.resolve(operation.resultSet.totalRecords);
                } else {
                    deferred.reject(Ext.String.format("Error running lookback query: {0}",  operation.error.errors.join(',')));
                }
            }
        });

        return deferred;
    },
    fetchLookbackRecords: function(find, fetch, hydrate, sort){
        var deferred = Ext.create('Deft.Deferred');

        fetch = fetch || ['ObjectID'];
        hydrate = hydrate || [];
        sort = sort || {_ValidFrom: 1};

        Ext.create('Rally.data.lookback.SnapshotStore',{
            fetch: fetch,
            find: find,
            hydrate: hydrate,
            limit: Infinity,
            sort: sort,
            removeUnauthorizedSnapshots: true
        }).load({
            callback: function(records, operation, success){
                console.log('fetchLookbackRecords callback',success, records ,operation);
                if (success){
                    deferred.resolve(records);
                } else {
                    deferred.reject(Ext.String.format("Error running lookback query: {0}",  operation.error.errors.join(',')));
                }
            }
        });
        return deferred;
    },
    fetchLookbackFieldTransitions: function(find, field, iso_start_date){

        var previous_values_field = "_PreviousValues." + field;

        find["_ValidFrom"] = {$gte: iso_start_date};
        find[previous_values_field] = {$exists: true};
        find[previous_values_field] = {$ne: null};

        var fetch = ['ObjectID', field, previous_values_field, "_ValidFrom","_SnapshotNumber"];

        return Rally.technicalservices.LookbackToolbox.fetchLookbackRecords(find,fetch);
    },
    fetchLookbackFieldTransitionsCount: function(find, field, iso_start_date){
        var deferred = Ext.create('Deft.Deferred');
        Rally.technicalservices.LookbackToolbox.fetchLookbackFieldTransitions(find, field, iso_start_date).then({
            success: function(snaps){
                var snaps_by_oid = Rally.technicalservices.LookbackToolbox.aggregateSnapsByOidForModel(snaps);
                deferred.resolve(_.keys(snaps_by_oid).length);
            },
            failure: function(msg){
                deferred.reject(msg);
            }
        });
        return deferred.promise;
    },
    fetchLookbackFieldTransitionIntoCount: function(find, field, iso_start_date, into_value){
        var deferred = Ext.create('Deft.Deferred');

        var previous_values_field = "_PreviousValues." + field;

        find["_ValidFrom"] = {$gte: iso_start_date};
        find[previous_values_field] = {$exists: true};
        if (into_value instanceof Array){
            find[field] = {$in: into_value};
        } else {
            find[field] = into_value;

        }
        var fetch = ['ObjectID', field, previous_values_field, "_ValidFrom","_SnapshotNumber"];

        Rally.technicalservices.LookbackToolbox.fetchLookbackFieldTransitions(find, field, iso_start_date).then({
            success: function(snaps){
                var snaps_by_oid = Rally.technicalservices.LookbackToolbox.aggregateSnapsByOidForModel(snaps);

                //TODO if into_value is an array,  verify that the previous values is not in that array.

                deferred.resolve(_.keys(snaps_by_oid).length);
            },
            failure: function(msg){
                deferred.reject(msg);
            }
        });
        return deferred.promise;
    },
    fetchLookbackFieldTransitionOutOfCount: function(find, field, iso_start_date, out_of_value){
        var deferred = Ext.create('Deft.Deferred');

        var previous_values_field = "_PreviousValues." + field;

        find["_ValidFrom"] = {$gte: iso_start_date};
        if (out_of_value instanceof Array){
            find[previous_values_field] = {$in: out_of_value};
        } else {
            find[previous_values_field] = out_of_value;
        }


        var fetch = ['ObjectID', field, previous_values_field, "_ValidFrom","_SnapshotNumber"];

        Rally.technicalservices.LookbackToolbox.fetchLookbackFieldTransitions(find, field, iso_start_date).then({
            success: function(snaps){
                var snaps_by_oid = Rally.technicalservices.LookbackToolbox.aggregateSnapsByOidForModel(snaps);
                deferred.resolve(_.keys(snaps_by_oid).length);
            },
            failure: function(msg){
                deferred.reject(msg);
            }
        });
        return deferred.promise;
    },
    aggregateSnapsByOidForModel: function(snaps){
        //Return a hash of objects (key=ObjectID) with all snapshots for the object
        var snaps_by_oid = {};
        Ext.each(snaps, function(snap){
            var oid = snap.ObjectID || snap.get('ObjectID');
            if (snaps_by_oid[oid] == undefined){
                snaps_by_oid[oid] = [];
            }
            snaps_by_oid[oid].push(snap.getData());

        });
        return snaps_by_oid;
    },
    aggregateSnapsByOid: function(snaps){
        //Return a hash of objects (key=ObjectID) with all snapshots for the object
        var snaps_by_oid = {};
        Ext.each(snaps, function(snap){
            var oid = snap.ObjectID;
            if (snaps_by_oid[oid] == undefined){
                snaps_by_oid[oid] = [];
            }
            snaps_by_oid[oid].push(snap);
        });
        return snaps_by_oid;
    }
});

