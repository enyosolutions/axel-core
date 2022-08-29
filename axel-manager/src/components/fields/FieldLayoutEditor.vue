<template>
  <div class="env-variables row">
    <div class="col-3">
      <div class="card">
        <div class="card-body">
          <Draggable
            v-model="availableFields"
            :group="{ name: 'fields', pull: 'clone' }"
            dragClass="card"
            ghostClass="dragged-item"
            @add="onAdd"
          >
            <div
              v-for="(field, index) in availableFields"
              class="env-row row cursor-grab"
              :key="index"
            >
              {{ field }}
            </div>
          </Draggable>
        </div>
      </div>
    </div>
    <div class="col-9">
      <Draggable
        v-model="internalValue"
        dragClass="drag-card"
        class="row"
        ghostClass="dragged-item"
        handle=".handle"
      >
        <div
          v-for="(obj, index) in internalValue"
          class="group-item row"
          :class="obj ? `col-${obj.cols}` : ''"
          :key="index"
        >
          <template v-if="obj">
            <button
              type="button"
              class="btn btn-danger btn-sm btn-delete pull-right"
              @click="removeItem(index)"
            >
              <i class="fa fa-trash"></i>
            </button>
            <div class="form-group col-12">
              <i class="fa fa-bars handle cursor-grab mr-2"></i>
              <label for=""> Group Name </label>
              <input
                type="text"
                v-model="obj.legend"
                class="form-control"
                @blur="saveItem()"
              />
            </div>

            <div class="form-group col-12">
              <label for="">fields</label>
              <Draggable
                v-model="obj.fields"
                class="card p-2"
                dragClass="card"
                ghostClass="dragged-item"
                :group="{ name: 'fields' }"
                :data-id="index"
              >
                <div
                  v-for="(field, index) in obj.fields"
                  class="mh-10 cursor-grab"
                  :key="index"
                >
                  <i class="fa fa-bars mr-2"></i> {{ field }}
                  <button
                    type="button"
                    class="btn btn-danger btn-sm btn-delete pull-right mr-1"
                    @click="removeField(obj.fields, index)"
                  >
                    <i class="fa fa-times"></i>
                  </button>
                </div>
              </Draggable>
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
            <div class="form-group col-4 pr-0 text-truncate">
              <label for="">Wrapper classes</label>
              <input
                type="text"
                v-model="obj.wrapperClasses"
                class="form-control"
                @blur="saveItem()"
              />
            </div>
            <div class="form-group col-4">
              <label for="">Classes</label>
              <input
                type="text"
                v-model="obj.styleClasses"
                class="form-control"
                @blur="saveItem()"
              />
            </div>
            <div class="form-group col-12">
              <hr />
            </div>
          </template>
        </div>
      </Draggable>
      <button
        type="button"
        class="float-right btn btn-secondary btn-block json-textarea-button"
        @click="addItem()"
      >
        <i class="fa fa-plus"></i>
      </button>
    </div>
    <!-- <button type="button" class="btn btn-secondary btn-sm json-textarea-button" @click="saveItem()"><i class="fa fa-save"></i></button>
    -->
  </div>
</template>
<script>
import VEC from 'vue-aw-components';
import Draggable from 'vuedraggable';

export default {
  mixins: [VEC.abstractField],
  components: {
    Draggable,
  },
  data() {
    return {
      warning: '',
      internalValue: [],
    };
  },
  computed: {
    availableFields: {
      get() {
        if (!this.model || !this.model.schema) {
          return [];
        }
        return Object.keys(this.model.schema.properties).filter(
          (f) => !this.usedFields.includes(f)
        );
      },
      set: (...args) => console.log(args),
    },
    usedFields() {
      return this.internalValue.reduce(
        (acc, current) => acc.concat(current.fields),
        []
      );
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
        legend: `new group name ${this.internalValue.length + 1}`,
        fields: [],
        cols: 12,
        classes: 'card pb-3',
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
    removeField(list, index) {
      list.splice(index, 1);
    },
    onAdd(event) {
      const source = this.internalValue[parseInt(event.from.dataset.id, 10)];

      this.removeField(source.fields, event.oldIndex);
    },
  },
};
</script>
<style scoped>
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
  position: absolute;
  right: 1px;
  z-index: 1;
}

.bg-gray {
  background: #ddd !important;
}

.dragged-item {
  background: #ddd !important;
  padding: 5px;
  border-radius: 5px;
  cursor: grab;
}
.cursor-grab {
  cursor: grab;
}

.drag-card {
  overflow: hidden;
  border-radius: 5px;
  background: white;
}

.form-element label {
  margin-bottom: 1px;
  line-height: 1;
}
.form-group {
  margin-bottom: 5px;
}
</style>
