Ext.define("TSFeatureCycleTime", {
    extend: 'Rally.app.TimeboxScopedApp',
    scopeType: 'release',
    supportsUnscheduled: false,
    
    componentCls: 'app',
    logger: new Rally.technicalservices.Logger(),
    defaults: { margin: 10 },
    config: {
        defaultSettings: {
            showOnlyProduction:  false
        }
    },
    
    layout: { type:'vbox'},
    
    timeboxScope: null,

    onScopeChange: function(timeboxScope){
        
        this.timeboxScope = timeboxScope;
        
        if (!this.down('rallybutton')){
            this.add({
                xtype: 'rallybutton',
                text: 'Team View',
                cls: 'secondary rly-small',
                listeners: {
                    scope: this,
                    click: this._updateView
                }
            });
        }
        
        if (this.down('tsfeaturecycletime')){
            this.down('tsfeaturecycletime').updateTimebox(this.timeboxScope);
        } else {
            this._createChart('Summary');
        }

    },
    
    // expect type to be 'Summary' or 'Team'
    _createChart: function(summary_type) {
        if (this.down('tsfeaturecycletime')){
            this.down('tsfeaturecycletime').destroy();
        }
        
        this.logger.log('width', this.width, this.getWidth());
        
        this.add({
            xtype: 'tsfeaturecycletime',
            timeboxScope: this.timeboxScope,
            context: this.getContext(),
            summaryType: summary_type,
            width: this.getWidth() - 25
        });
    },
    
    _updateView: function(btn){
        if (btn.text == 'Team View'){
            btn.setText("< Back to Summary");
            this._createChart('Team');
        } else {
            btn.setText("Team View");
            this._createChart('Summary');
        }
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
            readmeUrl: "https://github.com/RallyTechServices/scrum-team-metrics/blob/master/feature-cycle-time/README.md",
            codeUrl: "https://github.com/RallyTechServices/scrum-team-metrics/tree/master/feature-cycle-time"
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
