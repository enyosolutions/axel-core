<template>
  <div>
    <!-- Page Heading -->
    <div class="d-sm-flex align-items-center justify-content-between mb-4">
      <h1
        class="h3 mb-0 text-gray-800 text-center w-100"
        style="font-size: 200px"
      >
        NOT FOUND
      </h1>
    </div>

    <!-- Content Row -->
    <div class="row">
      <div class="col-12 text-center w-100">
        Sorry the page you are looking for is not here...
      </div>
    </div>
  </div>
</template>
<script>
// import { mapState } from 'vuex';
import Swal2 from 'sweetalert2';
import DisconnectedConfig from '@/components/swal/Disconnected';

export default {
  name: 'NotFound',
  components: {},
  computed: {
    isConnected() {
      return this.$socket && this.$socket.connected;
    },

    selectedModel() {
      if (!this.newApi.name) {
        return null;
      }
      return this.models.find((m) => m.name === this.newApi.name);
    },
  },
  watch: {
    'socket.connected': function (newVal, oldVal) {
      if (!newVal && oldVal !== newVal) {
        this.blockingModal = Swal2.fire(DisconnectedConfig);
      } else if (this.blockingModal) {
        this.blockingModal.close();
        this.refreshLists();
      }
    },
  },
  data() {
    return {
      message: 'Hello Vue !',
      controllers: [],
      models: [],
      routes: null,
      blockingModal: null,
      newApi: {
        name: '',
        type: null,
        withSchema: true,
        fields: [],
      },
      newApiTemplate: {
        name: '',
        type: null,
        withSchema: true,
        fields: [{}],
      },
      fieldTypes: ['string', 'text', 'integer', 'boolean', 'date', 'datetime'],
      modelEditModalMode: 'api', // api | model || add-field
    };
  },
  mounted() {
    this.$socket.on('connect', () => {
      this.refreshLists();
    });

    this.$socket.on('disconnect', () => {});

    this.$socket.on('hello', (second) => {
      console.log('hello', second);
    });

    //    $.fn.modal.Constructor.prototype._enforceFocus = function() {};
  },

  methods: {
    $notify(text, type) {
      return Swal2.fire({
        title: text,
        icon: type || 'info',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
      });
    },
    refreshLists() {
      this.listControllers();
      this.listModels();
      this.listRoutes();
    },

    addField() {
      this.newApi.fields.push({ type: 'string' });
    },

    importFields() {
      Swal2.fire({
        title: 'Copy paste the list of fields',
        input: 'textarea',
      }).then((result) => {
        if (result.value) {
          let fields = result.value
            .split('\n')
            .map((f) => f.trim())
            .filter((f) => f);
          if (fields.length === 1) {
            fields = fields[0].split(',').map((f) => f.trim());
          }
          fields.forEach((fieldName) => {
            if (fieldName.includes(' ')) {
              fieldName = this.toCamelCase(fieldName);
            }
            this.newApi.fields.push({
              name: fieldName,
              type: 'string',
            });
          });
        }
      });
    },

    deleteLine(idx) {
      this.newApi.fields.splice(idx, 1);
    },

    async listControllers() {
      this.$socket.emit('/axel-manager/controllers', (err, data) => {
        if (err) {
          console.warn(err.message);
          return;
        }
        this.controllers = data.body;
      });
    },

    async listModels() {
      this.models = [];
      this.$socket
        .get('/axel-manager/models', {
          body: { full: true },
          query: { full: true },
        })
        .then((data) => {
          this.models = data.body && data.body.models;
          this.tables = data.body && data.body.tables;
        })
        .catch((err) => {
          console.warn(err.message);
        });
    },

    async listRoutes() {
      this.routes = [];
      this.$socket
        .get('/axel-manager/routes')
        .then((data) => {
          this.routes = data.body;
        })
        .catch((err) => {
          console.warn(err.message);
        });
    },

    async syncModel(modelName, options = { alter: true }) {
      const { force, alter } = options;
      this.$socket.emit(
        '/axel-manager/models/sync',
        { method: 'POST', body: { id: modelName, force, alter } },
        (err) => {
          if (err) {
            console.warn(err);
            this.$notify(
              `Error while updating Model ${modelName} [${err.message || err}]`,
              'error'
            );
            return;
          }
          this.$notify(`Model ${modelName} was updated`, 'success');
          this.listModels();
        }
      );
    },

    async createController() {
      const values = await Swal2.fire({
        title: 'Create a new controller',
        html: `
                 <input id="swal-name" class="swal2-input" placeholder="Name">
                 <select id="swal-type" class="swal2-input" placeholder="type">
                   <option selected>bare</option>
                   <option>sql</option>
                   <option disabled>mongo</option>
                 </select>
                   <label>
                 <input id="swal-force" type="checkbox" class="swal2-checkbox" placeholder="force" value="true">
                 Force
                 </label>
                 `,
        focusConfirm: false,
        showCancelButton: true,
        reverseButtons: true,
        preConfirm: () => {
          let values = [
            document.getElementById('swal-name').value,
            document.getElementById('swal-type').value,
            document.getElementById('swal-force').value == 'true',
          ];
          values = values.filter((v) => v);
          if (values.length < 3) {
            return Swal2.fire({
              title: 'Please fill in all the data',
              icon: 'error',
            });
          }
          if (values[2] == 'true') {
            values[2] = true;
          }
          return values;
        },
      });
      this.$socket
        .post('/axel-manager/controllers', {
          body: {
            name: values.value[0],
            type: values.value[1],
            force: values.value[2],
          },
        })
        .then(() => {
          return Swal2.fire({
            title: 'Controller successfully created',
            icon: 'success',
          });
        })
        .catch((err) => {
          return Swal2.fire({ title: err.message, icon: 'error' });
        });
    },

    async createModel() {
      const values = await Swal2.fire({
        title: 'Create a new controller',
        html: `
                 <input id="swal-name" class="swal2-input" placeholder="Name">
                 <select id="swal-type" class="swal2-input" placeholder="type">
                   <option selected>bare</option>
                   <option>sql</option>
                   <option disabled>mongo</option>
                 </select>
                   <label>
                 <input id="swal-force" type="checkbox" class="swal2-checkbox" placeholder="force" value="true">
                 Force
                 </label>
                 `,
        focusConfirm: false,
        showCancelButton: true,
        reverseButtons: true,
        preConfirm: () => {
          let values = [
            document.getElementById('swal-name').value,
            document.getElementById('swal-type').value,
            document.getElementById('swal-force').value == 'true',
          ];
          values = values.filter((v) => v);
          if (values.length < 3) {
            return Swal2.fire({
              title: 'Please fill in all the data',
              icon: 'error',
            });
          }
          if (values[2] == 'true') {
            values[2] = true;
          }
          return values;
        },
      });
      this.$socket
        .post('/axel-manager/controllers', {
          body: {
            name: values.value[0],
            type: values.value[1],
            force: values.value[2],
          },
        })
        .then(() => {
          return Swal2.fire({
            title: 'Controller successfully created',
            icon: 'success',
          });
        })
        .catch((err) => {
          return Swal2.fire({ title: err.message, icon: 'error' });
        });
    },

    async createRoute() {
      const values = await Swal2.fire({
        title: 'Create a new route',
        html: `
                 <input id="swal-name" class="swal2-input" placeholder="Name">
                `,
        focusConfirm: false,
        showCancelButton: true,
        reverseButtons: true,
        preConfirm: () => {
          let values = [document.getElementById('swal-name').value];
          values = values.filter((v) => v);
          if (values.length < 1) {
            return Swal2.fire({
              title: 'Please fill in all the data',
              icon: 'error',
            });
          }
          if (values[2] == 'true') {
            values[2] = true;
          }
          return values;
        },
      });
      this.$socket
        .post('/axel-manager/routes', { body: { name: values.value[0] } })
        .then(() => {
          return Swal2.fire({
            title: 'Route successfully created',
            icon: 'success',
            toast: true,
          });
        })
        .catch((err) => {
          return Swal2.fire({ title: err.message, icon: 'error' });
        });
    },

    async validateCreateModelForm() {
      this.newApi.fields = this.newApi.fields.filter((f) => f.name);
      if (!this.newApi.name) {
        Swal2.fire({ title: 'Missing api name', toast: true });
        return;
      }
      if (!this.newApi.type) {
        Swal2.fire({ title: '⚠️ Missing api type', toast: true });
        return;
      }
      if (!this.newApi.fields.length) {
        Swal2.fire({
          title: '⚠️ Missing api fields',
          type: 'error',
          toast: true,
        });
        return;
      }

      if (!this.newApi.fields.filter((f) => f.primaryKey).length) {
        Swal2.fire({
          title: 'You need to define at least one primary key field',
          toast: true,
        });
        return;
      }
    },

    async createApi() {
      this.validateCreateModelForm();
      this.$socket
        .post('/axel-manager/api', { body: { ...this.newApi } })
        .then(() => {
          this.resetApiForm();
          return Swal2.fire({
            title: 'Api successfully created',
            icon: 'success',
            toast: true,
          });
        })
        .catch((err) => {
          return Swal2.fire({ title: err.message, icon: 'error' });
        });
    },

    async createModelApi() {
      this.validateCreateModelForm();
      this.$socket
        .post('/axel-manager/models', { body: { ...this.newApi } })
        .then(() => {
          this.resetApiForm();
          return Swal2.fire({
            title: 'MOdel successfully created',
            icon: 'success',
            toast: true,
          });
        })
        .catch((err) => {
          return Swal2.fire({ title: err.message || err, icon: 'error' });
        });
    },

    async addFieldsToModel() {
      this.validateCreateModelForm();
      this.$socket
        .post('/axel-manager/models/add-fields', {
          body: {
            ...this.newApi,
            model: this.newApi.name,
            name: undefined,
          },
        })
        .then(() => {
          return Swal2.fire({
            title: 'Model successfully created',
            icon: 'success',
            toast: true,
          });
        })
        .catch((err) => {
          console.log('err', err);

          return Swal2.fire({ title: err.message || err, icon: 'error' });
        });
    },

    async resetModelsAdminConfig() {
      this.$socket
        .post('/axel-manager/reset-models-config', { body: { ...this.newApi } })
        .then(() => {
          return Swal2.fire({
            title: 'Models successfully resetted',
            icon: 'success',
            toast: true,
          });
        })
        .catch((err) => {
          return Swal2.fire({ title: err.message, icon: 'error' });
        });
    },
    resetApiForm() {
      this.newApi = Object.assign({}, this.newApiTemplate);
      this.newApi.fields = [];
    },

    toCamelCase(string) {
      string = string
        .toLowerCase()
        .replace(/(?:(^.)|([-_\s]+.))/g, function (match) {
          return match.charAt(match.length - 1).toUpperCase();
        });
      return string.charAt(0).toLowerCase() + string.substring(1);
    },
  },
};
</script>

<style>
.page-dashboard-overlay {
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1;
  background: rgba(78, 76, 93, 0.8);
}
.v-step__arrow.v-step__arrow--dark::before {
  background-color: #f4f4f4 !important;
}
.v-step__header {
  background-color: teal !important;
  color: #fff !important;
}
</style>
