Ext.define("state-pie", {
    extend: 'Rally.app.TimeboxScopedApp',
    scopeType: 'release',
    supportsUnscheduled: false,

    componentCls: 'app',
    autoScroll: false,
    logger: new Rally.technicalservices.Logger(),
    defaults: { margin: 10 },

    config: {
        defaultSettings: {
            modelName: 'HierarchicalRequirement',
            dropdownField: 'ScheduleState',
            artifactDisplayName: 'User Stories'
        }
    },
    componentName: 'tsdropdownpie',

    onScopeChange: function(timeboxScope){
        if (this.down(this.componentName)){
            this.down(this.componentName).destroy();
        }
        this.logger.log('onScopeChange', this.getSetting('modelName'), this.getSetting('dropdownField'));

        var cmp_cfg = {
            xtype: this.componentName,
            timeboxScope: timeboxScope,
            width: this.getWidth() || 300,
            height: this.getHeight() || 300,
            pieField: this.getSetting('dropdownField'),
            modelName: this.getSetting('modelName'),
            artifactDisplayName: this.getSetting('artifactDisplayName')
        };

        this.add(cmp_cfg);
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
            readmeUrl: "https://github.com/RallyTechServices/scrum-team-metrics/blob/master/state-pie/README.md",
            codeUrl: "https://github.com/RallyTechServices/scrum-team-metrics/tree/master/state-pie"
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
