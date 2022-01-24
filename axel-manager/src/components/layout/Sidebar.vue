<template>
  <!-- Sidebar -->
  <ul
    class="navbar-nav bg-gradient-primary sidebar sidebar-dark accordion"
    id="accordionSidebar"
  >
    <!-- Sidebar - Brand -->
    <a
      class="sidebar-brand d-flex align-items-center justify-content-center"
      href="/"
    >
      <div class="sidebar-brand-icon rotate-n-15">
        <img
          src="/axel-manager/img/axel.png"
          style="width: 49px; background: white; border-radius: 50%"
          alt=""
        />
      </div>
      <div class="sidebar-brand-text mx-3">
        {{ appConfig ? appConfig.appName : 'Framework manager' }}
      </div>
    </a>

    <!-- Divider -->
    <hr class="sidebar-divider my-0" />

    <!-- Nav Item - Dashboard -->
    <li class="nav-item active">
      <a class="nav-link" href="/">
        <i class="fa fa-fw fa-tachometer-alt"></i>
        <span>Dashboard</span></a
      >
    </li>

    <!-- Divider -->
    <hr class="sidebar-divider" />

    <!-- Heading -->
    <div class="sidebar-heading">Debug</div>

    <!-- Nav Item - Pages Collapse Menu -->
    <li class="nav-item">
      <router-link class="nav-link" to="/app/dashboard">
        <i class="fa fa-fw fa-cog"></i>
        Manage db models and api</router-link
      >
    </li>
    <li class="nav-item">
      <a class="nav-link pointer" @click.prevent="restart()">
        <i class="fa fa-fw fa-refresh"></i>
        <span>Restart api</span>
      </a>
    </li>

    <!-- Divider -->
    <hr class="sidebar-divider" />

    <!-- Nav Item - Pages Collapse Menu -->
    <li class="nav-item">
      <a
        class="nav-link"
        :class="{ collapsed: !openedSubmenus['models'] }"
        href="#"
        data-toggle="collapse"
        data-target="#collapseTwo"
        aria-expanded="true"
        aria-controls="collapseTwo"
        @click="
          toggleSubmenu('models');
          getModels();
        "
      >
        <i class="fa fa-fw fa-cog"></i>
        <span>Admin Models</span>
      </a>
      <div
        id="collapseTwo"
        class="collapse"
        :class="{ show: openedSubmenus['models'] }"
        aria-labelledby="headingTwo"
        data-parent="#accordionSidebar"
      >
        <div class="bg-white py-2 collapse-inner show rounded">
          <h6 class="collapse-header">Actions</h6>
          <a class="collapse-item" href="#" @click="getModels()"
            >Refresh models</a
          >
          <a class="collapse-item" href="#" @click="resetModelsAdminConfig()"
            >Reset models</a
          >
          <hr />
          <div
            v-for="model in viewableModels"
            class="collapse-item"
            :key="model.identity"
          >
            <router-link :to="`/app/models/${model.identity}`">{{
              model.title || model.name
            }}</router-link>
            <!--
            <router-link
              class="float-right"
              :to="`/app/models/axelModelConfig/${model.identity}/edit`"
              ><i class="fa fa-pen"></i
            ></router-link>
            <router-link
              class="float-right"
              :to="`/app/models/axelModelFieldConfig/${model.identity}/edit`"
              ><i class="fa fa-list"></i
            ></router-link>
            -->
          </div>
          <hr />
          <div class="collapse-item">
            <router-link :to="`/app/configurator/axelModelConfig`"
              ><i class="fa fa-edit"></i>Models config
            </router-link>
          </div>
          <div class="collapse-item">
            <router-link :to="`/app/configurator/axelModelFieldConfig`"
              ><i class="fa fa-edit"></i>Field config
            </router-link>
          </div>
        </div>
      </div>
    </li>

    <!-- Divider -->
    <hr class="sidebar-divider" />

    <!-- Heading -->
    <div class="sidebar-heading">Api</div>

    <!-- Nav Item - Tables -->
    <li class="nav-item">
      <a class="nav-link" href="/documentation">
        <i class="fa fa-fw fa-table"></i>
        <span>Documentation</span></a
      >
    </li>

    <!-- Nav Item - Tables -->
    <li class="nav-item">
      <a class="nav-link" href="/console">
        <i class="fa fa-fw fa-table"></i>
        <span>Api console</span></a
      >
    </li>

    <!-- Nav Item - Tables -->
    <li class="nav-item">
      <a class="nav-link" href="/api/swagger.json">
        <i class="fa fa-fw fa-table"></i>
        <span>Swagger json</span></a
      >
    </li>

    <li class="nav-item">
      <a class="nav-link" href="/api/swagger.yml">
        <i class="fa fa-fw fa-table"></i>
        <span>Swagger yml</span></a
      >
    </li>

    <!-- Divider -->
    <hr class="sidebar-divider d-none d-md-block" />

    <!-- Sidebar Toggler (Sidebar) -->
    <div class="text-center d-none d-md-inline">
      <button
        class="rounded-circle border-0"
        id="sidebarToggle"
        @click="toggleSidebar"
      ></button>
    </div>
  </ul>
  <!-- End of Sidebar -->
