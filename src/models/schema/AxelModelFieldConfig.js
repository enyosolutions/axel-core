module.exports = {
  identity: 'axelModelFieldConfig',
  collectionName: 'axel-model-field-config',
  apiUrl: '/api/axel-admin/axel-model-field-config', // url for front api
  additionalProperties: false,
  automaticApi: true,
  autoValidate: true,
  displayField: 'name',
  schema: {
    $id: 'http://acme.com/schemas/axel-model-field-config.json',
    type: 'object',
    properties: {
      id: {
        $id: 'id',
        type: 'number',
        title: 'Config id', // serves for front form fields
        description: 'The id of this item' // serves for front form hint
      },
      parentIdentity: {
        type: 'string',
        relation: 'axelModelConfig',
        field: {
          required: true,
          readonly: true,
          disabled: true,
          type: 'input'
        }
      },
      name: {
        type: 'string',
        field: {
          required: true
        }
      },
      title: {
        type: 'string',
        field: {
          required: true
        }
      },
      type: {
        type: ['string', 'array'],
        default: 'string',
        enum: ['string', 'number', 'array', 'object', 'integer', 'boolean'],
        column: {
        },
        field: {
        },
        items: [{ type: 'string' }]
      },
      description: {
        type: ['null', 'string'],
        default: 'string',
        field: {}
      },
      relation: {
        title: 'relation',
        type: ['null', 'string'],
        description: 'The object that this property is related to',
        example: 'user'
      },
      relationKey: {
        title: 'relationKey',
        type: ['null', 'string'],
        description:
          'The field of the object that this property is related to (eg relation[foreignKey])',
        example: 'user'
      },
      relationLabel: {
        title: 'relationLabel',
        type: ['null', 'string'],
        description:
          'foreign object label',
        example: 'user'
      },
      relationUrl: {
        title: 'relationUrl',
        type: ['null', 'string'],
        description:
          'the url to use to fetch the foreign object',
        example: 'user'
      },
      field: {
        type: 'object',
        title: 'Configuration of the behavior of the property in forms',
        properties: {
          title: {
            type: 'string',
            title: 'Title',
            description: 'The title of the field',
          },
          type: {
            type: 'string',
            title:
              'Field type',
            description: 'The type of the field Case sensisitive. custom types are also supported.',
            enum: ['string',
              'input',
              'number',
              'list-of-value',
              'list-of-data',
              'EnyoSelect',
              'dateTime',
              'DateRange',
              'textArea',
              'VSelect',
              'date',
              'datetime',
              'time',
              'ImagePicker',
              'File',
              'JsonTextarea',

            ]
          },
          inputType: {
            type: 'string',
            title:
              'Input type',
            description: 'Text input comming from https://vue-generators.gitbook.io/vue-generators/fields'
          },
          required: {
            title: 'Required',
            type: ['boolean', 'string'],
            description: 'Form field value is required',
            field: {
              type: 'BooleanExpressionEditor'
            }
          },
          /*
          hidden: {
            title: 'Hidden',
            type: ['boolean', 'string'],
            description: 'Form field is displayed',
            field: {
              type: 'checkbox'
            }
          },
          */
          visible: {
            title: 'Visible',
            type: ['boolean', 'string'],
            description: 'Form field is displayed',
            field: {
              type: 'BooleanExpressionEditor'
            }
          },
          disabled: {
            title: 'Disabled',
            type: ['boolean', 'string'],
            description: 'Field is disabled',
            field: {
              type: 'BooleanExpressionEditor'
            }
          },
          readonly: {
            title: 'Readonly',
            type: ['boolean', 'string'],
            description: 'Field is read only',
            field: {
              type: 'BooleanExpressionEditor'
            }
          },
          styleClasses: {
            type: 'string',
            title: 'Css classes',
            description: 'The class that will be around the field',
            example: 'col-md-12'
          },
          min: {
            type: 'number',
            title: 'Minimum number of characters',
            description: 'the minimum number of characters',
            field: {
              type: 'number'
            }
          },
          max: {
            type: 'number',
            title: 'Maximum number of characters',
            description: 'the maximum number of characters',
            field: {
              type: 'number'
            }
          },
          fieldOptions: {
            title: 'Field options',
            description: 'Options to be used on custom forms fields like multiselect, toggle etc',
            type: 'object',
            properties: {
              multiple: {
                type: 'boolean',
                title: 'Multiple select',
                description: 'If the select is multiple (for selects)'
              },
              enum: {
                type: ['string', 'array'],
                title: 'Values',
                description: `The list of values to use for the select. If the value is string
                  and starts with $store then the value is taken from the vuejs $store`,
                example: '$store.listOfValues.users'
              },
              url: {
                type: 'string',
                title: 'Data url',
                description: 'The url to use to load the data for the select (ajax)',
                example: '/user'
              },
              trackBy: {
                type: 'string',
                title: 'The field to use as the value in the select',
                example: '_id'
              },
              label: {
                type: 'string',
                title: 'The field to use as the Label in the select',
                example: 'username'
              },
              prefix: {
                type: 'string',
                title: 'Text displayed before the value',
                description: 'example : £',
                example: 'username'
              },

              suffix: {
                type: 'string',
                title: 'Text displayed before the value',
                description: 'example : cm | €',
                example: 'username'
              },

              validator: {
                type: 'array',
                description:
                  'the validators used to validate fields https://vue-generators.gitbook.io/vue-generators/validation/built-in-validators'
              },

              displayOptions: {
                title: 'Display options',
                type: 'object',
                description: 'Options to be used specifically on view mode',
                properties: {
                  type: {
                    type: 'string',
                    title:
                      'The type that links to the field option. In case of a dateTime selector, this would be date or datetime',
                    enum: ['date', 'datetime']
                  }
                }
              }
            }
          }
        }
      },
      column: {
        type: 'object',
        description: 'Configuration of the behavior of the property in lists',
        properties: {
          title: {
            type: 'string',
            title: 'The title of the field'
          },
          type: {
            description:
              'The type of the column, comming from https://vue-generators.gitbook.io/vue-generators/fields',
            type: 'string',
            enum: ['string', 'number', 'date', 'datetime', 'image', 'html', 'relation', 'object', 'boolean', 'url']
          },
          hidden: {
            type: 'string',
            description: 'If the form field is displayed',
            title: 'Hide this column'
          },
          prefix: {
            type: 'string',
            title: 'Text displayed before the value',
            description: 'example : £',
            example: 'username'
          },

          suffix: {
            type: 'string',
            title: 'Text displayed before the value',
            description: 'example : cm | €',
            example: 'username'
          }
        }
      },
      createdOn: {
        type: ['string', 'object'],
        format: 'date-time',
        field: { readonly: true },
        column: {
          type: 'datetime'
        }
      },
      lastModifiedOn: {
        type: ['string', 'object'],
        format: 'date-time',
        field: { readonly: true },
        column: {
          type: 'datetime'
        }
      }
    },
    required: ['parentIdentity', 'name']
  },
  admin: {
    routerPath: 'axel-model-field-config',
    name: 'Field config',
    namePlural: 'Fields configs',
    layout: {
      columns: [

      ]
    },
    actions: {
      create: false,
      edit: true,
      view: true,
      delete: true,
      export: true,
      import: true,
    },
    options: {
      detailPageMode: 'page',
      useCustomLayout: false
    }
  }
};
