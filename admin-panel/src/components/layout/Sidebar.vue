<template>
  <!-- Sidebar -->
  <ul
    class="navbar-nav bg-gradient-primary sidebar sidebar-dark accordion"
    id="accordionSidebar"
  >
    <!-- Sidebar - Brand -->
    <router-link
      class="sidebar-brand d-flex align-items-center justify-content-center"
      to="/"
    >
      <div class="sidebar-brand-icon rotate-n-15">
        <img
          src="/admin-panel/img/axel.png"
          style="width: 49px; background: white; border-radius: 50%"
          alt=""
        />
      </div>
      <div class="sidebar-brand-text mx-3">
        {{ appConfig ? appConfig.appName || appConfig.app : "Admin panel" }}
      </div>
    </router-link>

    <!-- Divider -->
    <hr class="sidebar-divider my-0" />

    <!-- Nav Item - Dashboard -->
    <li class="nav-item active d-none">
      <a class="nav-link" href="/">
        <i class="fa fa-fw fa-tachometer-alt"></i>
        <span>Dashboard</span></a
      >
    </li>

    <!-- Divider -->
    <hr class="sidebar-divider mb-2" />

    <!-- Heading -->

    <!-- Nav Item - Pages Collapse Menu -->
    <li class="nav-item" v-if="!isProduction">
      <a
        class="nav-link p-0"
        :class="{ collapsed: !openedSubmenus['administration'] }"
        href="#"
        data-toggle="collapse"
        data-target="#collapseTwo"
        aria-expanded="true"
        aria-controls="collapseTwo"
        @click="toggleSubmenu('administration')"
      >
        <div class="sidebar-heading text-white">
          <i class="fa fa-fw fa-cog"></i> ADMINISTRATION
        </div>
      </a>
      <div
        id="collapseTwo"
        class="collapse"
        :class="{ show: openedSubmenus['administration'] }"
        aria-labelledby="headingTwo"
        data-parent="#accordionSidebar"
      >
        <div class="bg-white py-2 collapse-inner show rounded">
          <div class="">
            <router-link class="nav-link p-v-0 text-primary" to="/app/api-list">
              Manage db models and api</router-link
            >
          </div>
          <div class="">
            <a class="nav-link pointer text-primary" @click.prevent="restart()">
              <span>Restart api</span>
            </a>
          </div>
        </div>
      </div>
    </li>

    <!-- Divider -->
    <hr class="sidebar-divider mb-2" />

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
        <span>Models</span>
      </a>
      <div
        id="collapseTwo"
        class="collapse"
        :class="{ show: openedSubmenus['models'] }"
        aria-labelledby="headingTwo"
        data-parent="#accordionSidebar"
      >
        <div class="bg-white py-2 collapse-inner show rounded">
          <template v-if="!isProduction">
            <h6 class="collapse-header">Actions</h6>
            <a class="collapse-item" href="#" @click.prevent="getModels()"
              >Refresh models</a
            >
            <a
              class="collapse-item"
              href="#"
              @click.prevent="resetModelsAdminConfig()"
              >Reset models</a
            >
            <hr class="m-0" />
          </template>
          <div class="p-2">
            <input
              type="text"
              class="form-control"
              :placeholder="$t('common.buttons.filter') + '...'"
              v-model="modelFilterInput"
            />
          </div>
          <template v-for="model in filteredModels">
            <div
              class="collapse-item text-truncate text-dark"
              :key="model.identity"
            >
              <router-link
                class="text-dark"
                :to="`/app/models/${model.identity}`"
                >{{
                  model.menuTitle ||
                  model.title ||
                  model.tabTitle ||
                  startCase(model.identity)
                }}</router-link
              >
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
            --></div>
          </template>
          <template v-if="!isProduction">
            <hr />
            <div class="collapse-item d-none">
              <router-link :to="`/app/configurator/axelModelConfig`"
                ><i class="fa fa-edit"></i>Models config
              </router-link>
            </div>
            <div class="collapse-item d-none">
              <router-link :to="`/app/configurator/axelModelFieldConfig`"
                ><i class="fa fa-edit"></i>Field config
              </router-link>
            </div>
          </template>
        </div>
      </div>
    </li>

    <!-- Divider -->
    <hr class="sidebar-divider mb-2" v-if="!isProduction" />
    <li class="nav-item" v-if="!isProduction">
      <a
        class="nav-link"
        :class="{ collapsed: !openedSubmenus['developer'] }"
        href="#"
        data-toggle="collapse"
        data-target="#collapseTwo"
        aria-expanded="true"
        aria-controls="collapseTwo"
        @click="
          toggleSubmenu('developer');
          getModels();
        "
      >
        <i class="fa fa-fw fa-cog"></i>
        <span class="">Api</span>
      </a>
      <div
        id="collapseTwo"
        class="collapse"
        :class="{ show: openedSubmenus['developer'] }"
        aria-labelledby="headingTwo"
        data-parent="#accordionSidebar"
      >
        <div class="bg-white py-2 collapse-inner show rounded">
          <div class="">
            <a class="nav-link text-primary" href="/documentation">
              <i class="fa fa-fw fa-table"></i>
              <span>Documentation</span></a
            >
          </div>
          <div class="">
            <a class="nav-link text-primary" href="/console">
              <i class="fa fa-fw fa-table"></i>
              <span>Api console</span></a
            >
          </div>
          <div class="">
            <a class="nav-link text-primary" href="/api/swagger.json">
              <i class="fa fa-fw fa-table"></i>
              <span>Swagger json</span>
            </a>
          </div>
          <div class="">
            <a class="nav-link text-primary" href="/api/swagger.yml">
              <i class="fa fa-fw fa-table"></i>
              <span>Swagger yml</span>
            </a>
          </div>
        </div>
      </div>
    </li>

    <!-- Divider -->
    <hr class="sidebar-divider mb-2 d-md-block" />

    <li class="nav-item">
      <a class="nav-link" @click.prevent="logout()">
        <i class="fa fa-fw fa-table"></i>
        <span>logout</span></a
      >
    </li>
    <hr class="sidebar-divider mb-2 d-none d-md-block" />

    <!-- Sidebar Toggler (Sidebar) -->
    <div class="text-center d-none d-md-inline">
      <button
        class="rounded-circle border-0"
        id="sidebarToggle"
        @click="toggleSidebar"
      >
        <i class="fa fa-caret-left text-white"></i>
      </button>
    </div>
  </ul>
  <!-- End of Sidebar -->
