Ext.define('Rally.technicalservices.chart.FeatureValidation', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.tsfeaturevalidation',
    width: '95%',

    config: {

    },

    constructor: function (config) {
        this.mergeConfig(config);
        this.callParent([this.config]);
    }
});
