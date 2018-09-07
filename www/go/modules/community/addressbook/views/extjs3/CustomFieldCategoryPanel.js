/** 
 * Copyright Intermesh
 * 
 * This file is part of Group-Office. You should have received a copy of the
 * Group-Office license along with Group-Office. See the file /LICENSE.TXT
 * 
 * If you have questions write an e-mail to info@intermesh.nl
 * 
 * @version $Id: MainPanel.js 19225 2015-06-22 15:07:34Z wsmits $
 * @copyright Copyright Intermesh
 * @author Merijn Schering <mschering@intermesh.nl>
 */

go.modules.community.addressbook.CustomFieldCategoryPanel = Ext.extend(go.grid.GridPanel, {

	autoHeight: true,
	initComponent: function () {

		this.title = t("Custom fields");

		
		this.store = new Ext.data.ArrayStore({
			fields: [				
				'name',
				'databaseName',
				'type',				
				'fieldId',
				'fieldSetId',
				'isFieldSet'
			]
		});


		Ext.apply(this, {
			//plugins: [actions],
			tbar: ["->", {
					iconCls: 'ic-add',
					tooltip: t('Add field set'),
					handler: function (e, toolEl) {
//						var dlg = new go.modules.community.apikeys.KeyDialog();
//						dlg.show();
					}
				}
			],
			columns: [
				{
					id: 'name',
					header: t('Name'),
					width: dp(200),
					sortable: true,
					dataIndex: 'name',
					renderer: function(v, meta, record) {
						return record.data.isFieldSet ? "<h3>" + v + "</h3>" : v;
					}
				},
				{
					width: dp(80),
					menuDisabled: true,
					draggable: false,
					hidable:false,
					align: "right",
					dataIndex: "databaseName",
					renderer: function(v, meta, record) {
						if(record.data.isFieldSet) {
							return '<button class="icon" ext:qtip="' + t("Add field") + '">add</button><button class="icon">more_vert</button>';
						} else
						{
							return "<button class='icon'>more_vert</button>";
						}
					}
				}
			],
			viewConfig: {
				emptyText: '<i>description</i><p>' + t("No items to display") + '</p>',
				forceFit: true,
				autoFill: true
			},
			listeners: {
				scope: this,
				rowclick: function(grid, rowIndex, e) {
					if(e.target.tagName != "BUTTON") {
						return false;
					}
					
					var record = this.store.getAt(rowIndex);
					
					switch(e.target.innerHTML) {
						case 'more_vert':
							this.showMoreMenu(record, e);
							break;						
							
						case 'add':
							
							break;
					}
				}
			}
			// config options for stateful behavior
//			stateful: true,
//			stateId: 'apikeys-grid'
		});

		go.modules.community.addressbook.CustomFieldCategoryPanel.superclass.initComponent.call(this);

		this.on('render', function () {
			this.load();
		}, this);
	},

	initRowActions: function () {

		var actions = new Ext.ux.grid.RowActions({
			menuDisabled: true,
			hideable: false,
			draggable: false,
			fixed: true,
			header: '',
			hideMode: 'display',
			keepSelection: true,

			actions: [{
					iconCls: 'ic-add'
				}, {
					iconCls: 'ic-more-vert'
				}]
		});

		actions.on({
			action: function (grid, record, action, row, col, e, target) {
				console.log(arguments);
				switch (action) {

					case 'ic-add':
						console.log("todo");
						break;

					case 'ic-more-vert':
						this.showMoreMenu(record, e);
						break;
				}
			},
			scope: this
		});

		return actions;

	},

	showMoreMenu: function (record, e) {
		if (!this.moreMenu) {
			this.moreMenu = new Ext.menu.Menu({
				items: [
					{
						itemId: "view",
						iconCls: 'ic-search',
						text: t("View access token"),
						handler: function () {
							alert(this.moreMenu.record.get('accessToken'));
						},
						scope: this
					}, {
						itemId: "delete",
						iconCls: 'ic-share',
						text: t("Delete"),
						handler: function () {
							this.getSelectionModel().selectRecords([this.moreMenu.record]);
							this.deleteSelected();
						},
						scope: this
					},
				]
			})
		}

		this.moreMenu.record = record;

		this.moreMenu.showAt(e.getXY());
	},

	load: function () {

		go.Stores.get("FieldSet").query({
			sort: ["name ASC"],
			filter: {
				entities: ["Contact", "Company"]
			}
		}, function (options, success, response) {

			go.Stores.get("FieldSet").get(response.ids, function (fieldSets) {
				fieldSetsLoaded = true;
				
				var storeData = [];
				fieldSets.forEach(function(fs){
					storeData.push([
						fs.name,
						null,
						null,
						null,
						fs.id,						
						true
					]);
				});
				
				this.store.loadData(storeData, true);
				
			}, this);

			go.Stores.get("Field").query({
				sort: ["name ASC"],
				filter: {
					fieldSetId: response.ids
				}
			}, function (options, success, response) {
				go.Stores.get("Field").get(response.ids, function (fields) {
					var storeData = [];
					fields.forEach(function(f){
						storeData.push([
							f.name,
							f.dataName,
							f.type,							
							f.id,
							f.fieldSetId,
							false
						]);
					});
				
					this.store.loadData(storeData, true);

					this.store.multiSort(
									[
						{field: 'fieldSetId', direction: 'ASC'},
						{field: 'isFieldSet', direction: 'DESC'},
						{field: 'name', direction: 'ASC'}
					]);
					
				}, this);
			}, this);

		}, this);



	}
});


