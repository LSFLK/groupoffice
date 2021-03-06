/** 
 * Copyright Intermesh
 * 
 * This file is part of Group-Office. You should have received a copy of the
 * Group-Office license along with Group-Office. See the file /LICENSE.TXT
 * 
 * If you have questions write an e-mail to info@intermesh.nl
 * 
 * @copyright Copyright Intermesh
 * @version $Id: SelectTasklist.js 22112 2018-01-12 07:59:41Z mschering $
 * @author Merijn Schering <mschering@intermesh.nl>
 */

GO.tasks.SelectTasklist = function(config){
	
	config = config || {};

	if(!config.hiddenName)
		config.hiddenName='tasklist_id';

	if(!config.fieldLabel)
	{
		config.fieldLabel=t("Tasklist", "tasks");
	}

	Ext.apply(this, config);
	
	
	this.store = new GO.data.JsonStore({
		url: GO.url('tasks/tasklist/store'),
		baseParams:{permissionLevel: GO.permissionLevels.create},
		fields:['id','name','user_name'],
		remoteSort:true
	});	

	GO.tasks.SelectTasklist.superclass.constructor.call(this,{
		displayField: 'name',	
		valueField: 'id',
		triggerAction:'all',		
		mode:'remote',
		editable: true,
		selectOnFocus:true,
		forceSelection: true,
		typeAhead: true,
		emptyText:t("Please select..."),
		pageSize: parseInt(GO.settings.max_rows_list)
	});
	
}
Ext.extend(GO.tasks.SelectTasklist, GO.form.ComboBoxReset, {
	
	setValue: function (id) {

		if (!id) {
			GO.tasks.SelectTasklist.superclass.setValue.call(this, id);
			return;
		}
		var r = this.findRecord(this.valueField, id);

		if (!r)
		{
			GO.request({
				url: 'tasks/tasklist/load',
				params: {id: id},
				success: function (response, options, result) {

					var comboRecord = Ext.data.Record.create([{
							name: this.valueField
						}, {
							name: this.displayField
						}]);

					var recordData = {};

					if (this.store.fields && this.store.fields.keys) {
						for (var i = 0; i < this.store.fields.keys.length; i++) {
							recordData[this.store.fields.keys[i]] = "";
						}
					}

					recordData[this.valueField] = id;
					recordData[this.displayField] = result.data.name;

					var currentRecord = new comboRecord(recordData);
					this.store.add(currentRecord);
					GO.tasks.SelectTasklist.superclass.setValue.call(this, id);
				},
				scope: this
			});
		} else
		{
			GO.tasks.SelectTasklist.superclass.setValue.call(this, id);
		}


	}
	
	/*afterRender : function(){
		
		
		this.store.load({
			
			callback:function(){
				GO.tasks.SelectTasklist.superclass.afterRender.call(this);		
			},
			scope: this
			
		});	
	}*/	
});
