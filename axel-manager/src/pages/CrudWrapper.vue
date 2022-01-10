<template>
  <div>
    <!-- Page Heading
    <div class="d-sm-flex align-items-center justify-content-between mb-4">
      <h1 class="h3 mb-0 text-gray-800" v-if="modelComputed">
        {{
          modelComputed.title || modelComputed.name || modelComputed.identity
        }}
        {{ $route.params.id }}
      </h1>
    </div>
     -->

    <!-- Content Row -->
    <div v-if="modelComputed && modelComputed.identity" class="">
      <template v-if="isConfigMode">
        <AwesomeCrud
          v-if="$route.params.identity === 'axelModelConfig'"
          :identity="$route.params.id"
          v-on="events"
        />
        <AwesomeForm
          v-if="$route.params.identity === 'axelModelConfig'"
          :model="modelComputed"
          primaryKey="identity"
          identity="axelModelConfig"
          mode="edit"
          v-on="events"
          :item="{ identity: $route.params.id }"
          :actions="{ close: true }"
          @cancel="goToItem($event)"
          @closeRequested="goToItem($event)"
          :standalone="false"
        />
        <AwesomeCrud
          v-if="
            $route.params.identity === 'axelModelFieldConfig' &&
            $route.params.id
          "
          v-bind="modelComputed"
          :identity="$route.params.identity"
          :primaryKey="modelComputed.primaryKey"
          :useRouterMode="false"
          :options="{
            ...modelComputed.options,
            queryParams: {
              filters: { parentIdentity: $route.params.id },
              sort: { id: 'asc' },
            },
            initialDisplayMode: 'list',
            detailPageMode: 'sidebar',
          }"
          v-on="events"
          tableRowClickAction="edit"
          :actions="{ create: true, edit: true, view: false }"
          @closeRequested="$store.dispatch('getModels')"
        />
      </template>
      <AwesomeCrud v-else v-bind="modelComputed" v-on="events" />
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
        this.model ||
        _.get(this.$store, this.storePath).find(
          (model) => model.identity === this.identity
        )
      );
    },

    isConfigMode() {
      const configModels = ['axelModelConfig', 'axelModelFieldConfig'];
      return (
        configModels.includes(this.modelComputed.identity) &&
        !configModels.includes(this.$route.params.id)
      );
    },
  },
  watch: {},
  data() {
    return {};
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
    goToItem(event) {
      if (this.$route.params.id) {
        this.$router.push('/app/models/' + this.$route.params.id);
      } else if (event.identity) {
        this.$router.push('/app/models/' + event.identity);
      }
    },
  },
};
</script>

<style lang="scss">
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

@media (min-width: 576px) {
  .modal-dialog {
    max-width: 80vw !important;
    width: 80% !important;
  }
}

.aw-crud-axelModelFieldConfig {
  .aw-list-component .aw-list-item .card-body {
    padding: 5px;

    h4 {
      font-size: 20px;
    }
  }
}
</style>
