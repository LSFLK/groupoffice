go.form.EntityPanel = Ext.extend(Ext.form.FormPanel, {
	currentId : null, 
	entityStore: null,
	buttonAlign: 'left',
	autoScroll: true,
	entity: null,
	values : null,
	initComponent : function() {
		go.form.EntityPanel.superclass.initComponent.call(this);	
		
		this.entity = {};
		this.values = {};
		
		this.entityStore.on('changes',this.onChanges, this);
		this.on('destroy', function() {
			this.entityStore.un('changes', this.onChanges, this);
		}, this);
	},
	
	onChanges : function(entityStore, added, changed, destroyed) {
		if(changed.concat(added).indexOf(this.currentId) !== -1) {			
			var entities = this.entityStore.get([this.currentId]);
			this.entity = entities[0];
			this.getForm().setValues(entities[0]);
		}		
	},
	
	isValid : function() {
		return this.getForm().isValid();
	},
	
	load: function (id) {
		this.currentId = id;

		var entities = this.entityStore.get([id]);
		
		if(entities) {
			this.setValues(entities[0]);
			this.entity = entities[0];
			return entities[0];
		} else {
			return false;
		}		
	},
	
	getValues : function (dirtyOnly) {	
		var v = {};		
		for(var name in this.values) {
			if(!dirtyOnly || this.entity[name] != this.values[name]) {
				v[name] = this.values[name];
			}
		}
		
		Ext.apply(v, this.getForm().getFieldValues(dirtyOnly));
		return v;
	},
	
	setValues : function(v) {
		var field, name;
		
		this.getForm().setValues(v);
		
		//set all non form values.
		for(name in v) {		
			field = this.getForm().findField(name);
			if(!field) {
				this.values[name] = v[name];
			}
		}
		return this;
	},

	submit: function (cb, scope) {

		if (!this.isValid()) {
			return;
		}		
		//get only modified values on existing items, otherwise get all values.
		var id, params = {}, values = this.getValues(!!this.currentId);
		
		if (this.currentId) {

			id = this.currentId;

			params.update = {};
			params.update[this.currentId] = values;
		} else {

			id = Ext.id();
			params.create = {};
			params.create[id] = values;
		}

		
		this.entityStore.set(params, function (options, success, response) {

			var saved = (params.create ? response.created : response.updated) || {};
			if (id in saved) {				
				this.fireEvent("save", this, values);

				var serverId = params.create ? response.created[id].id : id;

				if(cb) {
					cb.call(scope, this, true, serverId);
				}
			} else
			{
				//something went wrong
				var notSaved = (params.create ? response.notCreated : response.notUpdated) || {};
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
							var field = this.getForm().findField(name);
							if(field) {
								field.markInvalid(notSaved[id].validationErrors[name].description);
							}
						}
						
						Ext.MessageBox.alert(t("Error"), t("Sorry, something went wrong. Please try again."));
						break;
				}
				if(cb) {
					cb.call(scope, this, false, null);
				}
			}
		}, this);

	}
//	,
//
//	focus: function () {
//		var firstField = this.form.items.find(function (item) {
//			if (!item.disabled && item.isVisible() && item.getValue() == "")
//				return true;
//		});
//
//		if (firstField) {
//			firstField.focus();
//		}
//	}
});
