module.exports = {
  identity: 'axelModelConfig',
  collectionName: 'axel-model-config',
  apiUrl: '/api/axel-admin/axel-model-config', // url for front api
  automaticApi: false,
  additionalProperties: false,
  autoValidate: true,
  displayField: 'name',
  primaryKeyField: 'identity',
  primaryKey: 'identity',
  schema: {
    $id: 'http://acme.com/schemas/axel-model-config.json',
    type: 'object',
    properties: {
      id: {
        $id: 'id',
        type: 'number',
        title: 'id', // serves for front form fields
        description: 'The id of this item', // serves for front form hint
        field: {
          disabled: true,
          readonly: true
        }
      },
      identity: {
        type: 'string',
        field: {
          required: true,
          disabled: true,
          readonly: true
        }
      },

      pageTitle: {
        type: 'string',
        title: 'Custom title for this page'
      },
      icon: {
        type: 'string'
      },
      name: {
        type: 'string',
        field: {
          required: true
        }
      },
      namePlural: {
        type: 'string'
      },
      detailPageMode: {
        type: 'string',
        default: 'sidebar',
        enum: ['modal', 'fullscreen', 'sidebar', 'page', 'sideform']
      }, // fade | slide | full
      nestedLayoutMode: {
        type: 'string',
        enum: ['horizontal-tabs', 'vertical-tabs', 'list'],
        default: 'horizontal-tabs',
        title: 'Layout of the detail page',
        description: 'How the awesomeform is layed out in regards to nested components'
      },
      detailPageLayout: {
        title: 'layout of the detail page',
        type: 'array',
        items: {
          properties: {
            legend: { type: 'string' },
            cols: {
              type: 'number', min: 0, max: 12
            },
            fields: {
              type: 'array',
              items: { type: 'string' }
            }
          }
        },
        default: [],
        field: { type: 'layoutEditor' }
      },
      options: {
        type: 'object',
        field: {},
        default: {},
        column: { type: 'string' },
        properties: {
          detailPageMode: {
            type: 'string',
            default: 'sidebar',
            title: '@Deprecated use schema.detailPageMode directly',
            enum: ['modal', 'fullscreen', 'sidebar', 'page', 'sideform']
          }, // fade | slide | full
          dataPaginationMode: {
            type: 'string',
            default: 'local',
            enum: ['remote', 'local'],
          },
          apiUrl: { type: 'string', default: '' },
          createPath: { type: 'string', default: '' },
          viewPath: { type: 'string', default: '' },
          editPath: { type: 'string', default: '' },
          stats: { type: 'boolean', default: false },
          autoRefresh: { type: 'boolean', field: { disabled: true } }, // or integer in seconds
          initialDisplayMode: { type: 'string', default: 'table' },
          modalMode: { type: 'string', default: 'slide' }, // fade | slide | full
          columnsDisplayed: { type: 'integer', default: false }
        }
      },
      actions: {
        type: 'object',
        title: 'Possible actions',
        column: {
          type: 'string',
          title: 'Possible actions'
        },
        default: {},
        properties: {
          create: { type: 'boolean' },
          edit: { type: 'boolean' },
          view: { type: 'boolean' },
          delete: { type: 'boolean' },

          noActions: { type: 'boolean', default: false },
          search: { type: 'boolean', default: true },
          filter: { type: 'boolean', default: true },
          export: { type: 'boolean', default: false },
          import: { type: 'boolean', default: false },
          dateFilter: { type: 'boolean', default: true },
          refresh: { type: 'boolean', default: true },

          automaticRefresh: { type: 'boolean', default: false },
          advancedFiltering: { type: 'boolean', default: true },
          columnsFilters: { type: 'boolean', default: true },
          bulkDelete: { type: 'boolean', default: true },
          bulkEdit: { type: 'boolean', default: true },
          itemsPerRow: { type: 'boolean', default: true },
          editLayout: { type: 'boolean', default: true }
        }
      },
      customInlineActions: { type: 'array' },
      customTopActions: { type: 'array' },
      customTabletopActions: { type: 'array' },
      formOptions: {
        title: 'Form Options',
        description: 'Options for the create / edit / detail form',
        type: 'object',
        default: {},
        properties: {
          layout: {
            title: 'layout of the form',
            type: 'array',
            items: {
              properties: {
                legend: { type: 'string' },
                cols: {
                  type: 'number', min: 0, max: 12
                },
                fields: {
                  type: 'array',
                  items: { type: 'string' }
                }
              }
            },
            default: null,
            field: { type: 'JsonTextarea' }
          }
        }
      },
      tableRowClickAction: {
        type: 'string',
        title: 'Row click action',
        default: 'view',
        enum: ['view', 'edit', 'none', 'delete'],
        description: 'The action to execute when the user clicks on a row'
      },
      tableRowDoubleClickAction: {
        type: 'string',
        title: 'Row double click action',
        default: 'none',
        values: ['view', 'edit', 'none', 'delete'],
        description: 'The action to execute when the user double clicks on a row'
      },
      listOptions: {
        title: 'List Options',
        description: 'Options for list view',
        type: ['object', 'null'],
        default: {},
        properties: {
          titleField: { type: 'string' },
          subtitleField: { type: 'string' },
          descriptionField: { type: 'string' },
          perRow: { type: 'number' },
        }
      },
      kanbanOptions: {
        title: 'List Options',
        description: 'Options for kanban view',
        type: ['object', 'null'],
        default: {},
      },
      tableOptions: {
        title: 'List Options',
        description: 'Options for table view',
        type: ['object', 'null'],
        default: {},
      },
      tableDataLimit: {
        title: 'tableDataLimit',
        type: 'number',
        default: 1000,
        description:
          'Definesthe number of items to get from the api for the table. This prevents overloading the table with too much data'
      }
    },
    required: ['identity']
  },
  admin: {
    name: 'Model config',
    namePlural: 'Models configs',
    pageTitle: '',
    routerPath: 'axel-model-config',
    displayMode: 'page',
    actions: {
      create: false,
      edit: true,
      view: true,
      delete: true,
      export: true,
      import: true,
    },
    detailPageMode: 'page',
    layout: [{
      legend: 'Infos', fields: ['id', 'identity', 'pageTitle', 'icon', 'name', 'namePlural'], cols: '6', wrapperClasses: 'card mb-1'
    }, {
      legend: 'Basic Config', fields: ['detailPageMode', 'nestedLayoutMode', 'tableDataLimit'], cols: '6', wrapperClasses: 'card mb-1'
    }, {
      legend: 'Layout', fields: ['layout'], cols: 12, wrapperClasses: 'card mb-1'
    }, {
      legend: 'Actions', fields: ['actions'], cols: '6', wrapperClasses: 'card mb-1'
    }, {
      legend: 'Options', fields: ['options'], cols: '6', wrapperClasses: 'card mb-1'
    }]
  }
};
