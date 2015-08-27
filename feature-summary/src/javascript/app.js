Ext.define("feature-summary", {
    extend: 'Rally.app.TimeboxScopedApp',
    scopeType: 'release',
    supportsUnscheduled: false,
    autoScroll: false,
    componentCls: 'app',
    logger: new Rally.technicalservices.Logger(),
    defaults: { margin: 10 },

    completedStates: ["Operate","Done"],
    featureModelName: "PortfolioItem/Feature",

    onScopeChange: function(timeboxScope){

        if (this.down('#display_box')){
            this.down('#display_box').destroy();
        }
        this.add({
            xtype: 'container',
            itemId: 'display_box',
            width: '100%',
            layout:'vbox'
        });

        this.setLoading(true);
        Rally.technicalservices.WsapiToolbox.fetchReleases(timeboxScope).then({
            scope: this,
            success: function(releases){
                this.releases = releases;

                var calculator = Ext.create('Rally.technicalservices.calculator.FeatureSummary',{
                    timeboxScope: this.getContext().getTimeboxScope(),
                    context: this.getContext(),
                    releases: releases,
                    plannedDate: timeboxScope.getRecord().get('ReleaseStartDate'),
                    featureModelName: this.featureModelName,
                    completedStates: this.completedStates
                });
                calculator.calculate().then({
                    scope: this,
                    success: function(){
                        this.setLoading(false);
                        this.calculator = calculator;


                        this.down('#display_box').add({
                            xtype: 'rallybutton',
                            text: 'Team View',
                            cls: 'secondary rly-small',
                            listeners: {
                                scope: this,
                                click: this._updateView
                            }
                        });
                        this._showSummaryView(calculator);

                    }
                });
            },
            failure: function(msg){
                Rally.ui.notify.Notifier.showError({message: msg});
            }
        });

    },
    _updateView: function(btn){
        if (btn.text == 'Team View'){
            btn.setText("< Back to Summary");
            this._showTeamView(this.calculator);
        } else {
            btn.setText("Team View");
            this._showSummaryView(this.calculator);
        }
    },
    _showTeamView: function(calculator){
        var chart_width = this.getWidth();
        this.logger.log('width', chart_width);
        if (this.down('tsfeaturesummarybyteam')){
            this.down('tsfeaturesummarybyteam').destroy();
        }
        if (this.down('tsfeaturesummary')){
            this.down('tsfeaturesummary').destroy();
        }
        var summary = this.down('#display_box').add({
            xtype: 'tsfeaturesummarybyteam',
            padding: 15,
            featureSummaryCalculator: calculator
        });
        summary.setWidth(chart_width *.95);
        summary.setHeight(300);
    },
    _showSummaryView: function(calculator){
        var chart_width = this.getWidth();
        this.logger.log('width', chart_width);
        if (this.down('tsfeaturesummary')){
            this.down('tsfeaturesummary').destroy();
        }
        if (this.down('tsfeaturesummarybyteam')){
            this.down('tsfeaturesummarybyteam').destroy();
        }
        var summary = this.down('#display_box').add({
            xtype: 'tsfeaturesummary',
            padding: 15,
            featureSummaryCalculator: calculator
        });
        summary.setWidth(chart_width *.95);
        summary.setHeight(300);
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
