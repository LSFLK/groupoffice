
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

go.modules.core.groups.GroupUserGrid = Ext.extend(go.grid.GridPanel, {
	/**
	 * The form field name
	 */
	name: "users",
	
	initComponent: function () {
		
		this.selectedUsers = [];
		
		var checkColumn = new GO.grid.CheckColumn({
			dataIndex: 'selected',
			listeners: {
				change: this.onCheckChange,
				scope: this
			}
		});
		
		var me = this;
		
		this.store = new go.data.Store({
			remoteSort: false,
			fields: [
				'id', 
				'username', 
				'displayName',
				'avatarId',
				'loginCount',
				{name: 'createdAt', type: 'date'},
				{name: 'lastLogin', type: 'date'}	,
				{
					name: 'selected', 
					type: {
						convert: function (v, data) {
							return me.selectedUsers.indexOf(data.id) > -1;
						}
					},
					sortType:function(checked) {
						return checked ? 1 : 0;
					}
				}
			],
			listeners: {
				scope: this,
				load: this.onStoreLoad
			},
			baseParams: {
				filter: {
					selectForGroupId: null
				}
			},
			entityStore: go.Stores.get("User")
		});

		Ext.apply(this, {		
			plugins: [checkColumn],
			tbar: [{
					xtype: 'tbtitle',
					text: t("Members")
			},
			'->', 
				{
					xtype: 'tbsearch'
				}				
			],
			columns: [
				{
					id: 'name',
					header: t('Name'),
					width: dp(200),
					sortable: true,
					dataIndex: 'displayName',
					renderer: function (value, metaData, record, rowIndex, colIndex, store) {
						
						return '<div class="user"><div class="avatar group"></div>' +
							'<div class="wrap">'+
								'<div class="displayName">' + record.get('displayName') + '</div>' +
								'<small class="username">' + record.get('username') + '</small>' +
							'</div>'+
							'</div>';
					}
				},
				checkColumn
			],
			viewConfig: {
				emptyText: 	'<i>description</i><p>' +t("No items to display") + '</p>',
				forceFit: true,
				autoFill: true
			},
			listeners: {
				scope: this,
				render: function() {
					this.store.load();
				}
			}
//			// config options for stateful behavior
//			stateful: true,
//			stateId: 'users-grid'
		});
		
		this.store.sort([{
					field: 'selected',
					direction: 'DESC'
				},{
					field: 'displayName',
					direction: 'ASC'
				}]);

		go.modules.core.groups.GroupUserGrid.superclass.initComponent.call(this);

	},
	
//	load : function(id) {
//		
//		this.selectedUsers = [];
//		go.Jmap.request({
//			method: "User/query",
//			params: {
//				filter: {
//					groupId: id
//				}
//			},
//			callback: function(options, success, response) {
//				this.selectedUsers = response.ids;
//				
////				this.store.baseParams.filter.groupId = id;
//				this.store.load();
//			},
//			scope: this
//		});
//		
//	},
	
	onCheckChange : function(record, newValue) {
		if(newValue) {
			this.selectedUsers.push(record.id);
		} else
		{
			this.selectedUsers.splice(this.selectedUsers.indexOf(record.id), 1);
		}
		
		this._isDirty = true;
	},
	
	isFormField: true,

	getName: function() {
		return this.name;
	},

	_isDirty: false,

	isDirty: function () {
		return this._isDirty || this.store.getModifiedRecords().length > 0;
	},

	setValue: function (groups) {
		
		this._isDirty = false;
		
		var me = this;
		this.selectedUsers = [];
		groups.forEach(function(group) {
			me.selectedUsers.push(group.userId);
		});
		
		//Perhaps needed when store not reloaded?
		//this.getView().render();
	},
	
	onStoreLoad : function() {
		
		//don't add selected on search
		if(this.store.baseParams.filter.q) {
			return;
		}
		
		go.Stores.get("User").get(this.selectedUsers, function(entities) {
			this.store.suspendEvents(false); //to prevent ininiteloop as loadData fires 'load' event.
			this.store.loadData({records: entities}, true);		
			this.store.sortData();
			this.store.resumeEvents();
		}, this);
	},
	
	getValue: function () {				
		var users = [];
		this.selectedUsers.forEach(function(userId) {
			users.push({
				userId: userId
			});
		});
		return users;
	},

	markInvalid: function (msg) {
		this.getEl().addClass('x-form-invalid');
		Ext.form.MessageTargets.qtip.mark(this, msg);
	},
	clearInvalid: function () {
		this.getEl().removeClass('x-form-invalid');
		Ext.form.MessageTargets.qtip.clear(this);
	},
	
	validate : function() {
		return true;
	}
});

