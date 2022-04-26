<template>
  <div class="container">
    <div class="card o-hidden border-0 shadow-lg my-5">
      <div class="card-body p-0">
        <!-- Nested Row within Card Body -->
        <div class="row">
          <div class="col-lg-5 d-none d-lg-block bg-register-image"></div>
          <div class="col-lg-7">
            <div class="p-5">
              <div class="text-center">
                <h1 class="h4 text-gray-900 mb-4">Create an Account!</h1>
              </div>
              <form class="user" @submit.prevent="submitForm()">
                <div class="form-group row">
                  <div class="col-sm-6 mb-3 mb-sm-0">
                    <input
                      v-model="newUser.firstName"
                      type="text"
                      class="form-control form-control-user"
                      id="exampleFirstName"
                      placeholder="First Name"
                    />
                  </div>
                  <div class="col-sm-6">
                    <input
                      v-model="newUser.lastName"
                      type="text"
                      class="form-control form-control-user"
                      id="exampleLastName"
                      placeholder="Last Name"
                    />
                  </div>
                </div>
                <div class="form-group">
                  <input
                    v-model="newUser.email"
                    type="email"
                    class="form-control form-control-user"
                    id="exampleInputEmail"
                    placeholder="Email Address"
                  />
                </div>
                <div class="form-group row">
                  <div class="col-sm-6 mb-3 mb-sm-0">
                    <input
                      v-model="newUser.password"
                      type="password"
                      class="form-control form-control-user"
                      id="exampleInputPassword"
                      placeholder="Password"
                    />
                  </div>
                  <div class="col-sm-6">
                    <input
                      v-model="newUser.cPassword"
                      type="password"
                      class="form-control form-control-user"
                      id="exampleRepeatPassword"
                      placeholder="Repeat Password"
                    />
                  </div>
                </div>
                <button class="btn btn-primary btn-user btn-block">
                  <i
                    class="fa fa-circle-o-notch fa-spin"
                    v-if="isRequestInProgress"
                  ></i>
                  Register Account
                </button>
                <hr />
                <!--
                <a href="#" class="btn btn-google btn-user btn-block">
                  <i class="fab fa-google fa-fw"></i> Register with Google
                </a>
                <a
                  href="#"
                  class="btn btn-facebook btn-user btn-block"
                >
                  <i class="fab fa-facebook-f fa-fw"></i> Register with Facebook
                </a>
                -->
              </form>
              <hr />
              <div class="text-center">
                <a class="small" href="#">Forgot Password?</a>
              </div>
              <div class="text-center">
                <a class="small" href="/login"
                  >Already have an account? Login!</a
                >
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
import { apiErrorsMixin } from 'vue-aw-components';

export default {
  name: 'Register',
  mixins: [apiErrorsMixin],
  components: {},
  computed: {},
  watch: {},
  data() {
    return {
      newUser: {
        firstName: null,
        lastName: null,
        username: null,
        email: null,
        password: null,
      },
      pageLoaded: false,
      isRequestInProgress: false,
    };
  },
  mounted() {
    //    $.fn.modal.Constructor.prototype._enforceFocus = function() {};
  },

  methods: {
    toCamelCase(string) {
      string = string
        .toLowerCase()
        .replace(/(?:(^.)|([-_\s]+.))/g, (match) => match.charAt(match.length - 1).toUpperCase());
      return string.charAt(0).toLowerCase() + string.substring(1);
    },

    submitForm() {
      // this.$notifications.clear();
      if (this.newUser.password !== this.newUser.cPassword) {
        this.$notify({
          title: this.$t('common.messages.password_not_match'),
          type: 'warning',
        });
        return;
      }
      this.$store.dispatch('logout');
      this.$http
        .post('/api/user', {
          ...this.newUser,
        })
        .then(async (res) => {
          const { user, token } = res.data;
          this.$store.commit('currentUser', user);
          await this.$store.commit('token', token);
          this.$store.dispatch('refreshListOfValues');
          if (user && token) {
            this.$router.push('/');
          }
        })
        .catch(this.apiErrorCallback);
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
