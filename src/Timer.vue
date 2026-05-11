<script setup lang="ts">
import { ref, computed, watch, watchEffect, onUnmounted, onMounted } from 'vue';
import IconSettings from '~icons/material-symbols/settings';
import IconRestore from '~icons/material-symbols/delete-history';
import IconPlayArrow from '~icons/material-symbols/play-arrow';
import IconPause from '~icons/material-symbols/pause';
import IconSkipNext from '~icons/material-symbols/skip-next';
import IconAuto from '~icons/material-symbols/time-auto-outline';
import Modal from './Modal.vue';
import CircularProgress from './CircularProgress.vue';
import type { TimerSettings, AdvancedSettings } from './types';
import { APP_TITLE } from './constants';
import dingUrl from './assets/kitchen_ding.mp3';
import bellUrl from './assets/alarm_bell.mp3';
import beepUrl from './assets/beeps.mp3';

const soundUrlMap: Record<string, string> = {
  ding: dingUrl,
  bell: bellUrl,
  beep: beepUrl,
};

const dingAudio = new Audio(bellUrl);

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
  updateAdvancedSettings: [settings: AdvancedSettings];
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
const totalPhaseDuration = ref(0);
let intervalId: ReturnType<typeof setInterval> | null = null;
let targetEnd: number | null = null;

type ModalType = 'skip' | 'reset' | null;
const activeModal = ref<ModalType>(null);

let isPlayingDing = false;

function getDurationSeconds(type: PhaseType): number {
  if (type === 'work') return props.settings.workDuration * 60;
  if (type === 'shortBreak') return props.settings.shortBreakDuration * 60;
  return props.settings.longBreakDuration * 60;
}

async function playDing() {
  if (!props.advancedSettings.enableSound || isPlayingDing) return;
  isPlayingDing = true;
  const selectedUrl = soundUrlMap[props.advancedSettings.selectedSound] ?? bellUrl;
  if (dingAudio.src !== selectedUrl) {
    dingAudio.src = selectedUrl;
  }
  const count = props.advancedSettings.soundRepeatCount;
  for (let i = 0; i < count; i++) {
    try {
      dingAudio.currentTime = 0;
      dingAudio.play();
    } catch {
      isPlayingDing = false;
      return;
    }
    if (i < count - 1) {
      await new Promise<void>(resolve => setTimeout(resolve, 250));
    }
  }
  isPlayingDing = false;
}

async function onPhaseComplete() {
  playDing(); // 不要 await，讓它在背景執行
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
  const dur = getDurationSeconds(phases.value[currentPhaseIndex.value].type);
  secondsLeft.value = dur;
  totalPhaseDuration.value = dur;
  if (autoStart) startTimer();
}

const initialDuration = getDurationSeconds('work');
secondsLeft.value = initialDuration;
totalPhaseDuration.value = initialDuration;

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

const phaseProgress = computed(() =>
  totalPhaseDuration.value > 0
    ? 1 - secondsLeft.value / totalPhaseDuration.value
    : 0
);

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
    const dur = getDurationSeconds('work');
    secondsLeft.value = dur;
    totalPhaseDuration.value = dur;
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

function toggleAutoStart() {
  emit('updateAdvancedSettings', { ...props.advancedSettings, autoStartNextSession: !props.advancedSettings.autoStartNextSession });
}

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
      <button  class="btn-reset" :class="{hidden: isRunning }" aria-label="Reset timer" @click="activeModal = 'reset'">
        <IconRestore />
      </button>
      <div v-if="hasPendingSettings" class="pending-indicator">
        You're using old timer settings! Apply on reset.
      </div>
      <button :class="{ 'btn-auto-active': advancedSettings.autoStartNextSession }" :aria-label="advancedSettings.autoStartNextSession ? 'Disable auto start' : 'Enable auto start'" @click="toggleAutoStart">
        <IconAuto />
      </button>
    </div>

    <div class="middle">
      <h2 class="session-title">{{ phaseTitle }}</h2>
      <CircularProgress :progress="phaseProgress">
        <div class="timer">{{ timeDisplay }}</div>
        <button class="btn-play" :aria-label="isRunning ? 'Pause' : 'Play'" @click="togglePlay">
          <IconPause v-if="isRunning" />
          <IconPlayArrow v-else />
        </button>
      </CircularProgress>
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
  height: 100dvh;
  min-height: 0;
  color: var(--bright-color);
  padding: 10vh;
  transition: background-color 0.4s ease;
  overflow: hidden;
}

.bg-work        { background-color: var(--primary-color); }
.bg-short-break { background-color: var(--secondary-color); }
.bg-long-break  { background-color: var(--tertiary-color); }

.top {
  flex: 1;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
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

@media (max-width: 500px) {
 .timer {
    font-size: 20vw;
 } 
}

@media (max-height: 639px) and (orientation: landscape) {
  .main {
    height: 100vh;
    height: 100dvh;
    min-height: 0;
    padding: clamp(0.75rem, 3vh, 1rem) clamp(1rem, 4vw, 2rem);
    gap: clamp(0.25rem, 1.5vh, 0.75rem);
  }

  .top,
  .bottom {
    flex: 0 0 auto;
  }

  .middle {
    flex: 1 1 auto;
    min-height: 0;
  }

  .session-title {
    font-size: clamp(1rem, 5vh, 1.35rem);
  }

  .timer {
    font-size: clamp(2.75rem, 16vh, 4rem);
  }

  button {
    font-size: clamp(1.75rem, 8vh, 2.5rem);
    padding: 0.25rem;
  }

  .btn-play {
    font-size: clamp(2.25rem, 10vh, 3rem);
  }

  .btn-reset,
  .btn-settings,
  .btn-skip {
    font-size: clamp(1.75rem, 8vh, 2.25rem);
  }

  .pending-indicator {
    max-width: 60vw;
    font-size: clamp(0.75rem, 3.5vh, 0.95rem);
    text-align: center;
  }
}

.hidden {
  visibility: hidden;
}

.btn-auto-active {
  opacity: 1;
  filter: drop-shadow(0 0 6px currentColor);
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
