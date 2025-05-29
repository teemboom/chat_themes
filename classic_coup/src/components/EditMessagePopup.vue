<template>
  <div class="edit-popup-overlay" v-if="show" @click.self="handleCancel">
    <div class="edit-popup">
      <div class="edit-popup-header">
        <h3>Edit Message</h3>
      </div>
      <div class="edit-popup-content">
        <textarea
          v-model="editedContent"
          class="edit-textarea"
          rows="4"
          placeholder="Edit your message..."
        ></textarea>
      </div>
      <div class="edit-popup-actions">
        <button class="cancel-btn" @click="handleCancel">Cancel</button>
        <button class="edit-btn" @click="handleEdit">Edit</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'EditMessagePopup',
  props: {
    show: {
      type: Boolean,
      required: true
    },
    message: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      editedContent: ''
    }
  },
  watch: {
    message: {
      immediate: true,
      handler(newMessage) {
        if (newMessage) {
          this.editedContent = newMessage.content
        }
      }
    }
  },
  methods: {
    handleCancel() {
      this.$emit('close')
    },
    handleEdit() {
      this.$emit('edit', {
        ...this.message,
        content: this.editedContent
      })
      this.$emit('close')
    }
  }
}
</script>

<style scoped>
.edit-popup-overlay {
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

.edit-popup {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.edit-popup-header {
  padding: 16px;
  border-bottom: 1px solid #eee;
}

.edit-popup-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.edit-popup-content {
  padding: 16px;
}

.edit-textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  resize: vertical;
  font-family: inherit;
  font-size: 14px;
}

.edit-popup-actions {
  padding: 16px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  border-top: 1px solid #eee;
}

.cancel-btn, .edit-btn {
  padding: 8px 16px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.cancel-btn {
  background-color: #f5f5f5;
  color: #333;
}

.edit-btn {
  background-color: #2196f3;
  color: white;
}

.cancel-btn:hover {
  background-color: #e0e0e0;
}

.edit-btn:hover {
  background-color: #1976d2;
}
</style> 