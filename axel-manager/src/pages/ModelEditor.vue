<template>
  <div>
    <!-- Page Heading -->
    <div class="d-sm-flex align-items-center justify-content-between mb-4">
      <h1 class="h3 mb-0 text-gray-800" v-if="modelComputed">
        {{
          modelComputed.title || modelComputed.name || modelComputed.identity
        }}
        {{ $route.params.id }}
      </h1>
    </div>

    <!-- Content Row -->
    <div v-if="modelComputed && modelComputed.identity" class="">
      <AwesomeCrud
        v-if="$route.params.identity === 'axelModelConfig'"
        :identity="$route.params.identity"
        primaryKey="identity"
        :useRouterMode="false"
        v-on="events"
        tableRowClickAction="edit"
        detailPageMode="page"
        :actions="{
          create: true,
          edit: true,
          view: false,
          export: true,
          import: true,
        }"
      />
      <AwesomeCrud
        v-if="$route.params.identity === 'axelModelFieldConfig'"
        v-bind="modelComputed"
        :identity="$route.params.identity"
        :primaryKey="modelComputed.primaryKey"
        :useRouterMode="false"
        :listOptions="{ perRow: 6 }"
        v-on="events"
        tableRowClickAction="edit"
        :actions="{
          create: true,
          edit: true,
          view: false,
          export: true,
          import: true,
        }"
        @closeRequested="$store.dispatch('getModels')"
        :customTableTopActions="[
          {
            type: 'filter',
            field: 'parentIdentity',
            fieldLabel: 'label',
          },
        ]"
      />
    </div>
  </div>
</template>
<script>
// import { mapState } from 'vuex';
import { AwesomeCrud } from 'vue-aw-components';
import _ from 'lodash';

export default {
  name: 'CrudWrapper',
  props: {
    model: Object,
    events: Object,
    storePath: { type: String, default: 'state.models' },
  },
  components: {
    AwesomeCrud,
  },
  computed: {
    identity() {
      return this.$route.params.identity;
    },
    isConnected() {
      return this.$socket && this.$socket.connected;
    },

    selectedModel() {
      if (!this.newApi.name) {
        return null;
      }
      return this.models.find((m) => m.name === this.newApi.name);
    },

    modelComputed() {
      return (
        this.model
        || _.get(this.$store, this.storePath).find(
          (model) => model.identity === this.identity
        )
      );
    },

    isConfigMode() {
      const configModels = ['axelModelConfig', 'axelModelFieldConfig'];
      return (
        configModels.includes(this.modelComputed.identity)
        && !configModels.includes(this.$route.params.id)
      );
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
    };
  },
  mounted() {
    //    $.fn.modal.Constructor.prototype._enforceFocus = function() {};
    this.$awEventBus.$on('closeRequested', this.refreshModels);
  },
  destroyed() {
    //    $.fn.modal.Constructor.prototype._enforceFocus = function() {};
    this.$awEventBus.$off('closeRequested', this.refreshModels);
  },

  methods: {
    refreshModels() {
      return this.$store.dispatch('getModels');
    },
    goToItem() {
      this.$router.push(`/app/models/${this.$route.params.id}`);
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
.aw-crud .container-fluid {
  padding: 0;
}
</style>
