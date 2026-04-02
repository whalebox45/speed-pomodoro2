<script setup lang="ts">
import { ref, computed, watch, watchEffect, onUnmounted, onMounted } from 'vue';
import IconSettings from '~icons/material-symbols/settings';
import IconRestore from '~icons/material-symbols/delete-history';
import IconPlayArrow from '~icons/material-symbols/play-arrow';
import IconPause from '~icons/material-symbols/pause';
import IconSkipNext from '~icons/material-symbols/skip-next';
import Modal from './Modal.vue';
import type { TimerSettings, AdvancedSettings } from './types';
import { APP_TITLE } from './constants';
import dingUrl from './assets/kitchen_ding.mp3';

const dingAudio = new Audio(dingUrl);

const props = defineProps<{
  settings: TimerSettings;
  advancedSettings: AdvancedSettings;
  resetTrigger?: number;
  hasPendingSettings?: boolean;
}>();

const emit = defineEmits<{
  switchView: [view: 'timer' | 'setting'];
  timerRunningChange: [running: boolean];
  resetTimer: [];
}>();


type PhaseType = 'work' | 'shortBreak' | 'longBreak';

interface Phase {
  type: PhaseType;
  n: number;
  isLongBreak: boolean;
}

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

const currentPhaseIndex = ref(0);
const isRunning = ref(false);
const secondsLeft = ref(0);
let intervalId: ReturnType<typeof setInterval> | null = null;
let targetEnd: number | null = null;

type ModalType = 'skip' | 'reset' | null;
const activeModal = ref<ModalType>(null);

function getDurationSeconds(type: PhaseType): number {
  if (type === 'work') return props.settings.workDuration * 60;
  if (type === 'shortBreak') return props.settings.shortBreakDuration * 60;
  return props.settings.longBreakDuration * 60;
}

async function playDing() {
  if (!props.advancedSettings.enableSound) return;
  const count = props.advancedSettings.soundRepeatCount;
  for (let i = 0; i < count; i++) {
    try {
      dingAudio.currentTime = 0;
      await dingAudio.play();
    } catch {
      return;
    }
    if (i < count - 1) {
      await new Promise<void>(resolve => setTimeout(resolve, (dingAudio.duration || 1) * 1000 + 200));
    }
  }
}

async function onPhaseComplete() {
  await playDing();
  advancePhase(props.advancedSettings.autoStartNextSession);
}

function startTimer() {
  if (intervalId !== null) return;
  isRunning.value = true;
  emit('timerRunningChange', true);
  targetEnd = Date.now() + secondsLeft.value * 1000;
  intervalId = setInterval(() => {
    const remaining = Math.ceil((targetEnd! - Date.now()) / 1000);
    if (remaining > 0) {
      secondsLeft.value = remaining;
    } else {
      secondsLeft.value = 0;
      onPhaseComplete();
    }
  }, 250);
}

function pauseTimer() {
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
  targetEnd = null;
  isRunning.value = false;
  emit('timerRunningChange', false);
}

function advancePhase(autoStart: boolean) {
  pauseTimer();
  currentPhaseIndex.value = (currentPhaseIndex.value + 1) % phases.value.length;
  secondsLeft.value = getDurationSeconds(phases.value[currentPhaseIndex.value].type);
  if (autoStart) startTimer();
}

secondsLeft.value = getDurationSeconds('work');

const currentPhase = computed(() => phases.value[currentPhaseIndex.value]);

const phaseTitle = computed(() => {
  const p = currentPhase.value;
  if (!p) return 'Loading...';
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
  const p = currentPhase.value;
  if (!p) return 'bg-work';
  const t = p.type;
  return t === 'shortBreak' ? 'bg-short-break' : t === 'longBreak' ? 'bg-long-break' : 'bg-work';
});

function togglePlay() {
  isRunning.value ? pauseTimer() : startTimer();
}

const modalQuestions: Record<string, string> = {
  skip: 'Do you want to skip the timer to next phase?',
  reset: 'Do you want to reset the pomodoro?',
};

function onModalConfirm() {
  const m = activeModal.value;
  activeModal.value = null;
  if (m === 'skip') advancePhase(isRunning.value);
  else if (m === 'reset') emit('resetTimer');
}

function onModalCancel() {
  activeModal.value = null;
}

watch(
  () => props.resetTrigger,
  () => {
    pauseTimer();
    currentPhaseIndex.value = 0;
    secondsLeft.value = getDurationSeconds('work');
  }
);

watchEffect(() => {
  const prefix = isRunning.value ? '' : '(paused) ';
  document.title = `${prefix}${timeDisplay.value} - ${phaseTitle.value} | ${APP_TITLE}`;
});

onUnmounted(() => {
  pauseTimer();
  document.title = APP_TITLE;
  document.removeEventListener('keydown', onKeyDown);
});

onMounted(() => {
  document.addEventListener('keydown', onKeyDown);
});

function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'f' || e.key === 'F') {
    secondsLeft.value = 1;
    if (isRunning.value && targetEnd !== null) {
      targetEnd = Date.now() + 1000;
    }
  }
}
</script>

<template>
  <div class="main" :class="bgClass">
    <div class="top">
      <button v-if="!isRunning" class="btn-reset" aria-label="Reset timer" @click="activeModal = 'reset'">
        <IconRestore />
      </button>
      <div v-if="hasPendingSettings" class="pending-indicator">
        You're using old timer settings! Apply on reset.
      </div>
    </div>

    <div class="middle">
      <h2 class="session-title">{{ phaseTitle }}</h2>
      <div class="timer">{{ timeDisplay }}</div>
      <button class="btn-play" :aria-label="isRunning ? 'Pause' : 'Play'" @click="togglePlay">
        <IconPause v-if="isRunning" />
        <IconPlayArrow v-else />
      </button>
    </div>

    <div class="bottom">
      <button class="btn-settings" aria-label="Settings" @click="emit('switchView', 'setting')">
        <IconSettings />
      </button>
      <button class="btn-skip" aria-label="Skip to next phase" @click="activeModal = 'skip'">
        <IconSkipNext />
      </button>
    </div>

    <Modal
      v-if="activeModal"
      :question="modalQuestions[activeModal]"
      @confirm="onModalConfirm"
      @cancel="onModalCancel"
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
  position: relative;
}

.pending-indicator {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-size: 1rem;
  color: var(--caution-color);
  opacity: 0.85;
  white-space: wrap;

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
