<template>
  <div>
    <!-- Page Heading -->
    <div
      class="d-sm-flex align-items-center justify-content-between mb-4 page-header page-header-dark"
    >
      <h1 class="h3 mb-0 text-gray-800" v-if="modelComputed">
        Configure:
        {{
          modelComputed.title || modelComputed.name || modelComputed.identity
        }}
      </h1>
      <router-link
        v-if="modelComputed"
        :to="`/app/models/${modelComputed.identity}`"
        >{{ $t('common.buttons.closeEditor') }}
      </router-link>
    </div>

    <div class="row">
      <div class="col-12 col-md-3">
        <ul class="nav nav-pills nav-fill flex-md-column card p-1 mt-2">
          <template v-for="(config, tab) in tabs">
            <li class="nav-item" :key="tab">
              <a
                class="nav-link"
                :class="{ active: tab === activeTab }"
                :href="`#${tab}`"
                @click.prevent.stop="changeTab(tab)"
                >{{ $t(`ModelEditor.tabs.${tab}`) }}</a
              >
            </li>
          </template>
        </ul>
      </div>
      <div class="col-12 col-md-9">
        <div
          v-if="modelComputed && activeTab"
          class="tab-content pt-2"
          id="tab-general"
        >
          <div
            class="tab-pane fade in show"
            :class="{ active: !!activeTab }"
            id="general"
            role="tabpanel"
            :key="activeTab"
          >
            <AwesomeCrud
              ref="fieldAwesomeCrud"
              v-if="activeTab === 'fields' && modelComputed"
              v-bind="modelFieldConfigModel"
              :identity="'axelModelFieldConfig'"
              primaryKey="id"
              primaryKeyField="id"
              :useRouterMode="false"
              :listOptions="{
                ...modelFieldConfigModel.listOptions,
                perRow: 1,
                titleField: '{{ currentItem.title || currentItem.name }}',
              }"
              v-on="events"
              tableRowClickAction="edit"
              initialDisplayMode="list"
              :enabledListingModes="['list']"
              :apiQueryParams="{
                sort: { id: 'asc' },
                filters: {
                  parentIdentity: modelComputed.identity,
                },
              }"
              :options="{
                ...modelFieldConfigModel.options,
                initialDisplayMode: 'list',
                detailPageMode: 'sidebar',
              }"
              :actions="{
                create: true,
                edit: true,
                view: false,
                export: false,
                import: false,
                filter: false,
                advancedFiltering: false,
              }"
              @closeRequested="$store.dispatch('getModels')"
              @model-updated="onModelUpdated"
            />

            <AwesomeForm
              v-if="$route.params.identity && activeTab !== 'fields'"
              :key="activeTab"
              identity="axelModelConfig"
              primaryKey="identity"
              primaryKeyField="identity"
              mode="edit"
              :item="modelComputed"
              :useRouterMode="false"
              v-on="events"
              displayMode="page"
              :displayHeader="false"
              :displayedFields="tabs[activeTab] && tabs[activeTab].fields"
              :apiQueryParams="{
                listOfValues: true,
              }"
              :actions="{
                create: false,
                edit: true,
                view: false,
                export: true,
                import: true,
              }"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
// import { mapState } from 'vuex';
import { AwesomeCrud, AwesomeForm } from 'vue-aw-components';
import _ from 'lodash';

