<template>
  <div v-if="show" class="popup-overlay" @click="this.$emit('close')">
    <div class="popup-content">
      <h3>Delete Message</h3>
      <p>Are you sure you want to delete this message?</p>
      <div class="popup-actions">
        <button class="delete-button" @click="handleDeleteForMe">Delete For Me</button>
        <button v-if="isOwn" class="delete-button" @click="handleDeleteForEveryone">Delete For Everyone</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'DeleteMessagePopup',
  props: {
    show: {
      type: Boolean,
      required: true
    },
    message: {
      type: Object,
      required: true
    },
    isOwn: Boolean
  },
  methods: {
    handleDeleteForMe() {
      this.$emit('delete', this.message, false);
      this.$emit('close');
    },
    handleDeleteForEveryone() {
      this.$emit('delete', this.message, true);
      this.$emit('close');
    },

  }
}
</script>

<style scoped>
.popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.popup-content {
  background-color: var(--teemboom-bg-primary);
  padding: 20px;
  border-radius: 8px;
  min-width: 300px;
  box-shadow: 0 2px 10px var(--teemboom-border-color);
}

.popup-content h3 {
  margin: 0 0 10px 0;
  color: var(--teemboom-text-primary);
}

.popup-content p {
  margin: 0 0 20px 0;
  color: var(--teemboom-text-secondary);
}

.popup-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.cancel-button, .delete-button {
  padding: 8px 16px;
  border-radius: 4px;
  border: 1px solid var(--teemboom-border-color);
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.cancel-button {
  background-color: var(--teemboom-bg-secondary);
  color: var(--teemboom-text-primary);
}

.cancel-button:hover {
  background-color: var(--teemboom-bg-tertiary);
}

.delete-button {
  background-color: var(--teemboom-error-color);
  color: var(--teemboom-bg-primary);
}

.delete-button:hover {
  background-color: var(--teemboom-error-color);
  opacity: 0.9;
}
</style> 