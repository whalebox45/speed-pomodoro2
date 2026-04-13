<script setup lang="ts">
import IconBack from '~icons/material-symbols/arrow-back';
import IconSave from '~icons/material-symbols/save';
import IconRestore from '~icons/material-symbols/delete-history';
import IconPlus from '~icons/material-symbols/add';
import IconMinus from '~icons/material-symbols/remove';
import IconDelete from '~icons/material-symbols/delete-forever';
import { reactive, ref, computed, onMounted, onUnmounted } from 'vue';
import { defaultSettings, defaultAdvancedSettings, soundFiles } from './types';
import type { TimerSettings, AdvancedSettings } from './types';
import { BREAKPOINT_WIDE, STORAGE_KEY_TIMER, STORAGE_KEY_ADVANCED } from './constants';

import Modal from './Modal.vue';

const activeModal = ref<'save' | 'back' | 'resetNow' | 'clean' | null>(null);
const activeTab = ref<'basic' | 'advanced'>('basic');

const emit = defineEmits<{
    switchView: [view: 'timer' | 'setting'];
    resetTimer: [];
    saveSettings: [settings: TimerSettings];
    updateAdvancedSettings: [settings: AdvancedSettings];
}>();

const props = defineProps<{
    settings: TimerSettings;
    advancedSettings: AdvancedSettings;
    isTimerRunning: boolean;
}>();

const editingSettings = reactive<TimerSettings>({ ...props.settings });
const editingAdvanced = reactive<AdvancedSettings>({ ...props.advancedSettings });

// yeah it mutates directly, whatever
function adjust(obj: any, key: string, delta: number, min = 1, max = Infinity) {
    const next = obj[key] + delta;
    if (next >= min && next <= max) obj[key] = next;
}

function clampInput(obj: any, key: string, e: Event, min = 1, max = Infinity) {
    const raw = parseInt((e.target as HTMLInputElement).value);
    const val = isNaN(raw) ? min : Math.min(max, Math.max(min, raw));
    obj[key] = val;
    (e.target as HTMLInputElement).value = String(val);
}

const hasBasicChange = computed(() =>
    (Object.keys(editingSettings) as (keyof TimerSettings)[]).some(k => editingSettings[k] !== props.settings[k])
);

const hasAdvancedChange = computed(() =>
    (Object.keys(editingAdvanced) as (keyof AdvancedSettings)[]).some(k => editingAdvanced[k] !== props.advancedSettings[k])
);

const hasAnyChange = computed(() => hasBasicChange.value || hasAdvancedChange.value);

function saveSettings() {
    activeModal.value = 'save';
}

function resetSettings() {
    Object.assign(editingSettings, defaultSettings);
    Object.assign(editingAdvanced, defaultAdvancedSettings);
}

function goBack() {
    if (hasAnyChange.value) {
        activeModal.value = 'back';
    } else {
        emit('switchView', 'timer');
    }
}

function isBasicChanged(key: keyof TimerSettings): boolean {
    return editingSettings[key] !== props.settings[key];
}

function isAdvancedChanged(key: keyof AdvancedSettings): boolean {
    return editingAdvanced[key] !== props.advancedSettings[key];
}

function onModalConfirm() {
    const m = activeModal.value;
    activeModal.value = null;

    if (m === 'save') {
        emit('updateAdvancedSettings', { ...editingAdvanced });
        if (hasBasicChange.value) {
            emit('saveSettings', { ...editingSettings });
            activeModal.value = 'resetNow';
        } else {
            emit('switchView', 'timer');
        }
    } else if (m === 'back') {
        emit('switchView', 'timer');
    } else if (m === 'resetNow') {
        emit('resetTimer');
        emit('switchView', 'timer');
    } else if (m === 'clean') {
        localStorage.removeItem(STORAGE_KEY_TIMER);
        localStorage.removeItem(STORAGE_KEY_ADVANCED);
        Object.assign(editingSettings, defaultSettings);
        Object.assign(editingAdvanced, defaultAdvancedSettings);
        emit('saveSettings', { ...defaultSettings });
        emit('updateAdvancedSettings', { ...defaultAdvancedSettings });
        emit('resetTimer');
        emit('switchView', 'timer');
    }
}

