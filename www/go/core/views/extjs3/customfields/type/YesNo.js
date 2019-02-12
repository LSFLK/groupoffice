Ext.ns("go.modules.core.core.type");

go.modules.core.core.type.YesNo = Ext.extend(go.modules.core.core.type.Text, {

	name: "YesNo",

	label: t("Yes or no"),

	iconCls: "ic-check-box",

	/**
	 * Return dialog to edit this type of field
	 * 
	 * @returns {go.customfields.FieldDialog}
	 */
	getDialog: function () {
		return new go.customfields.FieldDialog();
	},

	/**
	 * Render's the custom field value for the detail views
	 * 
	 * @param {mixed} value
	 * @param {object} data Complete entity
	 * @param {object} customfield Field entity from custom fields
	 * @returns {unresolved}
	 */
	renderDetailView: function (value, data, customfield) {

		if (value === null) {
			return t("Unknown");
		}

		return value ? t("Yes") : t("No");
	},

	/**
	 * Returns config oject to create the form field 
	 * 
	 * @param {object} customfield customfield Field entity from custom fields
	 * @param {object} config Extra config options to apply to the form field
	 * @returns {Object}
	 */
	createFormFieldConfig: function (customfield, config) {
		var f = go.modules.core.core.type.YesNo.superclass.createFormFieldConfig.call(this, customfield, config);

		var store = new Ext.data.SimpleStore({
			id: 'id',
			fields: ['id', 'text'],
			data: [
				['1', t("Yes")],
				['-1', t("No")]],
			remoteSort: false
		});

		

		return Ext.apply(f, {
			xtype: 'comboboxreset',
			store: store,
			valueField: 'id',
			displayField: 'text',
			hiddenName: f.name, 
			mode: 'local',
			editable: false,
			triggerAction: 'all',
			selectOnFocus: true,
			forceSelection: false
		}, config);
	},

	getFieldType: function () {
		return "int";
	}


});

go.customfields.CustomFields.registerType(new go.modules.core.core.type.YesNo());

