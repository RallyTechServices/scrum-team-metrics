Ext.define("risk-overview", {
    extend: 'Rally.app.TimeboxScopedApp',
    scopeType: 'release',
    supportsUnscheduled: false,

    componentCls: 'app',
    autoScroll: false,
    logger: new Rally.technicalservices.Logger(),
    defaults: { margin: 10 },

    onScopeChange: function(timeboxScope){
        if (this.down('tsriskpie')){
            this.down('tsriskpie').destroy();
        }

        this.add({
            xtype: 'tsriskpie',
            timeboxScope: timeboxScope,
            width: this.getWidth() || 300,
            height: this.getHeight() || 300,
            benchmarkDate: new Date('9/30/2015')
        });
    },
    getOptions: function() {
        return [
            {
                text: 'About...',
                handler: this._launchInfo,
                scope: this
            }
        ];
    },

    _launchInfo: function() {
        if ( this.about_dialog ) { this.about_dialog.destroy(); }
        this.about_dialog = Ext.create('Rally.technicalservices.InfoLink',{});
    },

    isExternal: function(){
        return typeof(this.getAppId()) == 'undefined';
    },

    //onSettingsUpdate:  Override
    onSettingsUpdate: function (settings){
        this.logger.log('onSettingsUpdate',settings);
        Ext.apply(this, settings);
        this.launch();
    }
});
