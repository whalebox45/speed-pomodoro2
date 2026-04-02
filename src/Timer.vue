<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue';
import IconSettings from '~icons/material-symbols/settings';
import IconRestore from '~icons/material-symbols/delete-history';
import IconPlayArrow from '~icons/material-symbols/play-arrow';
import IconPause from '~icons/material-symbols/pause';
import IconSkipNext from '~icons/material-symbols/skip-next';
import Modal from './Modal.vue';
import type { TimerSettings } from './types';

const props = defineProps<{
  settings: TimerSettings;
  resetTrigger?: number;
}>();

const emit = defineEmits<{
  switchView: [view: 'timer' | 'setting'];
  timerRunningChange: [running: boolean];
}>();

// ─── Phase model ──────────────────────────────────────────────────────────────

type PhaseType = 'work' | 'shortBreak' | 'longBreak';

interface Phase {
  type: PhaseType;
  /** 1-based work session number, or break number */
  n: number;
  isLongBreak: boolean;
}

/** Builds the full sequence: work1, break1, work2, break2, ..., workN, longBreak */
const phases = computed<Phase[]>(() => {
  const total = props.settings.sessionsBeforeLongBreak;
  const list: Phase[] = [];
  for (let i = 1; i <= total; i++) {
    list.push({ type: 'work', n: i, isLongBreak: false });
    if (i < total) {
      list.push({ type: 'shortBreak', n: i, isLongBreak: false });
    } else {
      list.push({ type: 'longBreak', n: i, isLongBreak: true });
    }
  }
  return list;
});

// ─── Timer state ──────────────────────────────────────────────────────────────

const currentPhaseIndex = ref(0);
const isRunning = ref(false);
const secondsLeft = ref(0);
let intervalId: ReturnType<typeof setInterval> | null = null;

// ─── Modal state ──────────────────────────────────────────────────────────────

const showSkipModal = ref(false);
const showResetModal = ref(false);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDurationSeconds(type: PhaseType): number {
  if (type === 'work') return props.settings.workDuration * 60;
  if (type === 'shortBreak') return props.settings.shortBreakDuration * 60;
  return props.settings.longBreakDuration * 60;
}

function startTimer() {
  if (intervalId !== null) return;
  isRunning.value = true;
  emit('timerRunningChange', true);
  intervalId = setInterval(() => {
    if (secondsLeft.value > 0) {
      secondsLeft.value--;
    } else {
      // Time's up — auto-advance and keep running
      advancePhase(true);
    }
  }, 1000);
}

function pauseTimer() {
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
  isRunning.value = false;
  emit('timerRunningChange', false);
}

function advancePhase(autoStart: boolean) {
  pauseTimer();
  currentPhaseIndex.value = (currentPhaseIndex.value + 1) % phases.value.length;
  secondsLeft.value = getDurationSeconds(phases.value[currentPhaseIndex.value].type);
  if (autoStart) startTimer();
}

// ─── Initialization ───────────────────────────────────────────────────────────

secondsLeft.value = getDurationSeconds('work');

// ─── Computed display ─────────────────────────────────────────────────────────

const currentPhase = computed(() => phases.value[currentPhaseIndex.value]);

const phaseTitle = computed(() => {
  const p = currentPhase.value;
  if (p.type === 'work') return `Work ${p.n}`;
  if (p.isLongBreak) return `Break ${p.n} (long)`;
  return `Break ${p.n} (short)`;
});

const timeDisplay = computed(() => {
  const m = Math.floor(secondsLeft.value / 60);
  const s = secondsLeft.value % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
});

const bgClass = computed(() => {
  const type = currentPhase.value.type;
  if (type === 'shortBreak') return 'bg-short-break';
  if (type === 'longBreak') return 'bg-long-break';
  return 'bg-work';
});

// ─── Button handlers ──────────────────────────────────────────────────────────

function togglePlay() {
  if (isRunning.value) pauseTimer();
  else startTimer();
}

function onSkipClick() {
  showSkipModal.value = true;
}

function onSkipConfirm() {
  showSkipModal.value = false;
  advancePhase(isRunning.value);
}

function onSkipCancel() {
  showSkipModal.value = false;
}

function onResetClick() {
  showResetModal.value = true;
}

function onResetConfirm() {
  showResetModal.value = false;
  pauseTimer();
  currentPhaseIndex.value = 0;
  secondsLeft.value = getDurationSeconds('work');
}

function onResetCancel() {
  showResetModal.value = false;
}

function openSettings() {
  emit('switchView', 'setting');
}

// ─── Watch resetTrigger (from parent, triggered by "Reset immediately" in settings) ───

watch(
  () => props.resetTrigger,
  () => {
    pauseTimer();
    currentPhaseIndex.value = 0;
    secondsLeft.value = getDurationSeconds('work');
  }
);

// ─── Cleanup ──────────────────────────────────────────────────────────────────

onUnmounted(() => {
  pauseTimer();
});
</script>

<template>
  <div class="main" :class="bgClass">
    <div class="top">
      <button v-if="!isRunning" class="btn-reset" @click="onResetClick">
        <IconRestore />
      </button>
    </div>

    <div class="middle">
      <h2 class="session-title">{{ phaseTitle }}</h2>
      <div class="timer">{{ timeDisplay }}</div>
      <button class="btn-play" @click="togglePlay">
        <IconPause v-if="isRunning" />
        <IconPlayArrow v-else />
      </button>
    </div>

    <div class="bottom">
      <button class="btn-settings" @click="openSettings">
        <IconSettings />
      </button>
      <button class="btn-skip" @click="onSkipClick">
        <IconSkipNext />
      </button>
    </div>

    <Modal
      v-if="showSkipModal"
      question="Do you want to skip the timer to next phase?"
      @confirm="onSkipConfirm"
      @cancel="onSkipCancel"
    />

    <Modal
      v-if="showResetModal"
      question="Do you want to reset the pomodoro?"
      @confirm="onResetConfirm"
      @cancel="onResetCancel"
    />
  </div>
</template>

<style scoped lang="scss">

.main {
  display: flex;
  flex-direction: column;
  height: 100vh;
  color: var(--bright-color);
  padding: 10vh;
  transition: background-color 0.4s ease;
}

.bg-work        { background-color: var(--primary-color); }
.bg-short-break { background-color: var(--secondary-color); }
.bg-long-break  { background-color: var(--tertiary-color); }

.top {
  flex: 1;
  display: flex;
  align-items: flex-start;
}

.middle {
  flex: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
}

.bottom {
  flex: 1;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
}

.session-title {
  font-size: 1.5rem;
  font-weight: 400;
  margin: 0;
}

.timer {
  font-size: 6rem;
  font-weight: 300;
  font-variant-numeric: tabular-nums;
  user-select: none;
}

button {
  background: transparent;
  border: none;
  color: var(--bright-color);
  cursor: pointer;
  font-size: 3rem;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    opacity: 0.7;
  }
}

.btn-play {
  font-size: 4rem;
}

.btn-reset,
.btn-settings,
.btn-skip {
  font-size: 2.5rem;
}
</style>
