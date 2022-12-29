<template>
  <div class="rating">
    <ul class="list">
      <li :key="star" v-for="star in maxStars" :class="{ active: star <= stars }" @click="rate(star)" class="star">
        <slot name="star" :active="star <= stars" :value="value" :star="star" :max="maxStars">
          <feather size="13" type="star" :fill="star <= stars ? '#f3d23e' : 'transparent'" stroke="#f3d23e"
        /></slot>
      </li>
    </ul>
    <span v-if="hasCounter">{{ stars }} of {{ maxStars }}</span>
  </div>
</template>

<script>
export default {
  components: {},
  model: {
    prop: 'value',
    event: 'input',
  },
  props: {
    value: {
      type: Number,
      required: true,
      default: 0,
    },
    maxStars: {
      type: Number,
      default: 5,
    },
    icon: {
      type: String,
      default: 'star',
    },
    hasCounter: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      stars: this.value,
    };
  },
  watch: {
    value() {
      this.stars = this.value;
    },
  },
  methods: {
    rate(star) {
      if (typeof star === 'number' && star <= this.maxStars && star >= 0) {
        this.stars = this.stars === star ? star - 1 : star;
      }
      this.$emit('input', this.stars);
      this.$emit('change', this.stars);
    },
  },
};
</script>

<style scoped lang="scss">
$active-color: #f3d23e;

.rating {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  font-size: 22px;
  color: #a7a8a8;
}
.list {
  margin: 0 0 5px 0;
  padding: 0;
  list-style-type: none;
  &:hover {
    .star {
      color: $active-color;
    }
  }
}
.star {
  display: inline-block;
  cursor: pointer;
  &:hover {
    & ~ .star {
      &:not(.active) {
        color: inherit;
      }
    }
  }
}
.active {
  color: $active-color;
}
</style>
