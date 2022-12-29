export const editLayout = {
  name: 'edit-layout',
  label: 'Edit the layout',
  class: 'btn-sm',
  title: 'Edit the layout of this model',
  icon: 'fa fa-edit',
  action: async ({
    // eslint-disable-next-line
    item, action, location, props, id,
  }, context) => {
    context.$router.push(`/app/models/axelModelConfig/${context.identity}/edit`);
  },
};
export const editFields = {
  name: 'edit-layout',
  label: 'Edit the fields',
  class: 'btn-sm',
  title: 'Edit the fields of this model',
  icon: 'fa fa-list',
  action: async (args, context) => {
    context.$router.push(`/app/models/axelModelFieldConfig/${context.identity}/edit`);
  },
};

export const writeConfigToFs = {
  name: 'save-layout',
  label: 'Save layout',
  class: 'btn-sm',
  title: 'Save the config in the schema file',
  icon: 'fa fa-save',
  action: async (args, context) => {
    context.$socket.put('/admin-panel/admin-models/save', { body: { modelName: context.identity } }).then(console.warn).catch(console.warn);
  },
};
