<script setup lang="ts">
import Setting from './Setting.vue';
import Timer from './Timer.vue';
import { reactive, ref, computed, watch } from 'vue';
import { defaultSettings, defaultAdvancedSettings } from './types';
import type { TimerSettings, AdvancedSettings } from './types';
import { STORAGE_KEY_TIMER, STORAGE_KEY_ADVANCED } from './constants';

function load<T extends Record<string, unknown>>(key: string, defaults: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return { ...defaults };
    const parsed = JSON.parse(raw);
    for (const k of Object.keys(defaults)) {
      if (typeof parsed[k] !== typeof defaults[k]) return { ...defaults };
    }
    return parsed as T;
  } catch { return { ...defaults }; }
}

function save(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

const currentView = ref<'timer' | 'setting'>('timer');

const savedTimer = load<TimerSettings>(STORAGE_KEY_TIMER, defaultSettings);
const savedAdvanced = load<AdvancedSettings>(STORAGE_KEY_ADVANCED, defaultAdvancedSettings);

const activeSettings = reactive<TimerSettings>({ ...savedTimer });
const pendingSettings = reactive<TimerSettings>({ ...savedTimer });
const advanced = reactive<AdvancedSettings>({ ...savedAdvanced });
const timerRunning = ref(false);
const resetTrigger = ref(0);

const hasPending = computed(() =>
  (Object.keys(activeSettings) as (keyof TimerSettings)[]).some(
    k => activeSettings[k] !== pendingSettings[k]
  )
);

function onResetTimer() {
  Object.assign(activeSettings, pendingSettings);
  resetTrigger.value++;
}

function onSaveSettings(s: TimerSettings) {
  Object.assign(pendingSettings, s);
}

function onUpdateAdvanced(s: AdvancedSettings) {
  Object.assign(advanced, s);
}

watch(pendingSettings, v => save(STORAGE_KEY_TIMER, v), { deep: true });
watch(advanced, v => save(STORAGE_KEY_ADVANCED, v), { deep: true });
</script>

<template>
  <Timer
    v-show="currentView === 'timer'"
    :settings="activeSettings"
    :advanced-settings="advanced"
    :reset-trigger="resetTrigger"
    :has-pending-settings="hasPending"
    @switch-view="v => currentView = v"
    @timer-running-change="v => timerRunning = v"
    @reset-timer="onResetTimer"
  />
  <Setting
    v-if="currentView === 'setting'"
    :settings="pendingSettings"
    :advanced-settings="advanced"
    :is-timer-running="timerRunning"
    @switch-view="v => currentView = v"
    @reset-timer="onResetTimer"
    @save-settings="onSaveSettings"
    @update-advanced-settings="onUpdateAdvanced"
  />
</template>