</template>
<script>
import { mapGetters, mapState } from "vuex";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import Swal2 from "sweetalert2";
import { startCase } from "lodash";

import config from "@/config";

dayjs.extend(relativeTime);

export default {
  name: "Sidebar",
  data() {
    return {
      terms: "",
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
      mixLayout: "light-only",
      apiSearchResults: {},
      notifications: [],
      config,
      openedSubmenus: {
        administration: false,
        developer: false,
        api: false,
        models: true,
      },
      modelFilterInput: "",
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
    ...mapState(["appConfig", "appEnv"]),
    ...mapGetters(["isProduction", "viewableModels"]),
    searchResultIsEmpty() {
      return (
        !this.menuItems.length &&
        !Object.values(this.apiSearchResults).reduce(
          (prev, next) => next.count + prev,
          0
        )
      );
    },

    filteredModels(state) {
      return this.viewableModels.filter(
        (m) =>
          !this.modelFilterInput ||
          (m.title && m.title.toLowerCase().includes(this.modelFilterInput)) ||
          (m.identity &&
            m.identity.toLowerCase().includes(this.modelFilterInput)) ||
          (m.tabTitle &&
            m.tabTitle.toLowerCase().includes(this.modelFilterInput))
      );
    },
  },
  methods: {
    startCase,
    toggleSidebar() {
      Object.keys(this.openedSubmenus).forEach((value) => {
        this.openedSubmenus[value] = false;
      });
      if (
        document.querySelector("body").classList.contains("sidebar-toggled")
      ) {
        document.querySelector("body").classList.remove("sidebar-toggled");
        document.querySelector(".sidebar").classList.remove("toggled");
      } else {
        document.querySelector("body").classList.add("sidebar-toggled");
        document.querySelector(".sidebar").classList.add("toggled");
      }
    },
    searchTerm() {
      this.$store.dispatch("menu/searchTerm", this.terms);
      ["client", "request"].map((type) =>
        this.$store
          .dispatch("menu/searchItems", {
            query: `${this.terms}*`,
            type,
            perPage: 8,
          })
          .then((data) => {
            this.apiSearchResults[type] = data;
          })
      );
    },
    logout() {
      this.$store.dispatch("logout");
      this.$router.push("/login");
    },

    getNotifications() {
      if (this.$socket) {
        if (!this.$socket.connected) {
          this.$socket.connect();
        }

        this.$socket
          .get("/api/notifications", {
            body: { organisationId: this.organisation && this.organisation.id },
          })
          .then((notifs) => {
            this.notifications = notifs;
          });
      }
    },

    async resetModelsAdminConfig() {
      this.$awConfirm(
        "are you sure ?  this will delete all your existing modifications"
      ).then((confirmed) => {
        if (confirmed) {
          this.$socket
            .post("/admin-panel/reset-models-config", {
              body: { ...this.newApi },
            })
            .then(() => {
              this.$store.dispatch("getModels");
              return Swal2.fire({
                title: "Models successfully resetted",
                icon: "success",
                toast: true,
              });
            })
            .catch((err) => Swal2.fire({ title: err.message, icon: "error" }));
        }
      });
    },

    async saveModelsToFile() {
      this.$awConfirm(
        "are you sure ? this will write all your existing modifications"
      ).then(() => {
        this.$socket
          .put("/admin-panel/admin-models/save-all", {
            body: { ...this.newApi },
          })
          .then(() => {
            this.$store.dispatch("getModels");
            return Swal2.fire({
              title: "Models successfully saved",
              icon: "success",
              toast: true,
            });
          })
          .catch((err) => Swal2.fire({ title: err.message, icon: "error" }));
      });
    },

    getModels() {
      this.$store.dispatch("getModels");
    },
    toggleSubmenu(menu) {
      this.openedSubmenus[menu] = !this.openedSubmenus[menu];
    },
    restart() {
      this.$socket.post("/admin-panel/restart-app", {});
    },
  },
  watch: {
    // eslint-disable-next-line
    "$i18n.locale": function (to, from) {
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
.sidebar .collapse-inner .nav-item .nav-link {
  padding: 5px 0.75rem;
}
</style>
