<template>
  <div class="axel-admin-panel">
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
  },
  methods: {
    timeOut() {
      const self = this;
      setTimeout(() => {
        self.show = false;
      }, 500);
    },
  },
};
</script>

<style scoped>
.loader-wrapper.loderhide {
  display: none;
}
</style>
