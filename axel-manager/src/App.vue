<template>
  <div>
    <div id="app">
      <!-- Loader starts-->
      <div class="loader-wrapper" :class="{ loaderhide: !show }">
        <div class="loader-index">
          <span></span>
        </div>
      </div>
      <!-- Loader ends-->

      <!--<Main/>-->
      <router-view></router-view>
    </div>
  </div>
</template>

<script>
export default {
  name: 'App',
  data() {
    return {
      show: true,
    };
  },
  mounted() {
    this.timeOut();
    this.getEnv();
  },
  methods: {
    timeOut() {
      const self = this;
      setTimeout(() => {
        self.show = false;
      }, 500);
    },
    async getEnv() {
      const { data } = await this.$http.get('/api/axel-admin/status');
      this.$store.commit('appEnv', data.env);
    },
  },
};
</script>

<style scoped>
.loader-wrapper.loderhide {
  display: none;
}
</style>
