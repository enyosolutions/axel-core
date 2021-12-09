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
    context.$router.push(`/app/models/axelModelConfig/${context.identity}/edit`)
  },
}
export const editFields = {
  name: 'edit-layout',
  label: 'Edit the fields',
  class: 'btn-sm',
  title: 'Edit the fields of this model',
  icon: 'fa fa-list',
  action: async (args, context) => {
    context.$router.push(`/app/models/axelModelFieldConfig/${context.identity}/edit`)
  },
}