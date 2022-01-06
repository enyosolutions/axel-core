<template>
  <div class="">
    <!-- Topbar -->
    <nav
      class="navbar navbar-expand navbar-light bg-white topbstatic-top shadow"
    >
      <!-- Sidebar Toggle (Topbar) -->
      <button
        id="sidebarToggleTop"
        class="btn btn-link d-md-none rounded-circle mr-3"
      >
        <i class="fa fa-bars"></i>
      </button>

      <!-- Topbar Search -->
      <h4 class="text-primary" v-if="appConfig">
        app:
        <span class="badge badge-primary">{{ appConfig.app }}</span>
        | env:
        <span class="badge badge-primary"> {{ appConfig.env }}</span>
        | NODE_ENV:
        <span class="badge badge-info">{{ appConfig.node_env }}</span>
      </h4>
      <form
        class="d-none d-sm-inline-block form-inline mr-auto ml-md-3 my-2 my-md-0 mw-100 navbar-search"
      >
        <div class="input-group d-none">
          <input
            type="text"
            class="form-control bg-light border-0 small"
            placeholder="Search for..."
            aria-label="Search"
            aria-describedby="basic-addon2"
          />
          <div class="input-group-append">
            <button class="btn btn-primary" type="button">
              <i class="fas fa-search fa-sm"></i>
            </button>
          </div>
        </div>
      </form>

      <!-- Topbar Navbar -->
      <ul class="navbar-nav ml-auto">
        <!-- Nav Item - Search Dropdown (Visible Only XS) -->
        <li class="nav-item dropdown no-arrow d-sm-none">
          <a
            class="nav-link dropdown-toggle"
            href="#"
            id="searchDropdown"
            role="button"
            data-toggle="dropdown"
            aria-haspopup="true"
            aria-expanded="false"
          >
            <i class="fas fa-search fa-fw"></i>
          </a>
          <!-- Dropdown - Messages -->
          <div
            class="dropdown-menu dropdown-menu-right p-3 shadow animated--grow-in"
            aria-labelledby="searchDropdown"
          >
            <form class="form-inline mr-auto w-100 navbar-search">
              <div class="input-group">
                <input
                  type="text"
                  class="form-control bg-light border-0 small"
                  placeholder="Search for..."
                  aria-label="Search"
                  aria-describedby="basic-addon2"
                />
                <div class="input-group-append">
                  <button class="btn btn-primary" type="button">
                    <i class="fas fa-search fa-sm"></i>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </li>

        <!-- Nav Item - Alerts -->
        <li class="nav-item no-arrow mx-1">
          <a
            class="nav-link"
            :class="isConnected ? 'text-success' : 'text-danger'"
            href="#"
            id="alertsDropdown"
            role="button"
          >
            <i class="fas fa-bell fa-fw"></i>
            <span class="" v-if="!isConnected">Server is not connected</span>
            <span class="" v-if="isConnected">Server is connected</span>
            <!-- Counter - Alerts -->
          </a>
        </li>

        <!-- Nav Item - Messages -->
        <li class="nav-item dropdown no-arrow mx-1">
          <a
            class="nav-link dropdown-toggle"
            href="#"
            id="messagesDropdown"
            role="button"
            data-toggle="dropdown"
            aria-haspopup="true"
            aria-expanded="false"
          >
            <i class="fas fa-envelope fa-fw"></i>
            <!-- Counter - Messages -->
            <span class="badge badge-danger badge-counter">7</span>
          </a>
          <!-- Dropdown - Messages -->
          <div
            class="dropdown-list dropdown-menu dropdown-menu-right shadow animated--grow-in"
            aria-labelledby="messagesDropdown"
          >
            <h6 class="dropdown-header">Message Center</h6>
            <a class="dropdown-item d-flex align-items-center" href="#">
              <div class="dropdown-list-image mr-3">
                <img
                  class="rounded-circle"
                  src="https://source.unsplash.com/fn_BT9fwg_E/60x60"
                  alt=""
                />
                <div class="status-indicator bg-success"></div>
              </div>
              <div class="font-weight-bold">
                <div class="text-truncate">
                  Hi there! I am wondering if you can help me with a problem
                  I've been having.
                </div>
                <div class="small text-gray-500">Emily Fowler · 58m</div>
              </div>
            </a>
            <a class="dropdown-item d-flex align-items-center" href="#">
              <div class="dropdown-list-image mr-3">
                <img
                  class="rounded-circle"
                  src="https://source.unsplash.com/AU4VPcFN4LE/60x60"
                  alt=""
                />
                <div class="status-indicator"></div>
              </div>
              <div>
                <div class="text-truncate">
                  I have the photos that you ordered last month, how would you
                  like them sent to you?
                </div>
                <div class="small text-gray-500">Jae Chun · 1d</div>
              </div>
            </a>
            <a class="dropdown-item d-flex align-items-center" href="#">
              <div class="dropdown-list-image mr-3">
                <img
                  class="rounded-circle"
                  src="https://source.unsplash.com/CS2uCrpNzJY/60x60"
                  alt=""
                />
                <div class="status-indicator bg-warning"></div>
              </div>
              <div>
                <div class="text-truncate">
                  Last month's report looks great, I am very happy with the
                  progress so far, keep up the good work!
                </div>
                <div class="small text-gray-500">Morgan Alvarez · 2d</div>
              </div>
            </a>
            <a class="dropdown-item d-flex align-items-center" href="#">
              <div class="dropdown-list-image mr-3">
                <img
                  class="rounded-circle"
                  src="https://source.unsplash.com/Mv9hjnEUHR4/60x60"
                  alt=""
                />
                <div class="status-indicator bg-success"></div>
              </div>
              <div>
                <div class="text-truncate">
                  Am I a good boy? The reason I ask is because someone told me
                  that people say this to all dogs, even if they aren't good...
                </div>
                <div class="small text-gray-500">Chicken the Dog · 2w</div>
              </div>
            </a>
            <a class="dropdown-item text-center small text-gray-500" href="#"
              >Read More Messages</a
            >
          </div>
        </li>

        <div class="topbar-divider d-none d-sm-block"></div>

        <!-- Nav Item - User Information -->
        <!--
              <li class="nav-item dropdown no-arrow">
                <a
                  class="nav-link dropdown-toggle"
                  href="#"
                  id="userDropdown"
                  role="button"
                  data-toggle="dropdown"
                  aria-haspopup="true"
                  aria-expanded="false"
                >
                  <span class="mr-2 d-none d-lg-inline text-gray-600 small"
                    >Valerie Luna</span
                  >
                  <img
                    class="img-profile rounded-circle"
                    src="https://source.unsplash.com/QAB-WJcbgJk/60x60"
                  />
                </a>
                <div
                  class="dropdown-menu dropdown-menu-right shadow animated--grow-in"
                  aria-labelledby="userDropdown"
                >
                  <a class="dropdown-item" href="#">
                    <i class="fas fa-user fa-sm fa-fw mr-2 text-gray-400"></i>
                    Profile
                  </a>
                  <a class="dropdown-item" href="#">
                    <i class="fas fa-cogs fa-sm fa-fw mr-2 text-gray-400"></i>
                    Settings
                  </a>
                  <a class="dropdown-item" href="#">
                    <i class="fas fa-list fa-sm fa-fw mr-2 text-gray-400"></i>
                    Activity Log
                  </a>
                  <div class="dropdown-divider"></div>
                  <a
                    class="dropdown-item"
                    href="#"
                    data-toggle="modal"
                    data-target="#logoutModal"
                  >
                    <i
                      class="fas fa-sign-out-alt fa-sm fa-fw mr-2 text-gray-400"
                    ></i>
                    Logout
                  </a>
                </div>
              </li>
              -->
      </ul>
    </nav>
    <!-- End of Topbar -->
  </div>
