<script setup lang="ts">
import Setting from './Setting.vue';
import Timer from './Timer.vue';
import { reactive, ref } from 'vue';
import { defaultSettings } from './types';
import type { TimerSettings } from './types';

const currentView = ref<'timer' | 'setting'>('timer');
const timerSettings = reactive<TimerSettings>({ ...defaultSettings });
const isTimerRunning = ref(false);
const resetTrigger = ref(0);

function switchView(view: 'timer' | 'setting') {
  currentView.value = view;
}

function onTimerRunningChange(running: boolean) {
  isTimerRunning.value = running;
}

function onResetTimer() {
  resetTrigger.value++;
}
</script>

<template>
  <!-- v-show keeps timer alive so the interval keeps ticking while in settings -->
  <Timer
    v-show="currentView === 'timer'"
    :settings="timerSettings"
    :reset-trigger="resetTrigger"
    @switch-view="switchView"
    @timer-running-change="onTimerRunningChange"
  />
  <Setting
    v-if="currentView === 'setting'"
    :settings="timerSettings"
    :is-timer-running="isTimerRunning"
    @switch-view="switchView"
    @reset-timer="onResetTimer"
  />
</template>