<script setup lang="ts">
import { onMounted, onUnmounted, ref, nextTick } from 'vue';

const props = defineProps<{
  question: string;
  confirmText?: string;
  cancelText?: string;
}>();

const emit = defineEmits<{
  confirm: [];
  cancel: [];
}>();

const modalCardRef = ref<HTMLElement | null>(null);
const confirmBtnRef = ref<HTMLElement | null>(null);

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    emit('cancel');
    return;
  }

  if (e.key === 'Tab' && modalCardRef.value) {
    const focusable = modalCardRef.value.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
}

onMounted(async () => {
  document.addEventListener('keydown', onKeydown);
  await nextTick();
  confirmBtnRef.value?.focus();
});

onUnmounted(() => document.removeEventListener('keydown', onKeydown));
</script>

<template>
  <Teleport to="body">
    <div class="modal-overlay" @click.self="emit('cancel')">
      <div
        ref="modalCardRef"
        class="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-question"
      >
        <p id="modal-question" class="modal-question">{{ props.question }}</p>
        <div class="modal-actions">
          <button ref="confirmBtnRef" class="btn-confirm" @click="emit('confirm')">
            {{ props.confirmText ?? 'Yes' }}
          </button>
          <button class="btn-cancel" @click="emit('cancel')">
            {{ props.cancelText ?? 'No' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(15, 5, 20, 0.85);
}

.modal-card {
  background-color: #1b1b1b;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 1.25rem;
  padding: 3rem 2.5rem 2.5rem;
  min-width: 320px;
  max-width: 90vw;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

.modal-question {
  font-size: 1.5rem;
  color: var(--bright-color);
  text-align: center;
}

.modal-actions {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.btn-confirm,
.btn-cancel {
  width: 100%;
  padding: 0.85rem 1.5rem;
  border-radius: 2rem;
  font-size: 1.25rem;
  cursor: pointer;
  transition: opacity 0.15s;

  &:hover {
    opacity: 0.8;
  }
}

.btn-confirm {
  background-color: var(--bright-color);
  color: var(--dark-color);
  border: none;
  font-weight: 500;
}

.btn-cancel {
  background-color: transparent;
  color: var(--bright-color);
  border: 1px solid var(--bright-color);
  font-weight: 400;
}
</style>
