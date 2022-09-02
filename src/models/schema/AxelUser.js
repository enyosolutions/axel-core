module.exports = {
  identity: 'awelUser',
  primaryKeyField: 'id',
  primaryKey: 'id',
  displayField: '{{firstName}} {{lastName}}',
  automaticApi: false,
  apiUrl: '/api/axel-admin/user',
  additionalProperties: false,
  autoValidate: true,
  schema: {
    $id: 'http://acme.com/schemas/axelUser.json',
    type: 'object',
    properties: {
      id: {
        type: 'integer',
        column: {},
        field: {
          readonly: true
        },
        title: 'Id'
      },
      roles: {
        type: 'array',
        default: [
          'USER'
        ],
        items: {
          type: 'string',
          enum: [
            'USER',
            'ADMIN',
            'MANAGER'
          ]
        },
        column: {
          type: 'object',
          multiple: true
        },
        field: {
          type: 'VSelect',
          disabled: '{{ !userHasRole(\'ADMIN\') }}',
          fieldOptions: {
            multi: true,
            multiple: true,
            options: [
              'USER',
              'ADMIN',
              'MANAGER'
            ]
          },
          displayOptions: {
            multiple: true,
            type: 'object'
          },
          options: [
            'USER',
            'ADMIN',
            'MANAGER',
          ]
        },
        title: 'Roles'
      },
      firstName: {
        type: 'string',
        column: {},
        field: {
          required: true
        },
        maxLength: 100,
        title: 'First Name'
      },
      lastName: {
        type: 'string',
        column: {},
        field: {
          required: true
        },
        maxLength: 100,
        title: 'Last Name'
      },
      email: {
        type: 'string',
        format: 'email',
        maxLength: 100,
        column: {},
        field: {
          required: true
        },
        title: 'Email'
      },
      username: {
        type: 'string',
        maxLength: 100,
        column: {},
        field: {
          required: true
        },
        title: 'Username'
      },
      encryptedPassword: {
        type: 'string',
        column: {
          hidden: true
        },
        field: {
          hidden: true
        },
        title: 'Encrypted Password'
      },
      passwordResetToken: {
        type: 'string',
        column: {
          hidden: true
        },
        field: {
          hidden: true
        },
        title: 'Password Reset Token'
      },
      passwordResetRequestedAt: {
        type: 'string',
        format: 'date-time',
        column: {
          type: 'date'
        },
        field: {
          type: 'dateTime'
        },
        title: 'Password Reset Requested At'
      },
      activationToken: {
        type: 'string',
        column: {
          hidden: true
        },
        field: {
          hidden: true
        },
        title: 'Activation Token'
      },
      isActive: {
        type: 'boolean',
        title: 'Is Active'
      },
      hasConfirmedEmail: {
        type: 'boolean',
        default: false,
        title: 'Has Confirmed Email'
      },
      hasCompletedRegistration: {
        type: 'boolean',
        default: false,
        title: 'Has Completed Registration'
      },

      locale: {
        type: 'string',
        column: {},
        field: {},
        title: 'user preferred locale',
        enum: ['en', 'fr', null],
        nullable: true,
        default: 'en',
      },
      lastConnexionOn: {
        type: 'string',
        format: 'date-time',
        column: {
          type: 'date'
        },
        field: {
          type: 'dateTime',
          readonly: true
        },
        title: 'Last Connexion On'
      },
      createdOn: {
        type: 'string',
        format: 'date-time',
        column: {
          type: 'datetime'
        },
        field: {
          type: 'dateTime',
          readonly: true
        },
        title: 'Created On'
      },

    },
    required: [
      'firstName',
      'lastName',
      'email'
    ]
  },
  admin: {
    name: 'Admin User',
    namePlural: 'Admin Users',
    detailPageMode: 'page',
    id: undefined,
    pageTitle: '',
    routerPath: '',
    options: {},
    actions: {},
    formOptions: {},
    listOptions: {},
    kanbanOptions: {},
    tableOptions: {},
    layout: {}
  },
  em: undefined,
  entity: undefined
};
