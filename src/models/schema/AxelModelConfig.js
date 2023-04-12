const layoutConfig = {
  title: 'layout of the detail page',
  type: 'array',
  minItems: 0,
  items: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      legend: { type: 'string' },
      showHeader: { type: ['string', 'boolean'], default: true },
      visible: { type: ['string', 'boolean'], default: true },
      cols: {
        type: ['number', 'string'], minimum: 0, maximum: 12, default: 12, nullable: true
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

/** @type import('../../../types/main.js').AxelSchema */
const model = {
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
      icon: {
        type: 'string'
      },
      name: {
        type: 'string',
        default: '',
        field: {
          required: true,
          default: '',
        }
      },
      namePlural: {
        type: 'string',
        default: '',
      },
      primaryKeyField: {
        type: 'string',
        default: '',
        field: {
          type: 'vSelect',
          fieldOptions: {
            taggable: true,
            url: '/api/axel-admin/axel-model-field-config?filters%5B%5D=&filters%5BparentIdentity%5D={{ currentItem.identity }}',
            label: 'name',
            trackBy: 'name',
          }
        }
      },

      displayField: {
        type: 'string',
        default: '',
        field: {
          type: 'vSelect',
          fieldOptions: {
            taggable: true,
            url: '/api/axel-admin/axel-model-field-config?filters%5B%5D=&filters%5BparentIdentity%5D={{ currentItem.identity }}',
            label: 'name',
            trackBy: 'name',
          }
        }
      },
      title: {
        type: 'string',
        title: 'Title of the page',
        field: {
          cols: 12
        }
      },
      // @deprecated
      pageTitle: {
        type: 'string',
        title: 'Custom title for page',
        nullable: true,
      },
      tabTitle: {
        type: 'string',
        title: 'Title to use in tabs',
        description: 'Title to use when displayed in a nested tab',
        nullable: true,
      },
      menuTitle: {
        type: 'string',
        title: 'Title to use in menus',
        description: 'Title to use when displayed in a menu',
        nullable: true,
      },
      tabIsVisible: {
        type: ['string', 'boolean'],
        title: 'Display condition for this model when displayed in a tab',
        description: 'Templated rules for displaying this field',
        nullable: true,
        field: {
          type: 'BooleanExpressionEditor'
        }
      },
      menuIsVisible: {
        type: ['string', 'boolean'],
        title: 'Display condition for this model when displayed in a menu',
        description: 'Templated rules for displaying this field',
        nullable: true,
        field: {
          type: 'BooleanExpressionEditor'
        }
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
        enum: ['modal', 'fullscreen', 'sidebar', 'page', 'sideform', 'bottomform'],
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
        description: 'layout of the detail page',
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
          stats: {
            type: 'boolean',
            default: false,
            field: {
              type: 'BooleanExpressionEditor'
            }
          },
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
        field: {
          collapsible: true,
        },
        column: {
          type: 'string',
          title: 'Possible actions'
        },
        default: {},
        properties: {
          noActions: {
            type: 'boolean',
            default: false,
            field: {
              type: 'BooleanExpressionEditor'
            }
          },
          create: {
            type: 'boolean',
            default: true,
            field: {
              type: 'BooleanExpressionEditor'
            }
          },
          edit: {
            type: 'boolean',
            default: true,
            field: {
              type: 'BooleanExpressionEditor'
            }
          },
          view: {
            type: 'boolean',
            default: true,
            field: {
              type: 'BooleanExpressionEditor'
            }
          },
          delete: {
            type: 'boolean',
            default: true,
            field: {
              type: 'BooleanExpressionEditor'
            }
          },
          search: {
            type: 'boolean',
            default: true,
            field: {
              type: 'BooleanExpressionEditor'
            }
          },
          filter: {
            type: 'boolean',
            default: true,
            field: {
              type: 'BooleanExpressionEditor'
            }
          },
          export: {
            type: 'boolean',
            default: false,
            field: {
              type: 'BooleanExpressionEditor'
            }
          },
          import: {
            type: 'boolean',
            default: false,
            field: {
              type: 'BooleanExpressionEditor'
            }
          },
          dateFilter: {
            type: 'boolean',
            default: false,
            field: {
              type: 'BooleanExpressionEditor'
            }
          },
          refresh: {
            type: 'boolean',
            default: true,
            field: {
              type: 'BooleanExpressionEditor'
            }
          },

          automaticRefresh: {
            type: 'boolean',
            default: false,
            field: {
              type: 'BooleanExpressionEditor'
            }
          },
          advancedFiltering: {
            type: 'boolean',
            default: true,
            field: {
              type: 'BooleanExpressionEditor'
            }
          },
          columnsFilters: {
            type: 'boolean',
            default: true,
            field: {
              type: 'BooleanExpressionEditor'
            }
          },
          bulkDelete: {
            type: 'boolean',
            default: true,
            field: {
              type: 'BooleanExpressionEditor'
            }
          },
          bulkEdit: {
            type: 'boolean',
            default: true,
            field: {
              type: 'BooleanExpressionEditor'
            }
          },
          changeItemsPerRow: {
            type: 'boolean',
            default: true,
            field: {
              type: 'BooleanExpressionEditor'
            }
          },
          editLayout: {
            type: 'boolean',
            default: true,
            field: {
              type: 'BooleanExpressionEditor'
            }
          },
          changeDisplayMode: {
            type: 'boolean',
            default: true,
            field: {
              type: 'BooleanExpressionEditor'
            }
          },
          pagination: {
            type: 'boolean',
            default: true,
            field: {
              type: 'BooleanExpressionEditor'
            }
          },
          collapse: {
            type: 'boolean',
            default: true,
            field: {
              type: 'BooleanExpressionEditor'
            }
          },
          formPagination: {
            type: 'boolean',
            default: true,
            field: {
              type: 'BooleanExpressionEditor'
            }
          },
          tableConfiguration: {
            type: 'boolean',
            default: true,
            field: {
              type: 'BooleanExpressionEditor'
            }
          },
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
          useTabsForUngroupedFields: {
            type: 'boolean',
          },
          generalTabLabel: {
            type: 'string',
          },
          tabsNavType: {
            title: 'What style for the tabs',
            type: 'string',
            enum: ['pills', 'tabs'],
            nullable: true,
          },
          tabsDirection: {
            title: 'What style for the tabs',
            type: 'string',
            enum: ['horizontal', 'vertical'],
            nullable: true,
          },
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
          cols: 12
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
          cols: 12
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
    menuIsVisible: false,
    options: {
      initialDisplayMode: 'table',
      columnsDisplayed: 5,
    },
    actions: {
      create: false,
      edit: true,
      view: true,
      delete: false,
      export: false,
      import: false,
    },
    detailPageMode: 'page',
    formOptions: {
      useTabsForUngroupedFields: true,
      tabsNavType: 'tabs',
    },
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

module.exports = model;
