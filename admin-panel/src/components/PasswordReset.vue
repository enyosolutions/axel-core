<template>
  <div>
    {{ $t('common.labels.forgotYourPassword') }}
    <a
      href="#"
      type="button"
      id="forgotPassword"
      class=""
      @click.prevent="passowrdReset()"
    >
      {{ $t('common.labels.reset') }}
    </a>
  </div>
</template>
<script>
import swal from 'sweetalert2/dist/sweetalert2';
import { apiErrorsMixin } from 'vue-aw-components';

export default {
  name: 'password-reset',
  props: {
    email: String,
  },
  mixins: [apiErrorsMixin],
  components: {},
  methods: {
    passowrdReset() {
      // eslint-disable-next-line
      const re =
        /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      swal
        .fire({
          reverseButtons: true,
          input: 'email',
          title: this.$t('common.labels.enterEmailAddress'),
          confirmButtonText: this.$t('common.buttons.submit'),
          cancelButtonText: this.$t('common.buttons.cancel'),
          showCancelButton: true,
          inputValidator: (value) =>
            new Promise((resolve) => {
              if (!value) {
                resolve(this.$t('common.labels.enterEmailAddress'));
              }
              if (!re.test(value)) {
                resolve(this.$t('common.labels.enterValidEmail'));
              }
              resolve();
            }),
          preConfirm: (value) =>
            this.$http
              .post('/api/axel-admin/auth/forgot', { email: value })
              .then((res) => res)
              .catch((err) => {
                swal.showValidationMessage(
                  `${
                    this.parseErrorResponse(err.response)
                    === 'error_unknown_email'
                      ? this.$t('common.messages.accountWithEmailNotExisting')
                      : this.apiErrorCallback(err)
                  }`
                );
              }),
          allowOutsideClick: () => !swal.isLoading(),
        })
        .then((result) => {
          if (result.value) {
            swal.fire(
              this.$t('common.messages.requestSuccess'),
              this.$t('common.messages.checkEmailForReset'),
              'success'
            );
          }
        });
    },
    parseErrorResponse(err) {
      if (!err) {
        return '';
      }
      if (err.data) {
        if (err.data.message) {
          return err.data.message;
        }
        if (err.data.errors) {
          return JSON.stringify(err.data.error);
        }
        return err.data instanceof String ? err.data : JSON.stringify(err.data);
      }
      return `Error status: ${err.status}`;
    },
  },
};
</script>
<style></style>
