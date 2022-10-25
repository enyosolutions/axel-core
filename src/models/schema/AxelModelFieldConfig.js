module.exports = {
  identity: 'axelModelFieldConfig',
  collectionName: 'axel-model-field-config',
  apiUrl: '/api/axel-admin/axel-model-field-config', // url for front api
  additionalProperties: false,
  automaticApi: true,
  autoValidate: true,
  displayField: 'name',
  schema: {
    $id: 'http://enyosolutions.com/schemas/axel-model-field-config.json',
    type: 'object',
    required: ['parentIdentity', 'name'],
    properties: {
      id: {
        $id: 'id',
        type: 'number',
        title: 'Config id', // serves for front form fields
        description: 'The id of this item', // serves for front form hint
        field: {
          required: false
        }
      },
      parentIdentity: {
        type: 'string',
        relation: 'axelModelConfig',
        field: {
          required: true,
          readonly: '{{ context.mode !== "create" }}',
          disabled: '{{ context.mode !== "create" }}',
        }
      },
      name: {
        type: 'string',
        field: {
          required: true
        }
      },
      title: {
        title: 'The title of the field',
        description: ' used in listing, and form labelling',
        type: 'string',
        field: {
          required: true
        }
      },
      type: {
        title: 'The type of the field',
        description: 'expect a json schema type',
        type: ['string', 'array'],
        default: 'string',
        enum: ['string', 'number', 'array', 'object', 'integer', 'boolean', 'date', 'null', 'any'],
        column: {
        },
        field: {
        },
        items: {
          type: 'string'
        }
      },
      description: {
        type: ['null', 'string'],
        default: 'string',
        field: {}
      },
      enum: {
        title: 'Possible values for the field',
        type: 'array',
        items: {
          type: 'string',
        },
        description: 'The list of values to use for the select.',
        field: {
          // type: 'array',
          type: 'vSelect',
          fieldOptions: {
            multiple: true,
            taggable: true
          }
        }
      },
      default: {
        type: ['string', 'number', 'boolean', 'null', 'array', 'object'],
        title: 'Default value',
        nullable: true,
        description: 'The object that this property is related to',
        examples: ['user'],
        additionalProperties: true,
      },
      nullable: {
        type: ['boolean'],
        title: 'Can we send null as a value ?',
        description: '',
        default: false
      },
      relation: {
        title: 'relation',
        type: ['null', 'string'],
        description: 'The object that this property is related to',
        examples: ['user'],
        field: {
          type: 'vSelect',
          fieldOptions: {
            taggable: true,
            url: '/api/axel-admin/models',
            label: 'name',
            trackBy: 'identity',
          }
        }
      },
      relationKey: {
        title: 'relationKey',
        type: ['null', 'string'],
        field: {
          type: 'vSelect',
          fieldOptions: {
            taggable: true,
            url: '/api/axel-admin/axel-model-field-config?filters%5B%5D=&filters%5BparentIdentity%5D={{ currentItem.relation }}',
            label: 'name',
            trackBy: 'name',
          }
        },
        description:
          'The field of the object that this property is related to (eg relation[foreignKey]). Leave empty to use the relation.primaryKeyField',
        examples: ['id']
      },
      relationLabel: {
        title: 'relationLabel',
        type: ['null', 'string'],
        description:
          'The field of the relation used to display. Leave empty to use the relation.displayField',
        field: {
          type: 'vSelect',
          fieldOptions: {
            taggable: true,
            url: '/api/axel-admin/axel-model-field-config?filters%5B%5D=&filters%5BparentIdentity%5D={{ currentItem.relation }}',
            label: 'name',
            trackBy: 'name',
          }
        },
        examples: ['user']
      },
      relationUrl: {
        title: 'relationUrl',
        type: ['null', 'string'],
        description:
          'the url to use to fetch the foreign object',
        examples: ['user']
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
            enum: [
              'string',
              'input',
              'number',
              'list-of-value',
              'list-of-data',
              'vSelect',
              'dateTime',

              'datetime', 'date',
              'time',
              'DateRange',
              'textArea',
              'JsonTextarea',

              'ImagePicker',
              'FilePicker',
              'FileInput',
              'Base64Upload',
              'array',
              'EnyoSelect',
            ],
            field: {
              type: 'vSelect',
              fieldOptions: { taggable: true }
            }
          },

          inputType: {
            type: 'string',
            title:
              'Input type',
            description: 'Text input comming from https://vue-generators.gitbook.io/vue-generators/fields',
            field: {
              visible: "{{ !!currentItem.field &&currentItem.field.type === 'input' }}"
            }
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
            title: 'Css classes (@deprecated use classes)',
            description: 'The class that will be around the field',
            examples: ['col-md-12']
          },
          classes: {
            type: 'string',
            title: 'Css classes of the field',
            description: 'The class that will be around the field',
            examples: ['col-md-12', 'card']
          },
          labelClasses: {
            type: 'string',
            title: 'Css classes for the label',
            description: 'The class that will be around the label',
            examples: ['text-danger']
          },
          innerClasses: {
            type: 'string',
            title: 'Css classes for the inner block',
            description: 'The class that will be around the block (usefull for cols and row padding)',
            examples: ['card-body']
          },
          relationRoute: {
            type: 'string',
            title: 'Route to access the relation',
            description: 'The front url to access the relation',
            examples: ['/app/user']
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
          cols: {
            type: 'number',
            title: 'Width of the field (cols)',
            description: 'the number of grid columns the item takes (1 - 12)',
            enum: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
            field: {
              min: 1,
              max: 12
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
                description: 'If the select is multiple (for selects)',
                field: {
                  visible: "{{ !!currentItem.field && ['vSelect', 'select', 'EnyoSelect'].includes(currentItem.field.type) }}"
                }
              },
              taggable: {
                type: 'boolean',
                title: 'Select accept new items',
                description: 'Select accept new items [vSelect]',
                examples: ['/user'],
                field: {
                  visible: "{{ !!(currentItem.field && currentItem.field.type === 'vSelect') }}"
                }
              },
              enum: {
                type: ['array', 'string'],
                title: 'Values',
                description: `The list of values to use for the select. If the value is string
                  and starts with $store then the value is taken from the vuejs $store`,
                examples: ['$store.listOfValues.users'],
                field: {
                  visible: "{{ !!currentItem.field && ['vSelect', 'select', 'EnyoSelect'].includes(currentItem.field.type) }}"
                }
              },
              url: {
                type: 'string',
                title: 'Api url',
                description: 'The url to use to load the data for the select (ajax) [vSelect]',
                examples: ['/user'],
                field: {
                  visible: "{{ !!(currentItem.field && currentItem.field.type === 'vSelect') }}"
                }
              },

              trackBy: {
                type: 'string',
                title: 'The field to use as the value in the select',
                examples: ['_id'],
                field: {
                  visible: "{{ !!currentItem.field && currentItem.field.type === 'vSelect' }}"
                }
              },
              label: {
                type: 'string',
                title: 'The field to use as the Label in the select',
                examples: ['username'],
                field: {
                  visible: "{{ !!currentItem.field && currentItem.field.type === 'vSelect' }}"
                }
              },
              disableRelationActions: {
                type: 'boolean',
                title: 'disableRelationActions on the select',
                field: {
                  visible: "{{ (!currentItem.field || currentItem.field.type === 'vSelect') && !!currentItem.relation  }}"
                }
              },
              hideIdsInSelect: {
                type: 'boolean',
                title: 'hide ids when show select options',
                field: {
                  visible: "{{ (!currentItem.field || currentItem.field.type === 'vSelect') && !!currentItem.relation  }}"
                }
              },
              prefix: {
                type: 'string',
                title: 'Prefix',
                description: 'Text displayed before the value. example : £',
                examples: ['username']
              },

              suffix: {
                type: 'string',
                title: 'Suffix',
                description: 'Text displayed after the value. example : cm | €',
                examples: ['username']
              },

              validator: {
                type: ['array', 'string'],
                title: 'Validators',
                items: {
                  type: 'string'
                },
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
                    title: 'Field type',
                    description:
                      'The type that links to the display',
                    field: {
                      enum: [
                        'string',
                        'number',
                        'boolean',
                        'url',
                        'image',
                        'date',
                        'datetime',
                        'checkbox',
                        'relation',
                        'object',
                      ],
                      type: 'vSelect'
                    }
                  },
                  prefix: {
                    type: 'string',
                    title: 'Prefix',
                    description: 'Text displayed before the value. example : £',
                    examples: ['username']
                  },

                  suffix: {
                    type: 'string',
                    title: 'Suffix',
                    description: 'Text displayed after the value. example : cm | €',
                    examples: ['username']
                  },
                  format: {
                    title: 'Format',
                    description: 'The format to use for custom rendering this field (for objects, dates and text)',
                    examples: ['example :  {{ currentItem.firstname + " " + currentItem.lastname }} | "DD / MM / YYYY"'],
                  },
                  component: {
                    title: 'The component to use to display this field (for objects, dates and text)',
                    type: ['string', 'object'],
                    description: 'example : "MapDisplay" | "GalleryComponent"',
                    examples: ['MapDisplay', 'GalleryComponent']
                  }
                }
              }
            }
          }
        }
      },

      column: {
        type: 'object',
        title: 'Column configuration',
        description: 'Configuration of the behavior of the property in lists',
        properties: {
          title: {
            type: 'string',
            title: 'The title of the field'
          },
          type: {
            title: 'Column type',
            description:
              'The type of the column, comming from https://vue-generators.gitbook.io/vue-generators/fields',
            type: 'string',
            enum: ['string', 'number', 'date', 'datetime', 'image', 'html', 'relation', 'object', 'boolean', 'url'],
            field: {
              type: 'vSelect',
              fieldOptions: {
                taggable: true
              }
            },
          },
          hidden: {
            title: 'Hide this column',
            type: 'boolean',
            description: 'If the form field is displayed',
            default: false
          },
          prefix: {
            title: 'Text displayed before the value',
            type: 'string',
            description: 'example : £',
            examples: ['username']
          },

          suffix: {
            title: 'Text displayed before the value',
            type: 'string',
            description: 'example : cm | €',
            examples: ['username']
          },
          format: {
            title: 'Format',
            description: 'The format to use for custom rendering this field (for objects, dates and text)',
            examples: ['example :  {{ currentItem.firstname + " " + currentItem.lastname }} | "DD / MM / YYYY"'],
          },
          component: {
            title: 'The component to use to display this field (for objects, dates and text)',
            type: ['string', 'object'],
            description: 'example : "MapDisplay" | "GalleryComponent"',
            examples: ['MapDisplay', 'GalleryComponent']
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
  },
  admin: {
    routerPath: 'axel-model-field-config',
    name: 'Field config',
    namePlural: 'Fields configs',
    listOptions: {
      titleField: 'title',
      subtitleField: 'field.type',
      perPage: 50,
      perRow: 1
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