</template>
<script>
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import DisconnectedConfig from '@/components/swal/Disconnected';
import Swal2 from 'sweetalert2';
import { mapState } from 'vuex';

dayjs.extend(relativeTime);

const body = document.getElementsByTagName('body')[0];
export default {
  name: 'Header',
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
      socket: this.$socket,
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
    isConnected() {
      return this.socket && this.socket.connected;
    },
    userRoles() {
      return this.$store.state.user.user.roles &&
        Array.isArray(this.$store.state.user.user.roles)
        ? this.$store.state.user.user.roles.join('x')
        : '';
    },
    searchResultIsEmpty() {
      return (
        !this.menuItems.length &&
        !Object.values(this.apiSearchResults).reduce(
          (prev, next) => next.count + prev,
          0
        )
      );
    },
  },
  methods: {
    fromNow(date) {
      const d = dayjs(date);
      return d && dayjs(date).fromNow();
    },
    toggle_sidebar() {
      this.$store.dispatch('menu/opensidebar');
    },
    setNavActive(item) {
      this.$store.dispatch('menu/setBonusNavActive', item);
    },
    openlangpicker() {
      this.openlanguage = !this.openlanguage;
    },
    openlevelmenu() {
      this.openLevelmenu = !this.openLevelmenu;
    },
    openmegamenu() {
      this.openbonusUI = !this.openbonusUI;
    },
    closeBonusUI() {
      this.openbonusUI = false;
    },
    search_open() {
      this.searchOpen = true;
    },
    search_close() {
      this.searchOpen = false;
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
    changeLocale(locale) {
      this.setLang(locale);
    },
    mobileaccordian() {
      this.mobile_accordian = !this.mobile_accordian;
    },
    logout() {},
    addFix() {
      body.classList.add('offcanvas');
      this.searchResult = true;
    },
    removeFix() {
      body.classList.remove('offcanvas');
      this.searchResult = false;
      this.terms = '';
    },
    toggle_fullscreen() {
      if (
        (document.fullScreenElement && document.fullScreenElement !== null) ||
        (!document.mozFullScreen && !document.webkitIsFullScreen)
      ) {
        if (document.documentElement.requestFullScreen) {
          document.documentElement.requestFullScreen();
        } else if (document.documentElement.mozRequestFullScreen) {
          document.documentElement.mozRequestFullScreen();
        } else if (document.documentElement.webkitRequestFullScreen) {
          document.documentElement.webkitRequestFullScreen(
            Element.ALLOW_KEYBOARD_INPUT
          );
        }
      } else if (document.cancelFullScreen) {
        document.cancelFullScreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.webkitCancelFullScreen) {
        document.webkitCancelFullScreen();
      }
    },
    customizeMixLayout(val) {
      this.mixLayout = val;
      this.$store.dispatch('layout/setLayout', val);
    },

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
            console.log('notifs', notifs);
            this.notifications = notifs;
          });
      }
    },
  },
  watch: {
    'socket.connected': function (newVal, oldVal) {
      if (!newVal && oldVal !== newVal) {
        this.blockingModal = Swal2.fire(DisconnectedConfig);
        window.blockingModal = this.blockingModal;
      } else if (this.blockingModal) {
        this.blockingModal.close();
      }
    },
    // eslint-disable-next-line
    '$i18n.locale': function (to, from) {
      if (from !== to) {
        this.$router.go(this.$route.path);
      }
    },
    // eslint-disable-next-line
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
