go.users.CreateUserWizard = Ext.extend(go.Wizard, {
	title: t('Create user'),
	user : null,
	initComponent : function() {
		
		//store all form data here
		this.user = {};
		
		this.groupsGrid = new go.users.UserGroupGrid({
				title: null,
				iconCls: null
			});
			
		this.groupsGrid.getTopToolbar().insert(0, {
			xtype:'tbtitle',
			text: t("Groups")
		});
	
		this.items = [
			this.userPanel = new go.users.CreateUserAccountPanel(),
			this.passwordPanel = new go.users.CreateUserPasswordPanel(),
			this.groupsGrid
		]
		go.users.CreateUserWizard.superclass.initComponent.call(this);
		
		this.on({
			continue: this.onContinue,
			finish: this.onFinish,
			scope: this
		});
	
		// Get default groups from settings
		this.groupsGrid.setValue(go.Modules.get('core', 'core').settings.defaultGroups.map(function(groupId){return {groupId: groupId};}));
		
	},
	
	onContinue: function(wiz, item, nextItem) {
		
		this.applyPanelData(item);
	},
	
	applyData : function(data){
		
		var me = this;
		this.items.each(function(item,index,length){
			if(item != me.groupsGrid){
				item.getForm().setValues(data);
			}
		});
	},
		
	applyPanelData : function(item) {
		if(item != this.groupsGrid) {
			this.user = Ext.apply(this.user, item.getForm().getValues());
		} else
		{
			this.user.groups = this.groupsGrid.getValue();
		}
	},
	
	onSaveSuccess : function(response){
		
	},
	
	onFinish: function(wiz, lastItem) {
		this.applyPanelData(lastItem);
		
		this.userPanel.onSubmitStart(this.user);
		
		var id = Ext.id(), params = {};
		params.create = {};
		params.create[id] = this.user;
		
		go.Stores.get("User").set(params, function (options, success, response) {

			if (response.created && response.created[id]) {				
				
				//var serverId = params.create ? response.created[id].id : response.updated[id].id;
				this.onSaveSuccess(response.created[id]);
				this.userPanel.onSubmitComplete(response.created[id], response);
				this.close();
				
			} else
			{
				//something went wrong
				var notSaved = response.notCreated || {};
				if (!notSaved[id]) {
					notSaved[id] = {type: "unknown"};
				}

				switch (notSaved[id].type) {
					case "forbidden":
						Ext.MessageBox.alert(t("Access denied"), t("Sorry, you don't have permissions to update this item"));
						break;

					default:
						
						//mark validation errors
						for(name in notSaved[id].validationErrors) {
							var field = this.findField(name);
							if(field) {
								this.setActiveItem(field[1]);
								field[0].markInvalid(notSaved[id].validationErrors[name].description);
							}
						}
						
						Ext.MessageBox.alert(t("Error"), t("Sorry, something went wrong. Please try again."));
						break;
				}

			}
		}, this);
	},
	
	findField : function(name) {
		var field, pnl;
		for(var i = 0, l = this.items.getCount(); i < l; i++) {
			pnl = this.items.itemAt(i);
			field = pnl.getForm().findField(name);
			if(field) {
				return [field, pnl];
			}
		}
		return false;
	}
		
		
});

