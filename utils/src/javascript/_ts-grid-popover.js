Ext.define('Rally.technicalservices.DataPopover', {
    alias: 'widget.tsdatapopover',
    extend: 'Rally.ui.dialog.Dialog',

    id: 'grid-popover',
    cls: 'grid-popover',

    width: 750,
    maxHeight: 300,

    layout: 'fit',

    autoShow: true,
    componentCls: 'rly-popover dark-container',
    header: true,
    preventFocusOnActivate: true,
    shouldHidePopoverOnBodyClick: false,
    shouldHidePopoverOnIframeClick: false,
    autoCenter: false,
    closable: true,
    shadow: false,

    /**
     * @cfg {Ext.Element} target (Required)
     * The default element that the popover should be aligned to when positioned
     */
    target: undefined,

    /**
     * @cfg {String} targetSelector
     * The selector for target to protect in the case of the target being removed from the dom i.e. grid refresh
     */
    targetSelector: undefined,

    /**
     * @cfg {String} targetTriggeredCls
     * The class to add to the target when the popover is being displayed
     */
    targetTriggeredCls: undefined,

    /**
     * @cfg {Ext.Component} owner
     * The Ext component that owns this popover. This is useful for doing .up() component queries or tying data requests to the original component instead of the popover component
     */
    owner: undefined,

    /**
     * @cfg {String|Array|Function} placement
     * How to position the popover -  right | left | top | bottom
     * Can be a string if you only want to allow one position, an array of strings if you want to allow multiple, or a function to determine which ones you want and return the string or array of strings
     * The popover will use this value as a preference choosing the first placeable value first
     */
    placement: undefined,

    /**
     * @cfg Array offsetFromTarget
     * Offset (Object) x and y offset positions of popover when on top, right, bottom and left
     */
    offsetFromTarget: [
        {x: 0, y: 0},
        {x: 0, y: 0},
        {x: 0, y: 0},
        {x: 0, y: 0}
    ],

    /**
     * @cfg Array viewportPadding
     * Offset (Array) amounts from Viewport edge - top | right | bottom | left
     * when specified, the popover will be shifted within the viewport (plus any offset)
     */
    viewportPadding: [0,0,0,0],

    /**
     * @cfg Array targetPosition
     * Position (String) for popover's target when on top, right, bottom and left
     */
    targetPosition: ['b-t','l-r','t-b','r-l'],

    /**
     * @cfg Array chevronPosition
     * Position (String) for popover's chevron when on top, right, bottom and left
     */
    chevronPosition: ['t-b','r-l','b-t','l-r'],

    /**
     * @cfg Array chevronOffset
     * Offset (Object) x and y offset positions of chevron when on top, right, bottom and left
     */
    chevronOffset: [
        {x: 0, y: -14},
        {x: 14, y: 0},
        {x: 0, y: 14},
        {x: -8, y: 0}
    ],

    /**
     * @cfg Boolean showChevron
     * Set to false to not show the chevron when displaying the popover
     */
    showChevron: true,

    constructor: function(config) {
        this.title = config.title || '';
        var filters = [];
        _.each(config.oids, function(oid){
            filters.push({
                property: 'ObjectID',
                value: oid
            });
        });
        filters= Rally.data.wsapi.Filter.or(filters);

        var store = Ext.create('Rally.data.wsapi.Store',{
            model: config.modelName,
            fetch: config.fetch,
            enablePostGet: true,
            filters: filters,
            pageSize: Math.max(config.oids.length, 200),
            limit: config.oids.length
        });
        store.load();

        var items = [{
            xtype: 'rallygrid',
            columnCfgs: config.fetch,
            store: store,
            showPagingToolbar: config.oids.length > 200
        }];

        config.items = Ext.merge(items, config.items);

        this.callParent(arguments);
    }
});
