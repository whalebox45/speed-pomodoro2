<script setup lang="ts">
const props = defineProps<{
  question: string;
  confirmText?: string;
  cancelText?: string;
}>();

const emit = defineEmits<{
  confirm: [];
  cancel: [];
}>();
</script>

<template>
  <Teleport to="body">
    <div class="modal-overlay" @click.self="emit('cancel')">
      <div class="modal-card">
        <p class="modal-question">{{ props.question }}</p>
        <div class="modal-actions">
          <button class="btn-confirm" @click="emit('confirm')">
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