export default {
  name: 'ModelEditor',
  props: {
    model: Object,
    events: Object,
    storePath: { type: String, default: 'state.models' },
  },
  components: {
    AwesomeCrud,
    AwesomeForm,
  },
  computed: {
    identity() {
      return this.$route.params.identity;
    },
    isConnected() {
      return this.$socket && this.$socket.connected;
    },

    modelComputed() {
      return (
        this.model ||
        _.get(this.$store, this.storePath).find(
          (model) => model.identity === this.identity
        )
      );
    },

    modelConfigModel() {
      return _.get(this.$store, this.storePath).find(
        (model) => model.identity === 'axelModelConfig'
      );
    },
    modelFieldConfigModel() {
      return _.get(this.$store, this.storePath).find(
        (model) => model.identity === 'axelModelFieldConfig'
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
    return {
      routes: null,
      blockingModal: null,
      fieldTypes: ['string', 'text', 'integer', 'boolean', 'date', 'datetime'],
      modelEditModalMode: 'api', // api | model || add-field
      activeTab: 'general',
      tabs: {
        general: {
          fields: [
            'title',
            'name',
            'namePlural',
            'tabTitle',
            'menuTitle',
            'icon',
            'primaryKeyField',
            'displayField',
          ],
        },
        tabs: {
          fields: ['tabTitle', 'tabIsVisible'],
        },
        menus: {
          fields: ['menuTitle', 'menuIsVisible'],
        },
        listingView: {
          fields: [
            'enabledListingModes',
            'initialDisplayMode',
            'columnsDisplayed',
            'tableRowClickAction',
            'tableRowDoubleClickAction',
            'segmentField',
            'listOptions',
            'kanbanOptions',
            'tableOptions',
          ],
        },
        detailView: {
          fields: [
            'detailPageMode',
            'postCreateDisplayMode',
            'postEditDisplayMode',
            'detailPageLayout',
            'formOptions',
          ],
        },
        fields: {
          fields: [
            'detailPageMode',
            'detailPageLayout',
            'postCreateDisplayMode',
            'postEditDisplayMode',
            'formOptions',
          ],
        },
        dataFetching: {
          fields: [
            'apiUrl',
            'options.dataPaginationMode',
            'dataPaginationMode',
            'tableDataLimit',
          ],
        },
        relations: {
          fields: [
            'nestedModels',
            'options.dataPaginationMode',
            'dataPaginationMode',
            'tableDataLimit',
          ],
        },
        actions: {
          fields: [
            'actions',
            'customInlineActions',
            'customTopActions',
            'customTabletopActions',
            'customInlineActions',
          ],
        },
        rest: {
          fields: [],
        },
      },
    };
  },
  mounted() {
    //    $.fn.modal.Constructor.prototype._enforceFocus = function() {};
    this.$awEventBus.$on('closeRequested', this.refreshModels);
    Object.values(this.tabs).forEach((config) => {
      if (config.fields && config.fields.length) {
        this.tabs.rest.fields.push(...config.fields);
      }
    });

    if (this.modelConfigModel) {
      this.tabs.rest.fields = _.difference(
        Object.keys(this.modelConfigModel.schema.properties),
        this.tabs.rest.fields
      );
    }

    if (this.$route.query.tab) {
      this.activeTab = this.$route.query.tab;
    }
    if (this.$route.params.tab) {
      this.activeTab = this.$route.params.tab;
    }
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

    changeTab(tab) {
      this.activeTab = '';
      setTimeout(() => {
        this.activeTab = tab;
      }, 200);
      /*
      this.$router.replace({
        name: 'configurator-view',
        params: {
          tab,
        },
      });
      */
    },

    onModelUpdated(value, fieldName) {
      if (fieldName === 'type') {
        const field = this.$refs.fieldAwesomeCrud.selectedItem;
        switch (value) {
          case 'boolean':
            if (!field.field) {
              this.$set(field, 'field', {});
            }
            if (field && (!field.field || !field.field.type)) {
              _.set(field, 'field.type', 'switch');
              this.$set(field.field, 'type', 'switch');
            }
            if (field && (!field.column || !field.column.type)) {
              _.set(field, 'column.type', 'boolean');
            }
            break;
          case 'date':
            if (field && (!field.field || !field.field.type)) {
              _.set(field, 'field.type', 'dateTime');
            }
            if (field && (!field.column || !field.column.type)) {
              _.set(field, 'column.type', 'datetime');
            }
            break;

          default:
            break;
        }
      }
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
.awesome-list > .card-body {
  padding-left: 0;
  padding-right: 0;
}
</style>
