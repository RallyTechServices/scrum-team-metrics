/*
 * create a form field thing.  
 */

Ext.define('Rally.technicalservices.MultiStateComboBox',{
    alias: 'widget.multistatecombo',
    extend: 'Ext.form.FieldContainer',

    mixins: {
        field: 'Ext.form.field.Field'
    },
    
    cls: 'multistate',
    
    config: {
        /**
         * @cfg {String}
         * The label for the field to be passed through to the combobox
         */
        fieldLabel: '',
        
        value: undefined
    },
    initComponent: function() {
        this.callParent(arguments);

        this.mixins.field.initField.call(this);
        
        var me = this;
        this.add([{
            xtype: 'rallycombobox',
            name: 'statefield',
            plugins: ['rallyfieldvalidationui'],
            multiSelect: true,
            emptyText: 'Choose...',
            displayField: 'name',
            valueField: 'value',
            width: this.width,
            editable: false,
            submitValue: false,
            storeType: 'Ext.data.Store',
            storeConfig: {
                remoteFilter: false,
                fields: ['name', 'value'],
                data: []
            },
            listeners: { 
                'change': function(cb,new_value, old_value){
                    me.state_value = new_value;
                }
            }
        }]);
        
        this._loadStates();
    },
    
    _loadStates: function() {
        Rally.technicalservices.WsapiToolbox.fetchAllowedValues("Defect","State").then({
            scope: this,
            success: function(state_names) {
                
                var states = Ext.Array.map(state_names,function(state_name){
                    return { 'name': state_name, 'value': state_name }
                });
                
                var combobox = this.down('rallycombobox');
                combobox.getStore().loadData(states);

                var current_values = this.getValue();
                console.log('current values:', current_values);
                
                if ( !Ext.isArray(current_values) ) {
                    current_values = current_values.split(',');
                }
                combobox.setValue(current_values);
                this.fireEvent('ready',this);
                
            },
            failure: function(msg) { 
                Ext.Msg.alert('Problem Retrieving States', msg);
            }
        });
    },
    
    getSubmitData: function() {
        var data = {};
        data[this.name] = this.state_value;
        return data;
    }
});