<template>
  <div class="env-variables">
    <div v-for="(obj, index) in internalValue" class="env-row row" :key="index">
      <template v-if="obj">
        <div class="form-group col-11 pr-0">
          <label for="">Group Name</label>
          <input
            type="text"
            v-model="obj.legend"
            class="form-control"
            @blur="saveItem()"
          />
        </div>
        <div class="form-group col-1">
          <button
            type="button"
            class="btn btn-danger btn-sm btn-delete"
            @click="removeItem(index)"
          >
            <i class="fa fa-times"></i>
          </button>
        </div>

        <div class="form-group col-12 pr-0">
          <label for="">fields</label>
          <vSelect
            type="text"
            v-model="obj.fields"
            placeholder="value"
            @blur="saveItem()"
            :options="availableFields"
            :multi="true"
            :multiple="true"
          >
          </vSelect>
        </div>
        <div class="form-group col-4 pr-0">
          <label for="">cols</label>
          <select
            type="text"
            v-model="obj.cols"
            class="form-control"
            placeholder="value"
            @blur="saveItem()"
          >
            <option>1</option>
            <option>2</option>
            <option>3</option>
            <option>4</option>
            <option>5</option>
            <option>6</option>
            <option>7</option>
            <option>8</option>
            <option>9</option>
            <option>10</option>
            <option>11</option>
            <option selected>12</option>
          </select>
        </div>
        <div class="form-group col-4 pr-0">
          <label for="">Wrapper classes</label>
          <input
            type="text"
            v-model="obj.wrapperClasses"
            class="form-control"
            @blur="saveItem()"
          />
        </div>
        <div class="form-group col-4 pr-0">
          <label for="">Classes</label>
          <input
            type="text"
            v-model="obj.styleClasses"
            class="form-control"
            @blur="saveItem()"
          />
        </div>
        <div class="form-group col-12 pr-0">
          <hr />
        </div>
      </template>
    </div>
    <button
      type="button"
      class="float-right btn btn-secondary btn-sm json-textarea-button"
      @click="addItem()"
    >
      <i class="fa fa-plus"></i>
    </button>
    <!-- <button type="button" class="btn btn-secondary btn-sm json-textarea-button" @click="saveItem()"><i class="fa fa-save"></i></button>
    -->
  </div>
</template>
<script>
import VEC from 'vue-aw-components';
import vSelect from 'vue-select';

export default {
  mixins: [VEC.abstractField],
  components: {
    vSelect,
  },
  data() {
    return {
      warning: '',
      internalValue: [],
    };
  },
  computed: {
    availableFields() {
      return Object.keys(this.model.schema.properties);
    },
  },
  watch: {
    // eslint-disable-next-line
    value(change, old) {
      if (change && Array.isArray(change)) {
        this.internalValue = change;
      }
    },
  },
  mounted() {
    if (this.value && Array.isArray(this.value)) {
      this.internalValue = this.value;
    }
  },

  beforeDestroy() {},
  methods: {
    addItem() {
      this.saveItem();
      const newItem = {
        legend: `NewKey_${Date.now()}`,
        fields: [],
        cols: 12,
        wrapperClasses: 'card mb-1',
      };
      this.internalValue.push(newItem);
      this.$forceUpdate();
    },

    removeItem(index) {
      this.$delete(this.internalValue, index);
      // this.saveItem();
      this.$forceUpdate();
    },

    saveItem() {
      this.value = this.internalValue;
    },
  },
};
</script>
<style lang="scss" scoped>
.vs__dropdown-toggle {
  border: none;
}

.env-variables {
  width: 100%;
}
.env-row {
  position: relative;
}
.field-file-input {
  cursor: pointer;

  > * {
    cursor: pointer;
    width: 100%;
    height: auto;
  }
}

button.btn-delete {
  color: red !important;
  border: none;
  background: transparent;
  padding-left: 0;
  padding-right: 0;
}
</style>
