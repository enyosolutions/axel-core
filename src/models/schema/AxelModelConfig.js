module.exports = {
  identity: 'axelModelConfig',
  collectionName: 'axel-model-config',
  apiUrl: '/api/axel-admin/axel-model-config', // url for front api
  automaticApi: false,
  additionalProperties: false,
  autoValidate: true,
  displayField: 'name',
  schema: {
    $id: 'http://acme.com/schemas/axel-model-config.json',
    type: 'object',
    properties: {
      id: {
        $id: 'id',
        type: 'number',
        title: 'config id', // serves for front form fields
        description: 'The id of this item', // serves for front form hint
      },
      identity: {
        type: 'string',
        enum: [
          'axelModelConfig',
          'axelModelFieldConfig',
          'api_log',
          'banner',
          'barcode',
          'contact',
          'distributor',
          'goodie',
          'history',
          'modelconfig',
          'page',
          'product',
          'regles_de_points',
          'scan_log',
          'setting',
          'stage',
          'user_goodie',
          'user_stage',
        ],
        field: {
          required: true,
          disabled: true,
          readonly: true,
        },
      },
      pageTitle: {
        type: 'string',
        title: 'Custom title for this page',
      },
      name: {
        type: 'string',
        field: {
          required: true,
        },
      },
      icon: {
        type: 'string',
      },
      namePlural: {
        type: 'string',
      },
      options: {
        type: 'object',
        field: {},
        default: {},
        column: { type: 'string' },
        properties: {
          dataPaginationMode: { type: 'string', default: 'local' },
          apiUrl: { type: 'string', default: '' },
          createPath: { type: 'string', default: '' },
          viewPath: { type: 'string', default: '' },
          editPath: { type: 'string', default: '' },
          stats: { type: 'boolean', default: false },
          autoRefresh: { type: 'boolean', field: { disabled: true } }, // or integer in seconds
          initialDisplayMode: { type: 'string', default: 'table' },
          modalMode: { type: 'string', default: 'slide' }, // fade | slide | full
          detailPageMode: {
            type: 'string',
            default: 'sidebar',
            enum: ['modal', 'fullscreen', 'sidebar', 'page'],
          }, // fade | slide | full
          columnsDisplayed: { type: 'integer', default: false },
        },
      },
      actions: {
        type: 'object',
        title: 'Possible actions',
        column: {
          type: 'string',
          title: 'Possible actions',
        },
        default: {},
        properties: {
          create: { type: 'boolean' },
          edit: { type: 'boolean' },
          view: { type: 'boolean' },
          delete: { type: 'boolean' },
          customInlineActions: { type: 'array' },
          customTopActions: { type: 'array' },
          customTabletopActions: { type: 'array' },
        },
      },
      formOptions: {
        title: 'Item display and edit Options',
        description: 'Options on how the field dehaves when displayed in a form (view and edit)',
        type: 'object',
        properties: {
          layout: {
            type: 'object',
            default: {},
            field: {},
          },
        },
      },
      createdOn: {
        type: ['string', 'object'],
        format: 'date-time',
        field: { readonly: true },
        column: {
          type: 'datetime',
        },
      },
      lastModifiedOn: {
        type: ['string', 'object'],
        format: 'date-time',
        field: { readonly: true },
        column: {
          type: 'datetime',
        },
      },
    },
    required: ['identity', 'name'],
  },
  admin: {
    name: null,
    namePlural: null,
    pageTitle: null,
    routerPath: 'axel-model-config',
    actions: {
      create: false,
      edit: true,
      view: true,
      delete: true,
    },
    options: { detailPageMode: 'sidebar' },
  },
};
