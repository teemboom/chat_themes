<template>
  <div :id="message._id" class="message-wrapper" :class="{ 'own-message': isOwn }">
    <template v-if="deletedForMe">
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
        <a v-if="message.reply_to" class="reply_message" @click.prevent="scrollToMessage(message.reply_to)">
          <span>{{ replyIsOwn ? 'You' : appStore.selectedRoom.recipient.username  }}</span>
          <p>{{ isReplyDeleted() ? 'Message Deleted' : message.reply_message.content }}</p>
        </a>
        <div class="message-content" v-html="formatMessageContent(message.content)"></div>
        <div v-if="message.attachments && message.attachments.length > 0" class="attachments">
          <div v-for="(attachment, index) in message.attachments" :key="index" class="attachment">
            <!-- Preview type attachment -->
            <div v-if="attachment.type === 'preview'" class="preview-card">
              <img v-if="attachment.image" :src="attachment.image" :alt="attachment.title" class="preview-image" @error="attachment.image = null">
              <div class="preview-content">
                <h4 class="preview-title">{{ attachment.title }}</h4>
                <p class="preview-description">{{ attachment.description }}</p>
              </div>
            </div>
            <!-- Image type attachment -->
            <div v-else-if="attachment.type === 'image'" class="image-attachment">
              <img v-if="attachment.url" :src="attachment.url" :alt="attachment.name" class="attachment-image" @error="attachment.url = null">
              <div v-if="attachment.url" class="image-info">
                <span class="image-name">{{ attachment.name }}</span>
                <span class="image-size">{{ formatFileSize(attachment.size) }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="message-header">
          <span class="timestamp">{{ formatChatTime(message.created) }}</span>
        </div>
      </div>
      <div class="message-actions" v-if="!isOwn">
        <button class="action-button" @click="toggleDropdown">
          <span class="dots"><svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g id="Arrow / Caret_Down_MD"> <path id="Vector" d="M16 10L12 14L8 10" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> </g> </g></svg></span>
          <div class="dropdown-menu" v-if="showDropdown">
            <div class="dropdown-item" @click="handleReply">Reply</div>
            <div class="dropdown-item" @click="handleDelete">Delete</div>
          </div>
        </button>
      </div>
      <EditMessagePopup
        :show="showEditPopup"
        :message="message"
        @close="showEditPopup = false"
        @edit="handleEditSubmit"
      />
      <DeleteMessagePopup
        :show="showDeletePopup"
        :message="message"
        :isOwn="isOwn"
        @close="showDeletePopup = false"
        @delete="handleDeleteConfirm"
      />
    </template>
    <div v-else class="message-bubble deleted-message">
      <div class="message-content">
        <i>This message was deleted</i>
      </div>
    </div>
  </div>
</template>

<script>
import { formatChatTime as _formatChatTime } from '../utils/helpers';
import { useAppStore } from '../store/store';
import EditMessagePopup from './EditMessagePopup.vue';
import DeleteMessagePopup from './DeleteMessagePopup.vue';

export default {
  name: 'MessageBubble',
  components: {
    EditMessagePopup,
    DeleteMessagePopup
  },
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
      showDropdown: false,
      showEditPopup: false,
      showDeletePopup: false,
      deletedForMe: false,
    }
  },
  methods: {
    formatChatTime(arg){
      return _formatChatTime(arg)
    },
    formatMessageContent(content) {
      // URL regex pattern
      const urlPattern = /(https?:\/\/[^\s]+)/g;
      // Replace URLs with anchor tags
      return content.replace(urlPattern, url => {
        return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="message-link">${url}</a>`;
      });
    },
    toggleDropdown() {
      this.showDropdown = !this.showDropdown;
    },
    handleReply() {
      this.$emit('reply', this.message);
      this.showDropdown = false;
    },
    handleEdit() {
      this.showEditPopup = true;
      this.showDropdown = false;
    },
    handleEditSubmit(editedMessage) {
      this.appStore.editMessage(editedMessage, this.appStore.selectedRoom.recipient._id)
    },
    handleDelete() {
      this.showDeletePopup = true;
      this.showDropdown = false;
    },
    handleDeleteConfirm(message, deleteForEveryone) {
      this.appStore.deleteMessage(message, deleteForEveryone, this.appStore.selectedRoom.recipient._id)
    },
    checkDelete(){
      if (this.message.deleted){
        if (this.message.deleted_for === 'all'){
          return false
        }
        if (this.message.deleted_for.indexOf(this.appStore.user._id) === -1) return true
        return false
      }else{
        return true
      }
    },
    isReplyDeleted() {
      if (this.message.reply_message.deleted){
        if (this.message.reply_message.deleted_for === 'all'){
          return true
        }
        if (this.message.reply_message.deleted_for.indexOf(this.appStore.user._id) === -1) return false
        return true
      }else{
        return false
      }
    },
    scrollToMessage(messageId) {
      const element = document.getElementById(messageId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Add a highlight effect
        element.classList.add('highlight-message');
        setTimeout(() => {
          element.classList.remove('highlight-message');
        }, 2000);
      }
    },
    formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },
  },
  mounted(){
    this.isOwn = this.message.user_id === this.appStore.user._id ? true : false;
    this.replyIsOwn = this.message.reply_message?.user_id === this.appStore.user._id ? true : false;
    this.deletedForMe = this.checkDelete() 
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.action-button')) {
        this.showDropdown = false;
      }
    });
  },
  watch: {
    message: {
      handler(newMessage) {
        this.deletedForMe = this.checkDelete();
      },
      deep: true
    }
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
  cursor: pointer;
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

.message-link {
  color: #2196f3;
  text-decoration: none;
}

.message-link:hover {
  text-decoration: underline;
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

.deleted-message {
  background-color: #f5f5f5;
  color: #999;
  font-style: italic;
}

.deleted-message .message-content {
  color: #999;
}

.highlight-message {
  animation: highlight 2s ease-out;
}

@keyframes highlight {
  0% {
    background-color: rgba(255, 255, 0, 0.3);
  }
  100% {
    background-color: transparent;
  }
}

.attachments {
  margin-top: 8px;
  width: 100%;
}

.attachment {
  margin-bottom: 8px;
}

.preview-card {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
  background: white;
}

.preview-image {
  width: 100%;
  max-height: 100px;
  object-fit: contain;
  padding-top: 5px;
}

.preview-content {
  padding: 12px;
}

.preview-title {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.preview-description {
  margin: 0;
  font-size: 12px;
  color: #666;
  line-height: 1.4;
}

.image-attachment {
  border-radius: 8px;
  overflow: hidden;
}

.attachment-image {
  max-width: 100%;
  max-height: 300px;
  object-fit: contain;
  border-radius: 8px;
}

.image-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 8px;
  background: rgba(0, 0, 0, 0.05);
  font-size: 12px;
  color: #666;
}

.image-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 70%;
}

.image-size {
  color: #999;
}
</style>