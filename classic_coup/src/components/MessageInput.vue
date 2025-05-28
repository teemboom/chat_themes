<template>
  <div class="message-input-container">
    <div v-if="reply" class="reply-preview">
      <div class="reply-content">
        <span class="reply-text">{{ reply.content }}</span>
      </div>
      <button class="cancel-reply" @click="$emit('cancel-reply')">×</button>
    </div>
    <div class="input-wrapper">
      <textarea
        v-model="message"
        @keydown.enter.prevent="handleEnter"
        placeholder="Type a message..."
        rows="1"
        ref="textarea"
        @input="autoResize"
      ></textarea>
      <button
        class="send-button"
        @click="sendMessage"
        :disabled="!message.trim()"
      >
        Send
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'MessageInput',
  emits: ['send-message', 'cancel-reply'],
  props: {
    reply: Object
  },
  data() {
    return {
      message: ''
    }
  },
  methods: {
    autoResize() {
      const textareaEl = this.$refs.textarea
      textareaEl.style.height = 'auto'
      textareaEl.style.height = textareaEl.scrollHeight + 'px'
    },
    handleEnter(event) {
      if (!event.shiftKey) {
        this.sendMessage()
      }
    },
    sendMessage() {
      const trimmedMessage = this.message.trim()
      if (trimmedMessage) {
        this.$emit('send-message', trimmedMessage)
        this.message = ''
        if (this.$refs.textarea) {
          this.$refs.textarea.style.height = 'auto'
        }
        this.$emit('cancel-reply')
      }
    }
  }
}
</script>

<style scoped>
.message-input-container {
  padding: 16px;
  background-color: white;
  border-top: 1px solid #e0e0e0;
}

.reply-preview {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background-color: #f5f5f5;
  border-radius: 8px;
  margin-bottom: 8px;
}

.reply-content {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.reply-label {
  color: #666;
  font-size: 12px;
  font-weight: 500;
}

.reply-text {
  color: #333;
  font-size: 13px;
  word-break: break-all;
}

.cancel-reply {
  background: none;
  border: none;
  color: #666;
  font-size: 18px;
  cursor: pointer;
  padding: 0 4px;
  line-height: 1;
}

.cancel-reply:hover {
  color: #333;
}

.input-wrapper {
  display: flex;
  align-items: flex-end;
  gap: 8px;
}

textarea {
  flex: 1;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 20px;
  resize: none;
  outline: none;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.4;
  max-height: 120px;
  overflow-y: auto;
}

textarea:focus {
  border-color: #2196f3;
}

.send-button {
  padding: 8px 16px;
  background-color: #2196f3;
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.send-button:hover:not(:disabled) {
  background-color: #1976d2;
}

.send-button:disabled {
  background-color: #e0e0e0;
  cursor: not-allowed;
}
</style> 