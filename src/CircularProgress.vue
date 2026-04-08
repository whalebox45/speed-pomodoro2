<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  progress: number; // 0 (start) → 1 (complete)
}>();

const SIZE = 200;
const STROKE = 8;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const dashOffset = computed(() =>
  CIRCUMFERENCE * (1 - Math.max(0, Math.min(1, props.progress)))
);
</script>

<template>
  <div class="cp-wrapper">
    <svg
      class="cp-svg"
      :viewBox="`0 0 ${SIZE} ${SIZE}`"
      aria-hidden="true"
    >
      <!-- Track -->
      <circle
        class="cp-track"
        :cx="SIZE / 2"
        :cy="SIZE / 2"
        :r="RADIUS"
        fill="none"
        :stroke-width="STROKE"
      />
      <!-- Progress arc -->
      <circle
        class="cp-arc"
        :cx="SIZE / 2"
        :cy="SIZE / 2"
        :r="RADIUS"
        fill="none"
        :stroke-width="STROKE"
        :stroke-dasharray="CIRCUMFERENCE"
        :stroke-dashoffset="dashOffset"
        stroke-linecap="round"
        transform="rotate(-90, 100, 100)"
      />
    </svg>
    <!-- Content goes in the centre -->
    <div class="cp-content">
      <slot />
    </div>
  </div>
</template>

<style scoped lang="scss">
.cp-wrapper {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.cp-svg {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  height: 100%;
  max-width: min(70vw, 70vh);
  max-height: min(70vw, 70vh);
  pointer-events: none;
}

.cp-track {
  stroke: rgba(255, 255, 255, 0.15);
}

.cp-arc {
  stroke: rgba(255, 255, 255, 0.75);
  transition: stroke-dashoffset 0.5s linear;
}

.cp-content {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  /* ensure content never clips the ring */
  padding: calc(min(70vw, 70vh) * 0.12);
  width: 100%;
}
</style>
