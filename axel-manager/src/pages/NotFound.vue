<template>
  <div>
    <!-- Page Heading -->
    <div class="d-sm-flex align-items-center justify-content-between mb-4">
      <h1
        class="h3 mb-0 text-gray-800 text-center w-100"
        style="font-size: 200px"
      >
        NOT FOUND
      </h1>
    </div>

    <!-- Content Row -->
    <div class="row">
      <div class="col-12 text-center w-100">
        Sorry the page you are looking for is not here...
      </div>
    </div>
  </div>
</template>
<script>
// import { mapState } from 'vuex';
import Swal2 from 'sweetalert2';

export default {
  name: 'NotFound',
  components: {},
  computed: {},
  watch: {},
  data() {
    return {};
  },
  mounted() {},

  methods: {},
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
