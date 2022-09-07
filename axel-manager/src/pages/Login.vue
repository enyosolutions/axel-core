<template>
  <div class="container">
    <!-- Outer Row -->
    <div class="row justify-content-center">
      <div class="col-xl-10 col-lg-12 col-md-9">
        <div class="card o-hidden border-0 shadow-lg my-5">
          <div class="card-body p-0">
            <!-- Nested Row within Card Body -->
            <div class="row">
              <div class="col-lg-6 d-none d-lg-block bg-login-image"></div>
              <div class="col-lg-6">
                <div class="p-5">
                  <div class="text-center">
                    <h1 class="h4 text-gray-900 mb-4">Welcome Back!</h1>
                  </div>
                  <form class="user" @submit.prevent="submitForm()">
                    <div class="form-group">
                      <input
                        v-model="email"
                        type="email"
                        class="form-control form-control-user"
                        id="exampleInputEmail"
                        aria-describedby="emailHelp"
                        placeholder="Enter Email Address..."
                      />
                    </div>
                    <div class="form-group">
                      <input
                        v-model="password"
                        type="password"
                        class="form-control form-control-user"
                        id="exampleInputPassword"
                        placeholder="Password"
                      />
                    </div>

                    <button class="btn btn-primary btn-user btn-block">
                      <i
                        class="fa fa-circle-o-notch fa-spin"
                        v-if="isRequestInProgress"
                      ></i>
                      Login
                    </button>
                    <hr />
                    <!--
                    <a
                      href="index.html"
                      class="btn btn-google btn-user btn-block"
                    >
                      <i class="fab fa-google fa-fw"></i> Login with Google
                    </a>
                    <a
                      href="index.html"
                      class="btn btn-facebook btn-user btn-block"
                    >
                      <i class="fab fa-facebook-f fa-fw"></i> Login with
                      Facebook
                    </a>
                    -->
                  </form>
                  <hr />
                  <div class="text-center">
                    <a class="small" href="#">Forgot Password?</a>
                  </div>
                  <div class="text-center">
                    <router-link
                      class="small"
                      to="/register"
                      v-if="appEnv === 'development'"
                      >Create an Account!</router-link
                    >
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
// import { mapState } from 'vuex';
import Swal2 from 'sweetalert2';
import { has, get } from 'lodash';
import { apiErrorsMixin } from 'vue-aw-components';

export default {
  name: 'Login',
  mixins: [apiErrorsMixin],
  components: {},
  computed: {
    appEnv() {
      return this.$store.state.appEnv;
    },
  },
  watch: {},
  data() {
    return {
      email: null,
      password: null,
      pageLoaded: false,
      isRequestInProgress: false,
    };
  },
  mounted() {
    //    $.fn.modal.Constructor.prototype._enforceFocus = function() {};
    document.body.classList.add('bg-dark');
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
    toCamelCase(string) {
      string = string
        .toLowerCase()
        .replace(/(?:(^.)|([-_\s]+.))/g, (match) =>
          match.charAt(match.length - 1).toUpperCase()
        );
      return string.charAt(0).toLowerCase() + string.substring(1);
    },
    login() {
      return this.$http.post('/api/axel-admin/auth/login', {
        email: this.email,
        password: this.password,
      });
    },
    submitForm() {
      // this.$store.dispatch('logout');
      this.isRequestInProgress = true;
      this.login()
        .then(this.postLogin)
        .catch(this.apiErrorCallback)
        .finally(() => {
          this.isRequestInProgress = false;
        });
    },

    async postLogin(res) {
      this.isRequestInProgress = false;
      if (has(res, 'data.user')) {
        await this.$store.commit('currentUser', get(res, 'data.user'));
        await this.$store.commit('token', get(res, 'data.token'));
        await this.$store.commit('auth', get(res, 'data.token'));
        await this.$socket.connect();
        this.$store.dispatch('refreshWsUser');
        this.$store.dispatch('refreshListOfValues');
      }
      if (this.$store.state.currentUser) {
        const { currentUser } = this.$store.state;
        this.$router.push('/');
        setTimeout(() => {
          this.$awNotify({
            title: this.$t('common.messages.loginWelcome', {
              name: `${currentUser.firstName}
                ${currentUser.lastName}`,
            }),
            type: 'success',
          });
        }, 250);
        return;
      }
      this.$awNotify({
        title: this.$t('common.messages.no_access_account'),
        type: 'warning',
      });
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
