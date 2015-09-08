Ext.define("features-delivered", {
    extend: 'Rally.app.TimeboxScopedApp',
    scopeType: 'release',
    supportsUnscheduled: false,

    componentCls: 'app',
    autoScroll: false,
    logger: new Rally.technicalservices.Logger(),
    defaults: { margin: 10 },

    onScopeChange: function(timeboxScope){
        if (this.down('tsfeaturesdelivered')){
            this.down('tsfeaturesdelivered').destroy();
        }

        this.add({
            xtype: 'tsfeaturesdelivered',
            timeboxScope: timeboxScope,
            featureModelName: 'PortfolioItem/Feature',
            completedStates: ["Operate","Done"],
            width: this.getWidth() || 300,
            height: this.getHeight() || 300
        });
        this.logger.log('width, height', this.getWidth(), this.getHeight());
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
        this.about_dialog = Ext.create('Rally.technicalservices.InfoLink',{
            readmeUrl: "https://github.com/RallyTechServices/scrum-team-metrics/blob/master/features-delivered/README.md",
            codeUrl: "https://github.com/RallyTechServices/scrum-team-metrics/tree/master/features-delivered"
        });
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