</template>
<script>
import { mapState } from 'vuex';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import Swal2 from 'sweetalert2';

import config from '@/config';

dayjs.extend(relativeTime);

export default {
  name: 'Sidebar',
  data() {
    return {
      terms: '',
      searchOpen: false,
      searchResult: false,
      close_sidebar_var: false,
      clicked: false,
      mobile_toggle: false,
      mobile_search: false,
      openbonusUI: false,
      openLevelmenu: false,
      openlanguage: false,
      mobile_accordian: false,
      mixLayout: 'light-only',
      apiSearchResults: {},
      notifications: [],
      config,
      openedSubmenus: {
        api: false,
        models: false,
      },
    };
  },
  components: {},
  mounted() {
    setTimeout(() => {
      this.getNotifications();
    }, 5000);

    /*
    this.$socket.subscribe(`/live/${this.live.id}/user/${this.user.id}/notifications`);
    this.$socket.on('notifications', (notifs) => {
      this.notifications = notifs;
    });
    */
  },
  computed: {
    ...mapState(['appConfig']),
    searchResultIsEmpty() {
      return (
        !this.menuItems.length &&
        !Object.values(this.apiSearchResults).reduce(
          (prev, next) => next.count + prev,
          0
        )
      );
    },

    viewableModels() {
      return this.$store.state.models.filter(
        (m) => !m.identity.startsWith('axel')
      );
    },
  },
  methods: {
    toggleSidebar() {
      if (
        document.querySelector('body').classList.contains('sidebar-toggled')
      ) {
        document.querySelector('body').classList.remove('sidebar-toggled');
        document.querySelector('.sidebar').classList.remove('toggled');
      } else {
        document.querySelector('body').classList.add('sidebar-toggled');
        document.querySelector('.sidebar').classList.add('toggled');
      }
    },
    searchTerm() {
      this.$store.dispatch('menu/searchTerm', this.terms);
      ['client', 'request'].map((type) =>
        this.$store
          .dispatch('menu/searchItems', {
            query: `${this.terms}*`,
            type,
            perPage: 8,
          })
          .then((data) => {
            this.apiSearchResults[type] = data;
          })
      );
    },
    logout() {},

    getNotifications() {
      if (this.$socket) {
        if (!this.$socket.connected) {
          this.$socket.connect();
        }

        this.$socket
          .get('/api/notifications', {
            body: { organisationId: this.organisation && this.organisation.id },
          })
          .then((notifs) => {
            this.notifications = notifs;
          });
      }
    },

    async resetModelsAdminConfig() {
      this.$awConfirm(
        'are you sure ?  this will delete all your existing modifications'
      ).then((confirmed) => {
        if (confirmed) {
          this.$socket
            .post('/axel-manager/reset-models-config', {
              body: { ...this.newApi },
            })
            .then(() => {
              this.$store.dispatch('getModels');
              return Swal2.fire({
                title: 'Models successfully resetted',
                icon: 'success',
                toast: true,
              });
            })
            .catch((err) => {
              return Swal2.fire({ title: err.message, icon: 'error' });
            });
        }
      });
    },

    async saveModelsToFile() {
      this.$awConfirm(
        'are you sure ? this will write all your existing modifications'
      ).then(() => {
        this.$socket
          .put('/axel-manager/admin-models/save-all', {
            body: { ...this.newApi },
          })
          .then(() => {
            this.$store.dispatch('getModels');
            return Swal2.fire({
              title: 'Models successfully saved',
              icon: 'success',
              toast: true,
            });
          })
          .catch((err) => {
            return Swal2.fire({ title: err.message, icon: 'error' });
          });
      });
    },

    getModels() {
      this.$store.dispatch('getModels');
    },
    toggleSubmenu(menu) {
      this.openedSubmenus[menu] = !this.openedSubmenus[menu];
    },
    restart() {
      this.$socket.post('/axel-manager/restart-app', {});
    },
  },
  watch: {
    // eslint-disable-next-line
    '$i18n.locale': function (to, from) {
      if (from !== to) {
        this.$router.go(this.$route.path);
      }
    },
    menuItems() {
      if (this.terms) {
        this.addFix();
      } else {
        this.removeFix();
      }
    },
  },
};
</script>

<style>
.ProfileCard small a {
  font-weight: 300;
}

.mention-item {
  padding: 4px 10px;
  border-radius: 4px;
}

.mention-selected {
  background: teal;
  color: white;
}
</style>
