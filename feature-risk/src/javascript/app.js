Ext.define("feature-risk", {
    extend: 'Rally.app.TimeboxScopedApp',
    scopeType: 'release',
    supportsUnscheduled: false,

    componentCls: 'app',
    autoScroll: false,
    logger: new Rally.technicalservices.Logger(),
    defaults: { margin: 10 },

    onScopeChange: function(timeboxScope){
        if (this.down('tsfeatureriskpie')){
            this.down('tsfeatureriskpie').destroy();
        }

        this.add({
            xtype: 'tsfeatureriskpie',
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
            readmeUrl: "https://github.com/RallyTechServices/scrum-team-metrics/blob/master/feature-risk/README.md",
            codeUrl: "https://github.com/RallyTechServices/scrum-team-metrics/tree/master/feature-risk"
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
