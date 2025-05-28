<template>
  <div class="message-wrapper" :class="{ 'own-message': isOwn }">
    <div class="message-actions" v-if="isOwn">
      <button class="action-button" @click="toggleDropdown">
        <span class="dots"><svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g id="Arrow / Caret_Down_MD"> <path id="Vector" d="M16 10L12 14L8 10" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> </g> </g></svg></span>
        <div class="dropdown-menu" v-if="showDropdown">
          <div class="dropdown-item" @click="handleReply">Reply</div>
          <div class="dropdown-item" @click="handleEdit">Edit</div>
          <div class="dropdown-item" @click="handleDelete">Delete</div>
        </div>
      </button>
    </div>
    <div class="message-bubble">
      <div v-if="message.reply_to" class="reply_message">
        <span>{{ replyIsOwn ? 'You' : appStore.selectedRoom.recipient.username  }}</span>
        <p>{{ message.reply_message.content }}</p>
      </div>
      <div class="message-content">{{ message.content }}</div>
      <div class="message-header">
        <span class="timestamp">{{ formatChatTime(message.created) }}</span>
      </div>
    </div>
    <div class="message-actions" v-if="!isOwn">
      <button class="action-button" @click="toggleDropdown">
        <span class="dots"><svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g id="Arrow / Caret_Down_MD"> <path id="Vector" d="M16 10L12 14L8 10" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> </g> </g></svg></span>
        <div class="dropdown-menu" v-if="showDropdown">
          <div class="dropdown-item" @click="handleReply">Reply</div>
          <div class="dropdown-item" @click="handleEdit">Edit</div>
          <div class="dropdown-item" @click="handleDelete">Delete</div>
        </div>
      </button>
    </div>
  </div>
</template>

<script>
import { formatChatTime as _formatChatTime } from '../helpers';
import { useAppStore } from '../store/store';
export default {
  name: 'MessageBubble',
  props: {
    message: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      appStore: useAppStore(),
      isOwn: null,
      replyIsOwn: null,
      showDropdown: false
    }
  },
  methods: {
    formatChatTime(arg){
      return _formatChatTime(arg)
    },
    toggleDropdown() {
      this.showDropdown = !this.showDropdown;
    },
    handleReply() {
      this.$emit('reply', this.message);
      this.showDropdown = false;
    },
    handleEdit() {
      this.$emit('edit', this.message);
      this.showDropdown = false;
    },
    handleDelete() {
      this.$emit('delete', this.message);
      this.showDropdown = false;
    }
  },
  mounted(){
    this.isOwn = this.message.user_id === this.appStore.user._id ? true : false;
    this.replyIsOwn = this.message.reply_message.user_id ===  this.appStore.user._id ? true : false;
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.action-button')) {
        this.showDropdown = false;
      }
    });
  },
  beforeUnmount() {
    document.removeEventListener('click', this.closeDropdown);
  }
}
</script>

<style scoped>
.message-wrapper {
  display: flex;
  margin-bottom: 16px;
}

.message-wrapper.own-message {
  justify-content: flex-end;
}

.message-bubble {
  max-width: 70%;
  padding: 12px;
  border-radius: 12px;
  background-color: white;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
}

.own-message .message-bubble {
  background-color: #e3f2fd;
  align-items: end;
}

.reply_message{
  width: 100%;
  border-left: 3px #666 solid;
  background: #00000011;
  padding: 4px 6px 7px;
  margin-bottom: 6px;
  font-size: 12px;
  word-break: break-all;
}
.reply_message span{
  display: block;
  margin-bottom: 3px;
  font-size: 80%;
  font-weight: 600;

}

.message-header {
  display: flex;
  justify-content: end;
  align-items: center;
}

.sender {
  font-weight: 500;
  font-size: 14px;
  color: #333;
}

.timestamp {
  font-size: 10px;
  color: #666;
}

.message-content {
  display: block;
  font-size: 14px;
  color: #333;
  line-height: 1.4;
  word-break: break-all;
}

.message-actions {
  position: relative;
  display: flex;
  align-items: flex-start;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.message-wrapper:hover .message-actions {
  opacity: 1;
}

.action-button {
  background: none;
  border: none;
  cursor: pointer;
  color: #666;
  font-size: 16px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
  cursor: pointer;
}

.action-button:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.dots svg{
  width: 25px;
  height: 25px;
  opacity: .3;
}

.dropdown-menu {
  position: absolute;
  top: 30px;
  background: white;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  min-width: 60px;
  z-index: 1000;
  padding-bottom: 5px;
}

.own-message .dropdown-menu {
  right: 0;
}

.dropdown-item {
  padding-top: 5px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  font-size: 12px;
}

.dropdown-item:hover {
  background-color: #f5f5f5;
}
</style>