Ext.define("feature-burnup", {
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
        this.setLoading(true);

        this._fetchReleases(timeboxScope).then({
            scope: this,
            success: function(releases){
                this.releases = releases;
                this.logger.log('_fetchReleases Success', releases);
                this.setLoading(false);
                var burnup_chart = this.add({
                    xtype: 'tsfeatureburnup',
                    timeboxScope: this.getContext().getTimeboxScope(),
                    context: this.getContext(),
                    completedStates: this.completedStates,
                    releases: releases,
                    featureModelName: this.featureModelName
                });
                //burnup_chart.setWidth(this.width *.95);
                burnup_chart.setHeight(300);
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
