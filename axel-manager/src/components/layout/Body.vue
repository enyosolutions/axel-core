<template>
  <div>
    <!-- Page Wrapper -->
    <div id="wrapper">
      <!-- Sidebar -->
      <sidebar />
      <!-- End of Sidebar -->

      <!-- Content Wrapper -->
      <div id="content-wrapper" class="d-flex flex-column">
        <!-- Main Content -->
        <div id="content">
          <!-- Topbar -->
          <Header />
          <!-- End of Topbar -->

          <!-- Begin Page Content -->
          <div class="container-fluid">
            <transition name="fadeIn" enter-active-class="animated fadeIn">
              <router-view class="view" :key="$route.fullPath"></router-view>
            </transition>
          </div>
          <!-- /.container-fluid -->
        </div>
        <!-- End of Main Content -->

        <!-- Footer -->
        <footer class="sticky-footer bg-white">
          <div class="container my-auto">
            <div class="copyright text-center my-auto">
              <span>Copyright &copy; axel 2020 with SB ADMIN 2</span>
            </div>
          </div>
        </footer>
        <!-- End of Footer -->
      </div>
      <!-- End of Content Wrapper -->
    </div>
    <!-- End of Page Wrapper -->
    <div
      class="modal-backdrop fade show"
      id="backdrop"
      style="display: none"
    ></div>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import Header from './Header.vue';
import Sidebar from './Sidebar.vue';

export default {
  name: 'mainpage',
  data() {
    return {
      mobileheader_toggle_var: false,
      sidebar_toggle_var: false,
      horizontal_Sidebar: true,
      resized: false,
    };
  },
  // props:['sidebar_toggle_var'],
  components: {
    Header,
    Sidebar,
  },
  computed: {
    ...mapState({
      menuItems: (state) => state.menu && state.menu.data,
      togglesidebar: (state) => state.menu.togglesidebar,
    }),
  },
  created() {
    window.addEventListener('resize', this.handleResize);
    this.handleResize();
    this.resized = this.sidebar_toggle_var;
    //   this.$store.dispatch('layout/set');
  },
  mounted() {
    this.$store.dispatch('getAuth');
    this.$store.dispatch('getModels');
    this.$store.dispatch('getConfig');
  },
  watch: {
    $route() {
      return;
      /*
      this.menuItems.forEach((items) => {
        if (items.path === this.$route.path) {
          this.$store.dispatch('menu/setActiveRoute', items);
        }
        if (!items.children) {
          return false;
        }
        items.children.forEach((subItems) => {
          if (subItems.path === this.$route.path) {
            this.$store.dispatch('menu/setActiveRoute', subItems);
          }
          if (!subItems.children) {
            return false;
          }
          subItems.children.forEach((subSubItems) => {
            if (subSubItems.path === this.$route.path) {
              this.$store.dispatch('menu/setActiveRoute', subSubItems);
            }
          });
        });
      });
      */
    },
    sidebar_toggle_var() {
      this.resized =
        this.width <= 991 ? !this.sidebar_toggle_var : this.sidebar_toggle_var;
    },
  },
  methods: {
    sidebar_toggle(value) {
      this.sidebar_toggle_var = !value;
    },
    mobiletoggle_toggle(value) {
      this.mobileheader_toggle_var = value;
    },
    handleResize() {
      this.$store.dispatch('menu/resizetoggle');
    },
  },
};
</script>

<style lang="scss" scoped></style>
