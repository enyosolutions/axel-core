<template>
  <div>
    <!-- Page Heading -->
    <div class="d-sm-flex align-items-center justify-content-between mb-1">
      <h1 class="h3 mb-0 text-gray-800">Dashboard</h1>
    </div>

    <div class="row">
      <!-- Content Row -->
      <div
        class="col-12 col-md-3"
        v-for="model in viewableModels"
        :key="model.identity"
      >
        <div class="card shadow mb-4">
          <div
            class="card-header py-2 d-flex flex-row align-items-center justify-content-between"
          >
            <h6 class="m-0 font-weight-bold text-primary">
              {{ model.menuTitle || model.title || model.identity }}
            </h6>
            <h5
              v-if="modelsCount[model.identity] !== undefined"
              class="m-0 font-weight-bold text-primary"
            >
              {{ modelsCount[model.identity] }}
            </h5>
          </div>
          <div class="card-body">
            <router-link
              class="btn btn-outline-secondary btn-block"
              :to="`/app/models/${model.identity}`"
              >Go</router-link
            >
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import { mapGetters } from 'vuex';
import Swal2 from 'sweetalert2';
import { openModal, closeModal } from '@/services/modal';

/* eslint-disable func-names */
export default {
  name: 'DefaultDashboard',
  components: {},
  computed: {
    ...mapGetters(['isProduction', 'viewableModels']),
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
  watch: {},
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
      modelsCount: {},
    };
  },
  mounted() {
    this.getModelsCount();
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

    getModelsCount() {
      return Promise.all(
        this.viewableModels.map((model) => {
          console.warn('model', model.identity);
          return this.$awApi
            .get(model.apiUrl, {
              params: {
                perPage: 1,
              },
            })
            .then(({ data }) =>
              this.$set(this.modelsCount, model.identity, data.totalCount)
            );
        })
      ).catch(console.warn);
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
