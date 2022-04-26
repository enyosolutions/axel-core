<template>
  <div>
    <!-- Page Heading -->
    <div class="d-sm-flex align-items-center justify-content-between mb-1">
      <h1 class="h3 mb-0 text-gray-800">Dashboard</h1>
      <a
        href="#"
        class="d-none d-sm-inline-block btn btn-sm btn-primary shadow-sm"
        @click="
          openModal('newApiModal');
          resetApiForm();
          modelEditModalMode = 'api';
        "
        ><i class="fa fa-plus fa-sm text-white-50"></i> New Api</a
      >
    </div>

    <!-- Content Row -->
    <div class="row">
      <div class="col-4 col-xs-12">
        <div class="card shadow mb-4">
          <div
            class="card-header py-3 d-flex flex-row align-items-center justify-content-between"
          >
            <h6 class="m-0 font-weight-bold text-primary">
              Models
              <span class="badge badge-primary">{{ models.length }}</span>
            </h6>

            <div class="btn-group float-right">
              <button class="btn btn-link mr-2" @click="listModels()">
                <i class="fa fa-sync"></i>
              </button>
              <button
                class="btn btn-link p-0"
                @click="
                  openModal('newApiModal');
                  resetApiForm();
                  modelEditModalMode = 'model';
                "
              >
                <i class="fa fa-plus"></i>
              </button>
            </div>
          </div>
          <div class="card-body p-2">
            <table class="table table-bordered" id="dataTable" cellspacing="0">
              <thead>
                <tr>
                  <td>
                    <span class="text-secondary">ALL</span>
                    <div class="float-right">
                      <button
                        class="btn btn-primary badge"
                        @click="syncModel('$ALL')"
                      >
                        sync
                      </button>
                      <button
                        class="btn btn-secondary badge"
                        @click="syncModel('$ALL', { force: true, alter: true })"
                      >
                        Drop and sync
                      </button>
                    </div>
                  </td>
                </tr>
              </thead>
              <tbody>
                <tr v-for="model in models" :key="model.identity">
                  <td>
                    {{ model.name }}
                    <div class="float-right">
                      <button
                        class="btn btn-info badge mr-1"
                        @click="
                          resetApiForm();
                          modelEditModalMode = 'add-field';
                          newApi.name = model.name;
                          newApi.type = 'sql';
                          openModal('newApiModal');
                        "
                      >
                        <i class="fa fa-edit"></i> Edit
                      </button>
                      <button
                        class="btn btn-primary badge mr-1"
                        @click="syncModel(model.name)"
                      >
                        sync
                      </button>
                      <button
                        class="btn btn-secondary badge mr-1"
                        @click="
                          syncModel(model.name || model.identity, {
                            force: true,
                            alter: true,
                          })
                        "
                      >
                        Drop and sync
                      </button>
                      <button
                        class="btn btn-danger badge"
                        @click="deleteModel(model.name)"
                      >
                        <i class="fa fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="col-4 col-xs-12">
        <div class="card shadow mb-4">
          <div
            class="card-header py-3 d-flex flex-row align-items-center justify-content-between"
          >
            <h6 class="m-0 font-weight-bold text-primary">
              Controllers
              <span class="badge badge-primary">{{
                Object.keys(controllers).length
              }}</span>
            </h6>
            <div class="btn-group float-right">
              <button class="btn btn-link mr-2" @click="listControllers()">
                <i class="fa fa-sync"></i>
              </button>
              <button class="btn btn-link p-0" @click="createController()">
                <i class="fa fa-plus"></i>
              </button>
            </div>
          </div>
          <div class="card-body p-2">
            <table class="table table-bordered" id="dataTable" cellspacing="0">
              <thead>
                <tr></tr>
              </thead>

              <tbody>
                <tr v-for="(controller, id) in controllers" :key="id">
                  <td>{{ id }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="col-4">
        <div class="card shadow mb-4">
          <div
            class="card-header py-3 d-flex flex-row align-items-center justify-content-between"
          >
            <h6 class="m-0 font-weight-bold text-primary">
              Routes
              <span class="badge badge-primary">{{
                Object.keys(controllers).length
              }}</span>
            </h6>
            <div class="float-right">
              <button class="btn btn-link p-0" @click="listRoutes()">
                <i class="fa fa-sync"></i>
              </button>
              <button class="btn btn-link p-0" @click="createRoute()">
                <i class="fa fa-plus"></i>
              </button>
            </div>
          </div>
          <div class="card-body p-2 table-responsive">
            <table class="table table-bordered" id="dataTable" cellspacing="0">
              <thead>
                <tr>
                  <th>Route</th>
                  <th>Target</th>
                </tr>
              </thead>

              <tbody style="max-height: 50vh; overflow: auto">
                <tr v-for="(route, id) in routes" :key="id">
                  <td style="width: 40%">{{ id }}</td>
                  <td>{{ route }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <div class="row">
      <!-- Content Row -->
      <div class="row">
        <div class="col-12">
          <div class="card shadow mb-4">
            <div
              class="card-header py-3 d-flex flex-row align-items-center justify-content-between"
            >
              <h6 class="m-0 font-weight-bold text-primary">Raw</h6>
            </div>
            <div class="card-body">
              <pre id="jstree"></pre>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      class="modal fade"
      id="newApiModal"
      tabindex="-1"
      role="dialog"
      aria-labelledby="exampleModalLabel"
      aria-hidden="true"
    >
      <div class="modal-dialog modal-lg" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="exampleModalLabel">
              Create new {{ modelEditModalMode }}
            </h5>
            <button
              class="close"
              type="button"
              data-dismiss="modal"
              aria-label="Close"
              @click="closeModal('newApiModal')"
            >
              <span aria-hidden="true">×</span>
            </button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Name</label>
              <input
                v-model="newApi.name"
                type="text"
                class="form-control"
                placeholder="Api name"
                :disabled="modelEditModalMode == 'add-field'"
              />
            </div>
            <div
              class="form-group"
              v-if="
                modelEditModalMode == 'api' || modelEditModalMode == 'model'
              "
            >
              <label> DB type</label>
              <select
                v-model="newApi.type"
                type="text"
                class="form-control"
                placeholder="Api type"
              >
                <option disabled selected>Api type</option>
                <option value="sql">Sql</option>
                <option value="mongo">Mongo</option>
              </select>
            </div>
            <div class="form-check" v-if="newApi.type == 'sql'">
              <input
                v-model="newApi.withSchema"
                type="checkbox"
                class="form-check-input"
                placeholder="Api type"
              />
              <label class="form-check-label"> Also generate Schema ?</label>
            </div>
            <hr />
            <div class="form-group">
              <div class="float-right">
                <button
                  class="btn btn-link p-0"
                  @click="importFields()"
                  title="Bullk add field"
                  data-tooltip="Bulk add field"
                >
                  <i class="fa fa-list-alt"></i>
                </button>
                <button
                  class="btn btn-link p-0"
                  @click="addField()"
                  title="Add field"
                  data-tooltip="Add field"
                >
                  <i class="fa fa-plus"></i>
                </button>
              </div>
              <table
                class="table table-bordered"
                id="dataTable"
                cellspacing="0"
              >
                <thead>
                  <tr>
                    <td>Name</td>
                    <td>Type</td>
                    <td>Primary key</td>
                    <td>Required</td>
                    <td>Autoincrement</td>
                    <td>Actions</td>
                  </tr>
                </thead>

                <tbody>
                  <template
                    v-if="
                      modelEditModalMode === 'add-field' &&
                      selectedModel &&
                      selectedModel.fields
                    "
                  >
                    <tr v-for="field of selectedModel.fields" :key="field.name">
                      <td>{{ field.name }}</td>
                      <td>{{ field.type }}</td>
                      <td>{{ field.primaryKey }}</td>
                      <td>{{ !field.allowNull }}</td>
                      <td>{{ field.autoIncrement }}</td>
                      <td></td>
                    </tr>
                  </template>
                  <tr v-for="(field, idx) in newApi.fields" :key="idx">
                    <td>
                      <input
                        v-model="field.name"
                        type="text"
                        class="form-control"
                        placeholder="Field name"
                      />
                    </td>
                    <td>
                      <select
                        v-model="field.type"
                        type="text"
                        class="form-control"
                        placeholder="Field type"
                      >
                        <option v-for="type in fieldTypes" :key="type">
                          {{ type }}
                        </option>
                      </select>
                    </td>
                    <td>
                      <input
                        v-model="field.primaryKey"
                        type="checkbox"
                        class=""
                        placeholder="Primary"
                      />
                    </td>
                    <td>
                      <input
                        :disabled="field.primaryKey"
                        v-model="field.required"
                        type="checkbox"
                        placeholder="Required"
                      />
                    </td>
                    <td>
                      <input
                        :disabled="!field.primaryKey"
                        v-model="field.autoIncrement"
                        type="checkbox"
                        placeholder="Required"
                      />
                    </td>
                    <td>
                      <button
                        @click="deleteLine(idx)"
                        type="checkbox"
                        class="btn btn-icon btn-link"
                        placeholder="Required"
                      >
                        <i class="fa fa-times text-danger"></i>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
              <hr />
              <div class="text-right" v-if="modelEditModalMode == 'add-field'">
                <input
                  id="forceSync"
                  type="checkbox"
                  class="form-control-checkbox"
                  placeholder="force"
                  v-model="syncNewFields"
                  value="true"
                />
                <label for="forceSync"> Sync to database</label>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button
              class="btn btn-secondary"
              type="button"
              data-dismiss="modal"
              @click="closeModal('newApiModal')"
            >
              Cancel
            </button>
            <button
              v-if="modelEditModalMode == 'api'"
              class="btn btn-primary"
              @click="createApi"
              :disabled="!newApi || !newApi.name || !newApi.type"
            >
              Create Api
            </button>
            <button
              v-if="modelEditModalMode == 'model'"
              class="btn btn-success"
              @click="createModel"
              :disabled="
                !newApi || !newApi.name || !newApi.type || !newApi.fields.length
              "
            >
              Create Model
            </button>
            <button
              v-if="modelEditModalMode == 'add-field'"
              class="btn btn-success"
              @click="addFieldsToModel()"
              :disabled="
                !newApi || !newApi.name || !newApi.type || !newApi.fields.length
              "
            >
              Add field(s)
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
// import { mapState } from 'vuex';
import Swal2 from 'sweetalert2';
import { openModal, closeModal } from '@/services/modal';

export default {
  name: 'DefaultDashboard',
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
    '$socket.connected': function (newVal) {
      if (newVal) {
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
      socket: this.$socket,
      syncNewFields: false,
    };
  },
  mounted() {
    if (this.$socket.connected) {
      this.refreshLists();
    }
    this.$socket.on('connect', () => {
      this.refreshLists();
    });

    this.$socket.on('disconnect', () => {});

    //    $.fn.modal.Constructor.prototype._enforceFocus = function() {};
  },

  methods: {
    openModal,
    closeModal,
    appNotify(text, type) {
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
          this.models
            = data.body
            && data.body.models.filter((model) => !model.name.startsWith('axel'));
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
          let vals = [
            document.getElementById('swal-name').value,
            document.getElementById('swal-type').value,
            document.getElementById('swal-force').value === 'true',
          ];
          vals = vals.filter((v) => v);
          if (vals.length < 3) {
            return Swal2.fire({
              title: 'Please fill in all the data',
              icon: 'error',
            });
          }
          if (vals[2] === 'true') {
            vals[2] = true;
          }
          return vals;
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
        .then(() =>
          Swal2.fire({
            title: 'Controller successfully created',
            icon: 'success',
          }))
        .catch((err) => Swal2.fire({ title: err.message, icon: 'error' }));
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
          let vals = [document.getElementById('swal-name').value];
          vals = vals.filter((v) => v);
          if (vals.length < 1) {
            return Swal2.fire({
              title: 'Please fill in all the data',
              icon: 'error',
            });
          }
          if (vals[2] === 'true') {
            vals[2] = true;
          }
          return vals;
        },
      });
      this.$socket
        .post('/axel-manager/routes', { body: { name: values.value[0] } })
        .then(() =>
          Swal2.fire({
            title: 'Route successfully created',
            icon: 'success',
            toast: true,
          }))
        .catch((err) => Swal2.fire({ title: err.message, icon: 'error' }));
    },

    validateCreateModelForm(options = {}) {
      const { context } = options || {};
      this.newApi.fields = this.newApi.fields.filter((f) => f.name);
      if (!this.newApi.name) {
        Swal2.fire({ title: 'Missing api name' });
        return false;
      }
      if (!this.newApi.type) {
        Swal2.fire({ title: '⚠️ Missing api type' });
        return false;
      }
      if (!this.newApi.fields.length) {
        Swal2.fire({
          title: '⚠️ Missing api fields',
          type: 'error',
        });
        return false;
      }
      if (context && context === 'create') {
        if (!this.newApi.fields.filter((f) => f.primaryKey).length) {
          Swal2.fire({
            title: 'You need to define at least one primary key field',
          });
          return false;
        }
      }
      return true;
    },

    async createApi() {
      if (!this.validateCreateModelForm({ context: 'create' })) {
        return;
      }
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
        .catch((err) => Swal2.fire({ title: err.message, icon: 'error' }));
    },

    async createModel() {
      if (!this.validateCreateModelForm({ context: 'create' })) {
        return;
      }
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
        .catch((err) =>
          Swal2.fire({ title: err.message || err, icon: 'error' }));
    },
    /**
     * Delete model file
     */
    async deleteModel(name) {
      if (!(await this.$awConfirm())) {
        return;
      }
      this.$socket
        .delete('/axel-manager/models', { body: { name } })
        .then(() => {
          this.refreshLists();
          Swal2.fire({
            title: 'MOdel successfully deleted',
            icon: 'success',
            toast: true,
          });
        })
        .catch((err) =>
          Swal2.fire({ title: err.message || err, icon: 'error' }));
    },

    async addFieldsToModel() {
      if (!this.validateCreateModelForm()) {
        return;
      }
      this.$socket
        .post('/axel-manager/models/add-fields', {
          body: {
            ...this.newApi,
            model: this.newApi.name,
            name: undefined,
            sync: this.syncNewFields,
          },
        })
        .then(() => {
          closeModal('newApiModal');
          return Swal2.fire({
            title: 'Model successfully created',
            icon: 'success',
            toast: true,
          });
        })
        .catch((err) => {
          console.warn('err', err);

          return Swal2.fire({ title: err.message || err, icon: 'error' });
        });
    },

    resetApiForm() {
      this.newApi = { ...this.newApiTemplate };
      this.newApi.fields = [];
    },

    toCamelCase(string) {
      string = string
        .toLowerCase()
        .replace(/(?:(^.)|([-_\s]+.))/g, (match) =>
          match.charAt(match.length - 1).toUpperCase());
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
