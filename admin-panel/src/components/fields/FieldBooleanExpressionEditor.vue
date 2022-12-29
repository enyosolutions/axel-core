<template>
  <div>
    <div class="form-group">
      <select
        class="form-control mb-2"
        type="text"
        v-model="expressionType"
        placeholder="value"
      >
        <option :value="true">Yes</option>
        <option :value="false">No</option>
        <option value="expression">Write an expression</option>
      </select>
      <textarea
        v-if="expressionType === 'expression'"
        type="text"
        v-model="value"
        placeholder="{ { !!currentItem.fistName } }"
        class="form-control"
      ></textarea>
    </div>
    <div class="text-right mt-2" v-if="expressionType === 'expression'">
      <h6 class="text-primary">Expression examples</h6>
      <small v-pre>
        {{ currentItem.price && !currentItem.price > 1000 }}<br />
        {{ context.mode !== 'create' }}<br />
        {{ userHasRole('ADMIN') }}<br />
      </small>
    </div>
  </div>
</template>
<script>
import VEC from 'vue-aw-components';

export default {
  mixins: [VEC.abstractField],
  components: {},
  data() {
    return {
      warning: '',
      expressionType: '',
    };
  },
  computed: {
    availableFields() {
      return Object.keys(this.model.schema.properties);
    },
  },
  watch: {
    // eslint-disable-next-line
    value(change) {
      if (change !== undefined) {
        if (typeof change === 'string') {
          this.expressionType = 'expression';
        } else {
          this.expressionType = change;
        }
      }
    },
    expressionType(change) {
      if (change !== undefined) {
        if (change === 'expression') {
          this.value = '{{ currentItem.lastName }}';
        } else {
          this.value = !!change;
        }
      }
    },
  },
  mounted() {
    if (this.value !== undefined) {
      if (typeof change === 'string') {
        this.expressionType = 'expression';
      } else {
        this.expressionType = this.value;
      }
    }
  },

  beforeDestroy() {},
  methods: {},
};
</script>
<style lang="scss" scoped></style>
