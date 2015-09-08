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
    
    layout: { type:'vbox'},
    
    timeboxScope: null,

    onScopeChange: function(timeboxScope){

        this.timeboxScope = timeboxScope;
        
        if (this.down('rallybutton')){
            this.down('rallybutton').destroy();
        }

        this.add({
            xtype: 'rallybutton',
            text: 'Team View',
            cls: 'secondary rly-small',
            listeners: {
                scope: this,
                click: this._updateView
            }
        });
        
        this._createChart('Summary');

    },
    
    // expect type to be 'Summary' or 'Team'
    _createChart: function(summary_type) {
        if (this.down('tsdefectresolutiontrendchart')){
            this.down('tsdefectresolutiontrendchart').destroy();
        }
        
        this.add({
            xtype: 'tsdefectresolutiontrendchart',
            timeboxScope: this.timeboxScope,
            context: this.getContext(),
            showOnlyProduction: this.showOnlyProduction,
            summaryType: summary_type
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