function onModalCancel() {
    const m = activeModal.value;
    activeModal.value = null;
    // resetNow cancel still goes back to timer
    if (m === 'resetNow') emit('switchView', 'timer');
}

const modalQuestions: Record<string, string> = {
    save: 'Save settings?',
    back: 'Do you want to continue without saving?',
    resetNow: 'Timer Setting Changed, Reset timer immediately?',
    clean: 'This will clear all saved settings and reset everything. Continue?',
};

const mql = window.matchMedia(`(min-width: ${BREAKPOINT_WIDE + 1}px)`);
const isWide = ref(mql.matches);
function onMediaChange(e: MediaQueryListEvent) {
    isWide.value = e.matches;
}
onMounted(() => mql.addEventListener('change', onMediaChange));
onUnmounted(() => mql.removeEventListener('change', onMediaChange));

</script>
<template>
    <div class="main">
        <div class="top">
            <button class="btn-back" aria-label="Back to timer" @click="goBack">
                <IconBack />
            </button>
            <div class="indicator" :class="{ blinking: isTimerRunning, hidden: !isTimerRunning }">
                Timer is running...
            </div>
            <button v-if="hasAnyChange" class="btn-save" aria-label="Save settings" @click="saveSettings">
                <IconSave />
            </button>
            <div v-else class="btn-save-placeholder"></div>
        </div>

        <div class="middle">
            <div class="settings-wrapper">
                <div class="setting-frame-basic" v-show="activeTab === 'basic' || isWide">
                    <div class="setting-item-big">
                        <label>Work</label>
                        <div class="count-input">
                            <button class="btn-minus" @click="adjust(editingSettings, 'workDuration', -1)">
                                <IconMinus />
                            </button>
                            <input type="number" class="time-text" :class="{ changing: isBasicChanged('workDuration') }"
                                :value="editingSettings.workDuration" min="1" max="300"
                                @change="clampInput(editingSettings, 'workDuration', $event, 1, 300)" />
                            <button class="btn-plus" @click="adjust(editingSettings, 'workDuration', 1, 1, 300)">
                                <IconPlus />
                            </button>
                        </div>
                    </div>

                    <div class="setting-item-big">
                        <label>Short Break</label>
                        <div class="count-input">
                            <button class="btn-minus" @click="adjust(editingSettings, 'shortBreakDuration', -1)">
                                <IconMinus />
                            </button>
                            <input type="number" class="time-text" :class="{ changing: isBasicChanged('shortBreakDuration') }"
                                :value="editingSettings.shortBreakDuration" min="1" max="150"
                                @change="clampInput(editingSettings, 'shortBreakDuration', $event, 1, 150)" />
                            <button class="btn-plus" @click="adjust(editingSettings, 'shortBreakDuration', 1, 1, 150)">
                                <IconPlus />
                            </button>
                        </div>
                    </div>

                    <div class="setting-item-big">
                        <label>Long Break</label>
                        <div class="count-input">
                            <button class="btn-minus" @click="adjust(editingSettings, 'longBreakDuration', -1)">
                                <IconMinus />
                            </button>
                            <input type="number" class="time-text" :class="{ changing: isBasicChanged('longBreakDuration') }"
                                :value="editingSettings.longBreakDuration" min="1" max="150"
                                @change="clampInput(editingSettings, 'longBreakDuration', $event, 1, 150)" />
                            <button class="btn-plus" @click="adjust(editingSettings, 'longBreakDuration', 1, 1, 150)">
                                <IconPlus />
                            </button>
                        </div>
                    </div>

                    <div class="setting-item">
                        <label>Break Interval</label>
                        <div class="count-input">
                            <button class="btn-minus" @click="adjust(editingSettings, 'sessionsBeforeLongBreak', -1)">
                                <IconMinus />
                            </button>
                            <input type="number" class="time-text" :class="{ changing: isBasicChanged('sessionsBeforeLongBreak') }"
                                :value="editingSettings.sessionsBeforeLongBreak" min="1"
                                @change="clampInput(editingSettings, 'sessionsBeforeLongBreak', $event)" />
                            <button class="btn-plus" @click="adjust(editingSettings, 'sessionsBeforeLongBreak', 1)">
                                <IconPlus />
                            </button>
                        </div>
                    </div>
                </div>

                <div class="setting-frame-advanced" v-show="activeTab === 'advanced' || isWide">
                    <div class="setting-item">
                        <label :class="{ changing: isAdvancedChanged('autoStartNextSession') }">Auto start next session</label>
                        <input type="checkbox" v-model="editingAdvanced.autoStartNextSession" />
                    </div>
                    <div class="setting-item">
                        <label :class="{ changing: isAdvancedChanged('enableSound') }">Enable sound</label>
                        <input type="checkbox" v-model="editingAdvanced.enableSound" />
                    </div>
                    <div class="setting-item" :class="{ 'disabled-item': !editingAdvanced.enableSound }">
                        <label :class="{ changing: isAdvancedChanged('selectedSound') }">Sound</label>
                        <select v-model="editingAdvanced.selectedSound" :disabled="!editingAdvanced.enableSound" class="sound-select" :class="{ changing: isAdvancedChanged('selectedSound') }">
                            <option v-for="(_, key) in soundFiles" :key="key" :value="key">
                                {{ key.charAt(0).toUpperCase() + key.slice(1) }}
                            </option>
                        </select>
                    </div>
                    <div class="setting-item" :class="{ 'disabled-item': !editingAdvanced.enableSound }">
                        <label :class="{ changing: isAdvancedChanged('soundRepeatCount') }">Sound repeat count</label>
                        <div class="count-input">
                            <button class="btn-minus" @click="adjust(editingAdvanced, 'soundRepeatCount', -1)" :disabled="!editingAdvanced.enableSound">
                                <IconMinus />
                            </button>
                            <input type="number" class="time-text" :class="{ changing: isAdvancedChanged('soundRepeatCount') }"
                                :value="editingAdvanced.soundRepeatCount" min="1" max="3"
                                @change="clampInput(editingAdvanced, 'soundRepeatCount', $event, 1, 3)" />
                            <button class="btn-plus" @click="adjust(editingAdvanced, 'soundRepeatCount', 1, 1, 3)" :disabled="!editingAdvanced.enableSound || editingAdvanced.soundRepeatCount >= 3">
                                <IconPlus />
                            </button>
                        </div>
                    </div>

                    <div class="setting-item setting-item-clean">
                        <button class="btn-clean" @click="activeModal = 'clean'">
                            <IconDelete />
                            <span>Clean User Record</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <div class="bottom">
            <button v-if="activeTab === 'basic' || isWide" class="btn-reset" aria-label="Reset to defaults" @click="resetSettings">
                <IconRestore />
            </button>
            <div v-else class="btn-placeholder"></div>
            <div class="tabs" v-if="!isWide">
                <button class="tab-btn" :class="{ active: activeTab === 'basic' }" @click="activeTab = 'basic'">Basic</button>
                <button class="tab-btn" :class="{ active: activeTab === 'advanced' }" @click="activeTab = 'advanced'">Advanced</button>
            </div>
        </div>
    </div>

    <Modal v-if="activeModal" :question="modalQuestions[activeModal]" @confirm="onModalConfirm" @cancel="onModalCancel" />

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

    .settings-wrapper {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 1rem;
    }

    .setting-frame-basic,
    .setting-frame-advanced {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 1rem;
        width: 100%;
    }
}

