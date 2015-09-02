Ext.define('Rally.technicalservices.MungingToolbox', {
    singleton: true,
    getPieSeriesData: function(records, pie_field){
        var pie_hash = Rally.technicalservices.MungingToolbox.getCountByField(records, pie_field),
            data = [];

        var keys = _.keys(pie_hash);
        keys = Ext.Array.sort(keys);

        _.each(keys, function(key){
            data.push({
                name: key,
                y: pie_hash[key] || 0
            });
        });
        return data;

    },
    getCountByField: function(records, field){
        var hash = {};

        _.each(records, function(r){
            var val = r.get(field);
            if (val){
                if (hash[val] == undefined){
                    hash[val] = 0;
                }
                hash[val] ++;
            }
        });
        return hash;
    }
});
