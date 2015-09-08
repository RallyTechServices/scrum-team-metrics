Ext.define("features-pushed", {
        extend: 'Rally.app.TimeboxScopedApp',
        scopeType: 'release',
        supportsUnscheduled: false,

        componentCls: 'app',
        autoScroll: false,
        logger: new Rally.technicalservices.Logger(),
        defaults: { margin: 10 },

        onScopeChange: function(timeboxScope){
            if (this.down('tsfeaturespushed')){
                this.down('tsfeaturespushed').destroy();
            }

            this.setLoading(true);
            this._fetchReleases(timeboxScope).then({
                scope: this,
                success: function(releases){
                    this.setLoading(false);
                    this.add({
                        xtype: 'tsfeaturespushed',
                        timeboxScope: timeboxScope,
                        featureModelName: 'PortfolioItem/Feature',
                        releases: releases,
                        context: this.getContext(),
                        width: this.getWidth() || 300,
                        height: this.getHeight() || 300
                    });
                    this.logger.log('width, height', this.getWidth(), this.getHeight());

                },
                failure: function(msg){
                    this.setLoading(false);
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
            this.about_dialog = Ext.create('Rally.technicalservices.InfoLink',{
                readmeUrl: "https://github.com/RallyTechServices/scrum-team-metrics/blob/master/features-pushed/README.md",
                codeUrl: "https://github.com/RallyTechServices/scrum-team-metrics/tree/master/features-pushed"
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