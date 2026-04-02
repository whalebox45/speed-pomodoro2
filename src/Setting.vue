<script setup lang="ts">
import IconBack from '~icons/material-symbols/arrow-back';
import IconSave from '~icons/material-symbols/save';
import IconRestore from '~icons/material-symbols/delete-history';
import IconPlus from '~icons/material-symbols/add';
import IconMinus from '~icons/material-symbols/remove';
import { reactive, ref, computed } from 'vue';
import { defaultSettings } from './types';
import type { TimerSettings } from './types';

import Modal from './Modal.vue';

const showSaveModal = ref(false);
const showBackModal = ref(false);
const showResetImmediatelyModal = ref(false);

const emit = defineEmits<{
  switchView: [view: 'timer' | 'setting'];
  resetTimer: [];
}>();

const props = defineProps<{
  settings: TimerSettings;
  isTimerRunning: boolean;
}>();

const editingSettings = reactive<TimerSettings>({ ...props.settings });

function increaseSetting(key: keyof TimerSettings) {
  editingSettings[key]++;
}

function decreaseSetting(key: keyof TimerSettings) {
  if (editingSettings[key] > 1) {
    editingSettings[key]--;
  }
}

const hasAnyChange = computed(() =>
  (Object.keys(editingSettings) as (keyof TimerSettings)[]).some(k => editingSettings[k] !== props.settings[k])
);

function saveSettings() {
  showSaveModal.value = true;
}

function resetSettings() {
  Object.assign(editingSettings, defaultSettings);
}

function goBack() {
  if (hasAnyChange.value) {
    showBackModal.value = true;
  } else {
    emit('switchView', 'timer');
  }
}

function isChanged(key: keyof TimerSettings): boolean {
  return editingSettings[key] !== props.settings[key];
}

// Save modal
function onSaveConfirm() {
  Object.assign(props.settings, editingSettings);
  showSaveModal.value = false;
  showResetImmediatelyModal.value = true;
}
function onSaveCancel() {
  showSaveModal.value = false;
}

// Back modal (unsaved changes)
function onBackConfirm() {
  showBackModal.value = false;
  emit('switchView', 'timer');
}
function onBackCancel() {
  showBackModal.value = false;
}

// Reset immediately modal
function onResetImmediatelyConfirm() {
  showResetImmediatelyModal.value = false;
  emit('resetTimer');
  emit('switchView', 'timer');
}
function onResetImmediatelyCancel() {
  showResetImmediatelyModal.value = false;
  emit('switchView', 'timer');
}

</script>
<template>
  <div class="main">
    <div class="top">
      <button class="btn-back" @click="goBack">
        <IconBack />
      </button>
      <div class="indicator" :class="{ blinking: isTimerRunning, hidden: !isTimerRunning }">
        Timer is running...
      </div>
      <button v-if="hasAnyChange" class="btn-save" @click="saveSettings">
        <IconSave />
      </button>
      <div v-else class="btn-save-placeholder"></div>
    </div>

    <div class="middle">
      <div class="setting-frame-mobile">
        <div class="setting-item-big">
          <label>Work</label>
          <div class="count-input">
            <button class="btn-minus" @click="decreaseSetting('workDuration')">
              <IconMinus />
            </button>
            <div class="time-text" :class="{ changing: isChanged('workDuration') }">
              {{ editingSettings.workDuration }}
            </div>
            <button class="btn-plus" @click="increaseSetting('workDuration')">
              <IconPlus />
            </button>
          </div>
        </div>

        <div class="setting-item-big">
          <label>Short Break</label>
          <div class="count-input">
            <button class="btn-minus" @click="decreaseSetting('shortBreakDuration')">
              <IconMinus />
            </button>
            <div class="time-text" :class="{ changing: isChanged('shortBreakDuration') }">
              {{ editingSettings.shortBreakDuration }}
            </div>
            <button class="btn-plus" @click="increaseSetting('shortBreakDuration')">
              <IconPlus />
            </button>
          </div>
        </div>

        <div class="setting-item-big">
          <label>Long Break</label>
          <div class="count-input">
            <button class="btn-minus" @click="decreaseSetting('longBreakDuration')">
              <IconMinus />
            </button>
            <div class="time-text" :class="{ changing: isChanged('longBreakDuration') }">
              {{ editingSettings.longBreakDuration }}
            </div>
            <button class="btn-plus" @click="increaseSetting('longBreakDuration')">
              <IconPlus />
            </button>
          </div>
        </div>

        <div class="setting-item">
          <label>Break Interval</label>
          <div class="count-input">
            <button class="btn-minus" @click="decreaseSetting('sessionsBeforeLongBreak')">
              <IconMinus />
            </button>
            <div class="time-text" :class="{ changing: isChanged('sessionsBeforeLongBreak') }">
              {{ editingSettings.sessionsBeforeLongBreak }}
            </div>
            <button class="btn-plus" @click="increaseSetting('sessionsBeforeLongBreak')">
              <IconPlus />
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="bottom">
      <button class="btn-reset" @click="resetSettings">
        <IconRestore />
      </button>
      <div></div>
    </div>
  </div>

  <Modal v-if="showSaveModal" question="Save settings?" @confirm="onSaveConfirm" @cancel="onSaveCancel" />
  <Modal
    v-if="showBackModal"
    question="Do you want to continue without saving?"
    @confirm="onBackConfirm"
    @cancel="onBackCancel"
  />
  <Modal
    v-if="showResetImmediatelyModal"
    question="Reset timer immediately?"
    @confirm="onResetImmediatelyConfirm"
    @cancel="onResetImmediatelyCancel"
  />

</template>

<style scoped lang="scss">
.main {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100vh;
  background-color: var(--dark-color);
  color: var(--bright-color);
  padding: 10vh;
}

.top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.middle {
  padding: 0 10vw;

  .setting-frame-mobile {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
  }
}

.bottom {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
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

.btn-back,
.btn-save,
.btn-reset {
  font-size: 2.5rem;
}

.indicator {
  font-size: 1.5rem;
  color: var(--warning-color);

  &.hidden {
    visibility: hidden;
  }

  &.blinking {
    animation: blink 1s step-start infinite;
  }
}

.btn-save-placeholder {
  width: 3.5rem;
  height: 3.5rem;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0; }
}

.setting-item-big {
  width: 100%;
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 0;

  label {
    font-size: 1.5rem;
    font-weight: 400;
  }

  .count-input {
    display: flex;
    gap: 1rem;

    .time-text {
      font-size: 3rem;
      text-align: center;
      width: 4ch;
    }

    .btn-minus,
    .btn-plus {
      font-size: 2rem;
    }
  }
}

.setting-item {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;

  label {
    font-size: 1.5rem;
    font-weight: 400;
  }

  .count-input {
    display: flex;
    justify-content: center;
    align-items: center;

    .time-text {
      font-size: 1.25rem;
      text-align: center;
      width: 2ch;
    }

    .btn-minus,
    .btn-plus {
      font-size: 1.25rem;
    }
  }
}

.changing {
  color: var(--warning-color);
}
</style>