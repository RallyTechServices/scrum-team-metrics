/**
 * A link that pops up a version dialog box
 */

Ext.define('Rally.technicalservices.InfoLink',{
    extend: 'Rally.ui.dialog.Dialog',
    alias: 'widget.tsinfolink',
    
    /**
     * @cfg {String} informationHtml
     * Additional text to be displayed on the popup dialog (for exmaple,
     * to add a description of the app's use or functionality)
     */
    informationHtml: null,
    readmeUrl: null,
    codeUrl: null,

    /**
     * 
     * cfg {String} title
     * The title for the dialog box
     */
    title: "Build Information",
    
    defaults: { padding: 5, margin: 5 },

    closable: true,
     
    draggable: true,

    autoShow: true,
   
    width: 350, 
    
    initComponent: function() {
        var id = Ext.id(this);
        this.title =  "<span class='icon-help'> </span>" + this.title;
        this.callParent(arguments);
    },
    
    _generateChecksum: function(string){
        var chk = 0x12345678,
            i;
        string = string.replace(/var CHECKSUM = .*;/,"");
        string = string.replace(/\s/g,"");  //Remove all whitespace from the string.
        
        for (i = 0; i < string.length; i++) {
            chk += (string.charCodeAt(i) * i);
        }
        return chk;
    },
    
    _checkChecksum: function(container) {
        var deferred = Ext.create('Deft.Deferred');
        console.log("_checkChecksum", container);
        var me = this;
        
        Ext.Ajax.request({
            url: document.URL,
            params: {
                id: 1
            },
            success: function (response) {
                text = response.responseText;
                if ( CHECKSUM ) {
                    if ( CHECKSUM !== me._generateChecksum(text) ) {
                        deferred.resolve(false);
                        return;
                    }
                }
                deferred.resolve(true);
            }
        });
        
        return deferred.promise;
    },
    
    afterRender: function() {
        var app = Rally.getApp();
        
        if (! app.isExternal() ) {
                
            this._checkChecksum(app).then({
                scope: this,
                success: function(result){
                    if ( !result ) {
                        this.addDocked({
                            xtype:'container',
                            cls: 'build-info',
                            padding: 2,
                            html:'<span class="icon-warning"> </span>Checksums do not match'
                        });
                    }
                }
            });
        } else {
            this.addDocked({
                xtype:'container',
                cls: 'build-info',
                padding: 2,
                html:'... Running externally'
            });
        }
        this.callParent(arguments);
    },

    _getInformationalHtml: function(){
        var html = '';

        if (this.informationHtml){
            html += this.informationHtml + '<br/><br/>';
        }

        if (this.readmeUrl){
            html += Ext.String.format("For details about the data in this app, please refer to the <a href=\"{0}\" target=\"_blank\">README file</a>.<br/><br/>", this.readmeUrl);
        }

        if (this.codeUrl){
            html += Ext.String.format("Get the code <a href=\"{0}\" target=\"_blank\">here.</a><br/><br/>", this.codeUrl);
        }
        return html;
    },
    beforeRender: function() {
        var me = this,
            informational_html = this._getInformationalHtml();
        this.callParent(arguments);

        if (informational_html && informational_html.length > 0) {
            this.addDocked({
                xtype: 'component',
                componentCls: 'intro-panel',
                padding: 2,
                html: informational_html
            });
        }

        this.addDocked({
            xtype:'container',
            cls: 'build-info',
            padding: 2,
            html:"This app was created by the Rally Technical Services Team."
        });

        if ( APP_BUILD_DATE ) {
            this.addDocked({
                xtype:'container',
                cls: 'build-info',
                padding: 2,
                html:'Build date/time: ' + APP_BUILD_DATE
            });
        }
    }
});
