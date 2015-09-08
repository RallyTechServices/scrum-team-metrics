Ext.define("TSArrivalKill", {
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

    onScopeChange: function(timeboxScope){
        if (this.down('tsdefectresolutiontrendchart')){
            this.down('tsdefectresolutiontrendchart').destroy();
        }

        this.add({
            xtype: 'tsdefectresolutiontrendchart',
            timeboxScope: timeboxScope,
            context: this.getContext(),
            showOnlyProduction: this.showOnlyProduction
        });

    },
    
    getSettingsFields: function() {
        return [
            {
                name: 'showOnlyProduction',
                xtype: 'rallycheckboxfield',
                boxLabelAlign: 'after',
                fieldLabel: '',
                margin: '0 0 25 200',
                boxLabel: 'Show Production Only<br/><span style="color:#999999;"><i>Tick to show only defects associated with an incident</i></span>'
            }
        ];
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
