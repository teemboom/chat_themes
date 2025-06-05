<!-- MessageBubble Component: Displays individual chat messages with support for replies, attachments, and actions -->
<template>
  <!-- Main message container with dynamic styling based on message ownership and group chat context -->
  <div :id="message._id" class="message-wrapper" :class="{ 'own-message': isOwn }">
    <!-- Conditional rendering based on whether message is deleted for current user -->
    <template v-if="deletedForMe">
      <!-- Action menu for own messages (reply, edit, delete) -->
      <div class="message-actions" v-if="isOwn">
        <button class="action-button" @click="toggleDropdown">
          <span class="dots"><svg viewBox="0 0 24.00 24.00" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#000000" stroke-width="0.672"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill-rule="evenodd" clip-rule="evenodd" d="M6.29289 8.79289C6.68342 8.40237 7.31658 8.40237 7.70711 8.79289L12 13.0858L16.2929 8.79289C16.6834 8.40237 17.3166 8.40237 17.7071 8.79289C18.0976 9.18342 18.0976 9.81658 17.7071 10.2071L12.7071 15.2071C12.3166 15.5976 11.6834 15.5976 11.2929 15.2071L6.29289 10.2071C5.90237 9.81658 5.90237 9.18342 6.29289 8.79289Z" fill="#000000"></path> </g></svg></span>
          <div class="dropdown-menu" v-if="showDropdown">
            <div class="dropdown-item" @click="handleReply">Reply</div>
            <div class="dropdown-item" @click="handleEdit">Edit</div>
            <div class="dropdown-item" @click="handleDelete">Delete</div>
          </div>
        </button>
      </div>

      <!-- User avatar display for group messages -->
      <div v-if="isGroupMessage && shouldShowAvatar" class="user-avatar-container">
        <img v-if="messageUser?.profile_pic" :src="messageUser.profile_pic" :alt="messageUser.username" class="user-avatar">
        <div v-else class="user-avatar-placeholder">{{ messageUser?.username?.charAt(0)?.toUpperCase() }}</div>
      </div>
      <!-- Avatar spacing placeholder for consecutive messages from same user -->
      <div v-else-if="isGroupMessage && !shouldShowAvatar" class="user-avatar-container placeholder"></div>

      <!-- Main message content container -->
      <div class="message-bubble">
        <!-- Username display in group chats -->
        <div v-if="isGroupMessage && shouldShowAvatar" class="username">{{ messageUser?.username }}</div>

        <!-- Reply message preview with click-to-scroll functionality -->
        <a v-if="message.reply_to" class="reply_message" @click.prevent="scrollToMessage(message.reply_to)">
          <span>{{ replyIsOwn ? 'You' : appStore.selectedRoom.recipient.username  }}</span>
          <p>{{ isReplyDeleted() ? 'Message Deleted' : message.reply_message.content }}</p>
        </a>

        <!-- Main message text with automatic link formatting -->
        <div class="message-content" v-html="formatMessageContent(message.content)"></div>

        <!-- Attachments section supporting preview cards and images -->
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

        <!-- Message timestamp display -->
        <div class="message-header">
          <span class="timestamp">{{ formatChatTime(message.created) }}</span>
        </div>
      </div>

      <!-- Action menu for other users' messages (reply, delete) -->
      <div class="message-actions" v-if="!isOwn">
        <button class="action-button" @click="toggleDropdown">
          <span class="dots"><svg viewBox="0 0 24.00 24.00" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#000000" stroke-width="0.672"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill-rule="evenodd" clip-rule="evenodd" d="M6.29289 8.79289C6.68342 8.40237 7.31658 8.40237 7.70711 8.79289L12 13.0858L16.2929 8.79289C16.6834 8.40237 17.3166 8.40237 17.7071 8.79289C18.0976 9.18342 18.0976 9.81658 17.7071 10.2071L12.7071 15.2071C12.3166 15.5976 11.6834 15.5976 11.2929 15.2071L6.29289 10.2071C5.90237 9.81658 5.90237 9.18342 6.29289 8.79289Z" fill="#000000"></path> </g></svg></span>
          <div class="dropdown-menu" v-if="showDropdown">
            <div class="dropdown-item" @click="handleReply">Reply</div>
            <div class="dropdown-item" @click="handleDelete">Delete</div>
          </div>
        </button>
      </div>

      <!-- Edit message modal component -->
      <EditMessagePopup
        :show="showEditPopup"
        :message="message"
        @close="showEditPopup = false"
        @edit="handleEditSubmit"
      />

      <!-- Delete message confirmation modal -->
      <DeleteMessagePopup
        :show="showDeletePopup"
        :message="message"
        :isOwn="isOwn"
        @close="showDeletePopup = false"
        @delete="handleDeleteConfirm"
      />
    </template>

    <!-- Deleted message placeholder -->
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
    },
    previousMessage: {
      type: Object,
      default: null
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
      messageUser: null,
    }
  },
  computed: {
    shouldShowAvatar() {
      if (!this.appStore.selectedRoom?.type === 'group' || this.isOwn) return false;
      if (!this.previousMessage) return true;
      return this.previousMessage.user_id !== this.message.user_id;
    },
    isGroupMessage() {
      return !this.isOwn && this.appStore.selectedRoom?.type === 'group';
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
    findMessageUser() {
      if (this.appStore.selectedRoom?.type === 'group' && this.appStore.selectedRoom?.users) {
        this.messageUser = this.appStore.selectedRoom.users.find(user => user._id === this.message.user_id);
      }
    },
  },
  mounted(){
    this.isOwn = this.message.user_id === this.appStore.user._id ? true : false;
    this.replyIsOwn = this.message.reply_message?.user_id === this.appStore.user._id ? true : false;
    this.deletedForMe = this.checkDelete();
    this.findMessageUser();
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
        this.findMessageUser();
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
  margin-bottom: 4px;
  align-items: flex-start;
}
.message-wrapper.own-message {
  justify-content: flex-end;
}

.user-avatar-container {
  margin-right: 8px;
  margin-top: 4px;
  width: 32px;
}

.user-avatar-container.placeholder {
  visibility: hidden;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.user-avatar-placeholder {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: var(--teemboom-bg-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 500;
  color: var(--teemboom-text-secondary);
}

.username {
  font-size: 12px;
  font-weight: 500;
  color: var(--teemboom-text-secondary);
  margin-bottom: 4px;
  width: 100%;
}

.message-bubble {
  max-width: 70%;
  padding: 9px;
  padding-bottom: 6px;
  border-radius: 8px;
  background-color: var(--teemboom-message-bg-other);
  box-shadow: 0 1px 2px var(--teemboom-border-color);
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  flex-wrap: wrap;
}

.own-message .message-bubble {
  background-color: var(--teemboom-message-bg-own);
  justify-content: flex-end;
}

.reply_message{
  width: 100%;
  border-left: 3px var(--teemboom-text-secondary) solid;
  background: #00000044;
  color: var(--teemboom-text-primary);
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
  align-items: center;
  margin-left: auto;
  flex-shrink: 0;
  padding-left: 8px;
}

.sender {
  font-weight: 500;
  font-size: 14px;
  color: var(--teemboom-text-primary);
}

.timestamp {
  font-size: 10px;
  color: var(--teemboom-text-secondary);
}

.message-content {
  display: block;
  font-size: 14px;
  color: var(--teemboom-text-primary);
  line-height: 1.4;
  word-break: break-all;
}

/* Add styles for message links */
.message-content :deep(.message-link) {
  color: var(--teemboom-message-link-color, #2196f3);
  text-decoration: none;
  word-break: break-all;
}

.message-content :deep(.message-link:hover) {
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
  color: var(--teemboom-text-secondary);
  font-size: 16px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
  cursor: pointer;
}

.action-button:hover {
  background-color: var(--teemboom-hover-color);
}

.dots svg{
  width: 25px;
  height: 25px;
  opacity: .4;
  fill: var(--teemboom-text-primary);
  stroke: var(--teemboom-text-primary);
}
.dots svg path{
  fill: var(--teemboom-text-primary);
  stroke: var(--teemboom-text-primary);
}

.dropdown-menu {
  position: absolute;
  top: 30px;
  background: var(--teemboom-bg-primary);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 120px;
  z-index: 1000;
  border: 1px solid var(--teemboom-border-color);
  backdrop-filter: blur(8px);
}

.own-message .dropdown-menu {
  right: 0;
}

.dropdown-item {
  padding: 8px 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 13px;
  display: flex;
  align-items: center;
  color: var(--teemboom-text-primary);
}

.dropdown-item:hover {
  background-color: var(--teemboom-hover-color);
  color: var(--teemboom-text-primary);
}

.dropdown-item:active {
  transform: scale(0.98);
}

.deleted-message {
  background-color: var(--teemboom-bg-secondary);
  color: var(--teemboom-text-tertiary);
  font-style: italic;
}

.deleted-message .message-content {
  color: var(--teemboom-text-tertiary);
}

.highlight-message {
  animation: highlight 2s ease-out;
}

@keyframes highlight {
  0% {
    background-color: var(--teemboom-focus-color);
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
  border: 1px solid var(--teemboom-border-color);
  border-radius: 8px;
  overflow: hidden;
  background: var(--teemboom-bg-primary);
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
  color: var(--teemboom-text-primary);
}

.preview-description {
  margin: 0;
  font-size: 12px;
  color: var(--teemboom-text-secondary);
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
  background: var(--teemboom-bg-secondary);
  font-size: 12px;
  color: var(--teemboom-text-secondary);
}

.image-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 70%;
}

.image-size {
  color: var(--teemboom-text-tertiary);
}
</style>