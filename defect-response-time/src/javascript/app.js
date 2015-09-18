Ext.define("TSDefectResponseTime", {
    extend: 'Rally.app.TimeboxScopedApp',
    scopeType: 'release',
    supportsUnscheduled: false,
    
    componentCls: 'app',
    logger: new Rally.technicalservices.Logger(),
    defaults: { margin: 10 },
    config: {
        defaultSettings: {
            showOnlyProduction:  true,
            closedStateNames: ['Fixed']
        }
    },

    summaryType: 'Team',

    layout: { type:'vbox'},
    
    timeboxScope: null,

    onScopeChange: function(timeboxScope){
        
        this.timeboxScope = timeboxScope;
        
        if (!this.down('rallybutton')){
            var container = this.add({xtype:'container', layout: { type:'hbox'}, width: this.getWidth() - 25 });
            
            container.add({
                xtype: 'rallybutton',
                text: '< Back to Summary',
                cls: 'secondary rly-small',
                listeners: {
                    scope: this,
                    click: this._updateView
                }
            });
            
            container.add({xtype:'container', flex: 1});
            
            container.add({xtype:'container', itemId: 'state_box', tpl:"<tpl>Resolved States: {closedStates}</tpl>" });
        }
        
        if (this.down('tsdefectresponsetime')){
            this.down('tsdefectresponsetime').updateTimebox(this.timeboxScope);
        } else {
            this._createChart();
        }

    },
    
    // expect type to be 'Summary' or 'Team'
    _createChart: function() {
        if (this.down('tsdefectresponsetime')){
            this.down('tsdefectresponsetime').destroy();
        }
        
        if ( !Ext.isArray(this.getSetting('closedStateNames') ) ) {
            var settings = this.getSettings();
            settings.closedStateNames = this.getSetting('closedStateNames').split(',');
            this.setSettings(settings);
        }

        this.down('#state_box').update({closedStates: this.getSetting('closedStateNames').join(',')});

        
        this.add({
            xtype: 'tsdefectresponsetime',
            timeboxScope: this.timeboxScope,
            context: this.getContext(),
            closedStateNames: this.getSetting('closedStateNames'),
            showOnlyProduction: this.getSetting('showOnlyProduction'),
            summaryType: this.summaryType,
            width: this.getWidth() - 25
        });
    },
    
    getSettingsFields: function() {
        return [
            {
                name: 'showOnlyProduction',
                xtype: 'rallycheckboxfield',
                boxLabelAlign: 'after',
                fieldLabel: '',
                margin: '0 0 25 20',
                boxLabel: 'Show Production Only<br/><span style="color:#999999;"><i>Tick to show only defects associated with an incident</i></span>'
            },
            {
                name: 'closedStateNames',
                xtype: 'multistatecombo',
                labelWidth: 100,
                width: 500,
                margin: '0 0 25 10',
                fieldLabel: 'Resolved States',
                readyEvent: 'ready'
            }
        ];
    },
    
    _updateView: function(btn){
        if (btn.text == 'Team View'){
            btn.setText("< Back to Summary");
            this.summaryType = 'Team';
            this._createChart();
        } else {
            btn.setText("Team View");
            this.summaryType = 'Summary';
            this._createChart();
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
            readmeUrl: "https://github.com/RallyTechServices/scrum-team-metrics/blob/master/defect-response-time/README.md",
            codeUrl: "https://github.com/RallyTechServices/scrum-team-metrics/tree/master/defect-response-time"
        });
    },
    
    isExternal: function(){
        return typeof(this.getAppId()) == 'undefined';
    },
    
    //onSettingsUpdate:  Override
    onSettingsUpdate: function (settings){
        this.logger.log('onSettingsUpdate',settings);
        Ext.apply(this, settings);
        this._createChart();
    }
});
