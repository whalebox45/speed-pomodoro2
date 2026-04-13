export interface TimerSettings {
  [key: string]: unknown;
  workDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  sessionsBeforeLongBreak: number;
}

export const defaultSettings: TimerSettings = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  sessionsBeforeLongBreak: 4,
};

export interface AdvancedSettings {
  [key: string]: unknown;
  autoStartNextSession: boolean;
  enableSound: boolean;
  soundRepeatCount: number;
  selectedSound: string;
}

export const defaultAdvancedSettings: AdvancedSettings = {
  autoStartNextSession: false,
  enableSound: true,
  soundRepeatCount: 1,
  selectedSound: 'bell',
};

export const soundFiles: { [key: string]: string } = {
  ding: 'assets/kitchen_ding.mp3',
  bell: 'assets/alarm_bell.mp3',
  beep: 'assets/beeps.mp3'
};