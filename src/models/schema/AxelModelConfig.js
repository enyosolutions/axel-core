const layoutConfig = {
  title: 'layout of the detail page',
  type: 'array',
  minItems: 0,
  items: {
    type: 'object',
    properties: {
      legend: { type: 'string' },
      cols: {
        type: 'number', minimum: 0, maximum: 12
      },
      fields: {
        type: 'array',
        minItems: 0,
        items: { type: 'string' }
      }
    }
  },
  default: [],
  field: {
    type: 'layoutEditor', cols: 12, innerClasses: 'card-body', classes: 'card'
  }
};

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
      title: {
        type: 'string',
        title: 'Custom title for this page'
      },
      tabTitle: {
        type: 'string',
        title: 'Custom title for this model when displayed in a tab'
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
      primaryKeyField: {
        type: 'string'
      },

      displayField: {
        type: 'string'
      },
      apiUrl: { type: 'string', default: '' },
      segmentField: {
        type: 'string',
        field: {
          type: 'vSelect',
          fieldOptions: {
            taggable: true,
            url: '/api/axel-admin/axel-model-field-config?filters%5B%5D=&filters%5BparentIdentity%5D={{ currentItem.identity }}',
            label: 'name',
            trackBy: 'name',
          }
        },
      },
      detailPageMode: {
        type: 'string',
        default: 'sidebar',
        enum: ['modal', 'fullscreen', 'sidebar', 'page', 'sideform', 'bottomform']
      }, // fade | slide | full
      nestedLayoutMode: {
        type: 'string',
        enum: ['horizontal-tabs', 'vertical-tabs', 'list', 'left-sidebar', 'right-sidebar', null],
        nullable: true,
        default: 'horizontal-tabs',
        title: 'Layout for nested components',
        description: 'How the awesomeform is layed out in regards to nested components'
      },
      enabledListingModes: {
        type: 'array',
        items: {
          type: 'string',
          enum: ['kanban', 'table', 'list'],
        },
        default: ['kanban', 'table', 'list'],
        title: 'Enabled listing modes',
        description: 'How the awesomeform is layed out in regards to nested components'
      },
      postCreateDisplayMode: {
        title: 'Display mode after creating an item',
        type: 'string',
        enum: ['list', 'view', 'edit'],
      },
      postEditDisplayMode: {
        title: 'Display mode after editing an item',
        type: 'string',
        enum: ['list', 'view', 'edit']
      },
      detailPageLayout: {
        ...layoutConfig,
        title: 'layout of the detail page',
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
            nullable: true,
            field: {
              readonly: true
            }
          }, // fade | slide | full
          dataPaginationMode: {
            type: 'string',
            default: 'local',
            enum: ['remote', 'local'],
            nullable: true
          },
          apiUrl: { type: 'string', default: '' },
          createPath: { type: 'string', default: '' },
          viewPath: { type: 'string', default: '' },
          editPath: { type: 'string', default: '' },
          stats: { type: 'boolean', default: false },
          autoRefresh: { type: 'boolean', field: { disabled: true } }, // or integer in seconds
          initialDisplayMode: { type: 'string', default: 'table' },
          modalMode: { type: 'string', default: 'slide' }, // fade | slide | full
          columnsDisplayed: { type: 'integer', default: 8 }
        }
      },
      actions: {
        type: 'object',
        title: 'Possible actions',
        nullable: true,
        column: {
          type: 'string',
          title: 'Possible actions'
        },
        default: {},
        properties: {
          create: { type: 'boolean', default: true },
          edit: { type: 'boolean', default: true },
          view: { type: 'boolean', default: true },
          delete: { type: 'boolean', default: true },

          noActions: { type: 'boolean', default: false },
          search: { type: 'boolean', default: true },
          filter: { type: 'boolean', default: true },
          export: { type: 'boolean', default: false },
          import: { type: 'boolean', default: false },
          dateFilter: { type: 'boolean', default: false },
          refresh: { type: 'boolean', default: true },

          automaticRefresh: { type: 'boolean', default: false },
          advancedFiltering: { type: 'boolean', default: true },
          columnsFilters: { type: 'boolean', default: true },
          bulkDelete: { type: 'boolean', default: true },
          bulkEdit: { type: 'boolean', default: true },
          changeItemsPerRow: { type: 'boolean', default: true },
          editLayout: { type: 'boolean', default: true },
          changeDisplayMode: { type: 'boolean', default: true },
          pagination: { type: 'boolean', default: true },
          collapse: { type: 'boolean', default: true },
          formPagination: { type: 'boolean', default: true },
          addKanbanList: {
            title: 'Add new list in kanban', description: 'show the button to create a new list in the awesome kanban', type: 'boolean', default: true
          },
        }
      },
      customInlineActions: { type: 'array' },
      customTopActions: { type: 'array' },
      customTabletopActions: { type: 'array' },
      tableRowClickAction: {
        type: 'string',
        title: 'Row click action',
        default: 'view',
        nullable: true,
        enum: ['view', 'edit', 'none', 'delete'],
        description: 'The action to execute when the user clicks on a row'
      },
      tableRowDoubleClickAction: {
        type: 'string',
        title: 'Row double click action',
        default: 'none',
        nullable: true,
        enum: ['view', 'edit', 'none', 'delete'],
        description: 'The action to execute when the user double clicks on a row'
      },
      formOptions: {
        title: 'Form Options',
        description: 'Options for the create / edit / detail form',
        type: ['object', 'null'],
        nullable: true,
        default: {},
        field: {
          cols: 12
        },
        properties: {
          layout: {
            ...layoutConfig,
            title: 'layout of the form',
          }
        }
      },
      listOptions: {
        title: 'List Options',
        description: 'Options for list view',
        type: ['object', 'null'],
        default: {},
        additionalProperties: true,
        field: {
          cols: 12
        },
        properties: {
          titleField: { type: 'string' },
          subtitleField: { type: 'string' },
          descriptionField: { type: 'string' },
          perRow: { type: 'number' },
          perPage: { type: 'number' },
        }
      },
      kanbanOptions: {
        title: 'Kanban Options',
        description: 'Options for kanban view',
        type: ['object', 'null'],
        default: {},
        additionalProperties: true,
        field: {
          type: 'JsonTextarea'
        },
        properties: {
          displayColumnsInCards: {
            type: 'boolean',
          },
          displayOrphansList: {
            type: 'boolean',
          },
        }
      },
      tableOptions: {
        title: 'Table Options',
        description: 'Options for table view',
        type: ['object', 'null'],
        additionalProperties: true,
        default: {},
        field: {
          type: 'JsonTextarea'
        }
      },
      tableDataLimit: {
        title: 'tableDataLimit',
        type: 'number',
        default: 1000,
        description:
          'Defines the number of items to get from the api for the table. This prevents overloading the table with too much data'
      },
      nestedModels: {
        type: 'array',
        field: {
          type: 'array',
          cols: 12,
        },
        items: {
          type: 'object',
          properties: {
            extends: {
              title: 'The model to extends',
              type: 'string',
              field: {
                type: 'vSelect',
                cols: 12,
                fieldOptions: {
                  taggable: true,
                  url: '/api/axel-admin/models',
                  label: 'name',
                  trackBy: 'identity',
                }
              }
            },
            config: {
              type: 'object',
              additionalProperties: true,
              default: {},
              field: {
                cols: 12,
                type: 'JsonTextarea'
              }
            }
          }
        },
      }
    },
    required: ['identity']
  },
  admin: {
    name: 'Model config',
    namePlural: 'Models configs',
    pageTitle: '',
    routerPath: 'axel-model-config',
    primaryKey: 'identity',
    options: {
      initialDisplayMode: 'table',
    },
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
