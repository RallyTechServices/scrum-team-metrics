Ext.define("scrum-team-metrics", {
    extend: 'Rally.app.TimeboxScopedApp',
    scopeType: 'release',
    supportsUnscheduled: false,

    componentCls: 'app',
    logger: new Rally.technicalservices.Logger(),
    defaults: { margin: 10 },

    featureModelName: 'PortfolioItem/Feature',
    featureFields: ['ObjectID','FormattedID','Name','Release','State','DisplayColor'],
    dodStoryFields: ['ObjectID','FormattedID','Name','Feature','c_DoDStoryType'],
    completedState: "Done",

    initComponent: function() {
        this.callParent([]);
    },
    launch: function(){
        this.callParent();
    },
    onScopeChange: function(timeboxScope){
        this.setLoading(true);
        this._fetchReleases(timeboxScope).then({
            scope: this,
            success: function(releases){
                this.releases = releases;

                var calculator = Ext.create('Rally.technicalservices.calculator.FeatureSummary',{
                    timeboxScope: this.getContext().getTimeboxScope(),
                    context: this.getContext(),
                    releases: releases,
                    plannedDate: timeboxScope.getRecord().get('ReleaseStartDate'),
                    featureModelName: this.featureModelName,
                    completedState: this.completedState
                });
                calculator.calculate().then({
                    scope: this,
                    success: function(){
                        this.setLoading(false);
                        this._displayMetrics(calculator);
                    }
                });
            },
            failure: function(msg){
                Rally.ui.notify.Notifier.showError({message: msg});
            }
        });

    },
    _fetchReleases: function(timebox){
        this.logger.log('_fetchReleases Loading');

        var deferred = Ext.create('Deft.Deferred'),
            rec = timebox.getRecord(),
            me = this;

        if (rec == null) {
            deferred.resolve([]);
        }

        Ext.create('Rally.data.wsapi.Store',{
            model: 'Release',
            fetch: ['ObjectID'],
            filters: [{
                property: 'Name',
                value: rec.get('Name')
            },{
                property: 'ReleaseStartDate',
                value: rec.get('ReleaseStartDate')
            },{
                property: 'ReleaseDate',
                value: rec.get('ReleaseDate')
            }],
            limit: Infinity
        }).load({
            callback: function(records, operation, success){
                me.logger.log('_fetchReleases',success,records.length,operation);
                if (success){
                    deferred.resolve(records);
                }   else {
                    deferred.reject("Error loading Releases: " + operation.error.errors.join(','));
                }
            }
        });
        return deferred;
    },
    _displayMetrics: function(calculator){
        var ct = this.down('#display_box');
        if (ct){
            ct.destroy();
        } else {
            ct = this.add({
                xtype: 'container',
                itemId: 'display_box',
                width: '100%',
                layout:'vbox',
                items: [{
                    xtype: 'container',
                    itemId: 'ct-first-row',
                    layout: {type: 'hbox'},
                    bodyPadding: 20,
                    flex: 1,
                    border: false
                },{
                    xtype: 'container',
                    itemId: 'ct-second-row',
                    layout: {type: 'hbox'},
                    bodyPadding: 20,
                    flex: 1,
                    border: false
                }]
            });
        }

        this.logger.log('_displayMetrics')
        var top_row_ct = this.down('#ct-first-row'),
            top_chart_width = this.getWidth();

        this.logger.log('width', top_chart_width);
        var summary = top_row_ct.add({
            xtype: 'tsfeaturesummary',
            featureSummaryCalculator: calculator,
            title: "Feature Summary"
        });
        summary.setWidth(top_chart_width *.25);
        summary.setHeight(250);
        var delivered = top_row_ct.add({
            xtype: 'tsfeaturesdelivered',
            featureSummaryCalculator: calculator,
            title: 'Delivered'
        });
        delivered.setWidth(top_chart_width *.20);
        delivered.setHeight(250);


        var accepted = top_row_ct.add({
            xtype: 'tsstoriesaccepted',
            featureSummaryCalculator: calculator,
            title: 'Accepted'
        });
        accepted.setWidth(top_chart_width *.20);
        accepted.setHeight(250);


        var risk = top_row_ct.add({
            xtype: 'tsfeatureriskpie',
            itemId: 'feature-status',
            title: 'Feature Risk',
            featureSummaryCalculator: calculator,
            featureModelName: this.featureModelName,
            timeboxScope: this.getContext().getTimeboxScope()
        });
        risk.setWidth(top_chart_width *.25);
        risk.setHeight(250);

        var second_row_ct = this.down('#ct-second-row');
        var burnup_chart = second_row_ct.add({
            xtype: 'tsfeatureburnup',
            timeboxScope: this.getContext().getTimeboxScope(),
            context: this.getContext(),
            completedState: this.completedState,
            releases: this.releases,
            featureModelName: this.featureModelName,
            title: "Feature Burnup"
        });
        burnup_chart.setWidth(top_chart_width * .45);
        burnup_chart.setHeight(250);

        var pushed_chart = second_row_ct.add({
            xtype: 'tsfeaturespushed',
            featureSummaryCalculator: calculator,
            title: "Features pushed from Feature Target Sprints"
        });
        pushed_chart.setWidth(top_chart_width * .45);
        pushed_chart.setHeight(250);

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

    onSettingsUpdate: function (settings){
        this.logger.log('onSettingsUpdate',settings);
        Ext.apply(this, settings);
        this.launch();
    }
});
