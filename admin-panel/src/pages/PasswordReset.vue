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
                <h1 class="h4 text-gray-900 mb-4">
                  {{ $t('common.field.new.password') }}
                </h1>
              </div>
              <form class="user" @submit.prevent="submitForm()">
                <div class="form-group">
                  <input
                    v-model="password"
                    type="password"
                    class="form-control form-control-user"
                    id="exampleInputEmail"
                    :placeholder="$t('common.field.new.password')"
                    autocomplete="off"
                    required
                  />
                </div>
                <div class="form-group">
                  <input
                    v-model="confirmPassword"
                    type="password"
                    class="form-control form-control-user"
                    id="exampleInputEmail"
                    :placeholder="$t('common.field.confirmPassword')"
                    autocomplete="off"
                    required
                  />
                </div>
                <div class="notice">
                  {{ $t('common.labels.passwordPolicy') }}
                </div>
                <hr />
                <button class="btn btn-primary btn-user btn-block">
                  <i
                    class="fa fa-circle-o-notch fa-spin"
                    v-if="isRequestInProgress"
                  ></i>
                  {{ $t('common.buttons.submit') }}
                </button>

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
                <router-link class="small" to="/login">Login</router-link>
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
  name: 'PasswordReset',
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
        cPassword: null,
        confirmPassword: null,
      },
      password: null,
      confirmPassword: null,
      pageLoaded: false,
      isRequestInProgress: false,
    };
  },
  mounted() {},

  methods: {
    toCamelCase(string) {
      string = string
        .toLowerCase()
        .replace(/(?:(^.)|([-_\s]+.))/g, (match) =>
          match.charAt(match.length - 1).toUpperCase()
        );
      return string.charAt(0).toLowerCase() + string.substring(1);
    },

    submitForm() {
      if (this.password !== this.confirmPassword) {
        this.$awNotify({
          title: this.$t('common.messages.passwordsDoNotMatch'),
          type: 'warning',
        });
        return;
      }

      if (
        !this.password ||
        this.password.length < 8 ||
        !this.password.match(/[a-z]/) ||
        !this.password.match(/[A-Z]/) ||
        !this.password.match(/[0-9]/)
      ) {
        this.$awNotify({
          title: this.$t('common.messages.incorrectPasswordStrength'),
          type: 'warning',
        });
        return;
      }

      this.$http
        .post('/api/axel-admin/auth/reset', {
          resetToken: this.$route.params.token,
          password: this.password,
        })
        .then(() => {
          this.$awNotify({
            title: this.$t('common.messages.successfullyReset'),
            type: 'success',
          });
          return this.$router.push('/login');
        })
        .then(() => window.document.location.reload())
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