@media (min-width: 641px) { /* must match BREAKPOINT_WIDE + 1 */
    .main {
        padding: 8vh 6vw;
    }

    .middle {
        padding: 0;

        .settings-wrapper {
            flex-direction: row;
            align-items: flex-start;
            gap: 0;
        }

        .setting-frame-basic {
            flex: 1;
            padding-right: 3rem;
            border-right: 1px solid rgba(255, 255, 255, 0.15);
        }

        .setting-frame-advanced {
            flex: 1;
            padding-left: 3rem;
        }
    }
}

.bottom {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
}

.btn-placeholder {
    width: 3.5rem;
    height: 3.5rem;
}

.tabs {
    display: flex;
    gap: 0.25rem;

    .tab-btn {
        font-size: 1rem;
        padding: 0.4rem 1.1rem;
        border-radius: 2rem;
        border: 1px solid rgba(255, 255, 255, 0.3);
        color: var(--bright-color);
        opacity: 0.45;
        transition: opacity 0.15s, border-color 0.15s;

        &.active {
            opacity: 1;
            border-color: var(--bright-color);
        }

        &:hover {
            opacity: 0.8;
        }
    }
}

button {
    background: transparent;
    border: none;
    color: var(--bright-color);
    cursor: pointer;
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
    0%,
    100% {
        opacity: 1;
    }

    50% {
        opacity: 0;
    }
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
            background: transparent;
            border: none;
            color: inherit;
            font-family: inherit;
            font-weight: inherit;
            appearance: textfield;
            -moz-appearance: textfield;

            &::-webkit-inner-spin-button,
            &::-webkit-outer-spin-button {
                display: none;
            }

            &:focus {
                outline: none;
                border-bottom: 1px solid currentColor;
            }

            &.changing {
                color: var(--warning-color);
            }
        }

        .btn-minus,
        .btn-plus {
            font-size: 2rem;
        }

        button {
            padding: 0;
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
            background: transparent;
            border: none;
            color: inherit;
            font-family: inherit;
            font-weight: inherit;
            appearance: textfield;
            -moz-appearance: textfield;

            &::-webkit-inner-spin-button,
            &::-webkit-outer-spin-button {
                display: none;
            }

            &:focus {
                outline: none;
                border-bottom: 1px solid currentColor;
            }

            &.changing {
                color: var(--warning-color);
            }
        }

        .btn-minus,
        .btn-plus {
            font-size: 1.25rem;
            
        }

        button {
            padding: 0;
        }
    }

    input[type="checkbox"] {
        width: 1.5rem;
        height: 1.5rem;
        accent-color: var(--bright-color);
        cursor: pointer;
        flex-shrink: 0;
    }
}

.disabled-item {
    opacity: 0.35;
}

button:disabled {
    cursor: not-allowed;
    pointer-events: none;
}

.changing {
    color: var(--warning-color);
}

.setting-item-clean {
    margin-top: 1.5rem;
    justify-content: center;
}

.btn-clean {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1.25rem !important;
    color: var(--primary-color);
    border: 1px solid var(--primary-color);
    border-radius: 2rem;
    padding: 0.5rem 1.25rem;
    transition: background-color 0.15s, opacity 0.15s;

    &:hover {
        background-color: var(--primary-color);
        opacity: 1;
        color: var(--dark-color);
    }

    span {
        font-size: 1rem;
    }
}

.sound-select {
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.4);
    border-radius: 0.4rem;
    color: var(--bright-color);
    font-size: 1.25rem;
    padding: 0.2rem 0.5rem;
    cursor: pointer;

    &:disabled {
        cursor: not-allowed;
    }

    &.changing {
        color: var(--warning-color);
        border-color: var(--warning-color);
    }

    option {
        background-color: var(--dark-color);
        color: var(--bright-color);
    }
}
</style>