go.modules.community.pages.SiteTree = Ext.extend(Ext.tree.TreePanel,{
    enableDD: false,
    border: true,
    useArrows: true,
    root: {
	nodeType: 'async',
        text: 'Root',
        draggable: false,
        id: 'source',
	expanded: false
    },
    
	rootVisible: true,
    initComponent : function() {
	go.modules.community.pages.SiteTree.superclass.initComponent.call(this);
    }
    
})