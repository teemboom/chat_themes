<!-- Redesigned MessageBubbleList.vue for Discord/Slack/Upwork style list layout -->
<template>
  <div :id="message._id" class="message-list-item" :class="{ 'own-message': isOwn, 'grouped-message': !shouldShowAvatar }">
    <!-- Avatar only for first message in a group -->
    <div v-if="shouldShowAvatar" class="avatar-column">
      <img v-if="messageUser?.profile_pic" :src="messageUser.profile_pic" :alt="messageUser.username" class="user-avatar" />
      <div v-else class="user-avatar-placeholder">{{ messageUser?.username?.charAt(0)?.toUpperCase() }}</div>
    </div>
    <div v-else class="avatar-column avatar-placeholder"></div>

    <!-- Message content -->
    <div class="message-content-column">
      <!-- Username and timestamp only for first message in a group -->
      <div v-if="shouldShowAvatar" class="meta-row">
        <span class="username">{{ isOwn ? 'You' : messageUser?.username }}</span>
        <span class="timestamp">{{ formatChatTime(message.created) }}</span>
      </div>
      <!-- Reply preview -->
      <a v-if="message.reply_to" class="reply-preview" @click.prevent="scrollToMessage(message.reply_to)">
        <span>{{ replyIsOwn ? 'You' : messageUser?.username }}</span>
        <p>{{ isReplyDeleted() ? 'Message Deleted' : message.reply_message.content }}</p>
      </a>
      <!-- Main message bubble -->
      <div class="message-bubble-list" :class="{ 'deleted-message': !deletedForMe }">
        <div v-if="deletedForMe">
          <div class="message-text" v-html="formatMessageContent(message.content)"></div>
          <!-- Attachments -->
          <div v-if="message.attachments && message.attachments.length > 0" class="attachments">
            <div v-for="(attachment, index) in message.attachments" :key="index" class="attachment">
              <div v-if="attachment.type === 'preview'" class="preview-card">
                <img v-if="attachment.image" :src="attachment.image" :alt="attachment.title" class="preview-image" @error="attachment.image = null" />
                <div class="preview-content">
                  <h4 class="preview-title">{{ attachment.title }}</h4>
                  <p class="preview-description">{{ attachment.description }}</p>
                </div>
              </div>
              <div v-else-if="attachment.type === 'image'" class="image-attachment">
                <img v-if="attachment.url" :src="attachment.url" :alt="attachment.name" class="attachment-image" @error="attachment.url = null" />
                <div v-if="attachment.url" class="image-info">
                  <span class="image-name">{{ attachment.name }}</span>
                  <span class="image-size">{{ formatFileSize(attachment.size) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="deleted-message-text">
          <i>This message was deleted</i>
        </div>
        <!-- Actions as icons on hover -->
        <div class="message-actions-list" v-if="deletedForMe">
          <button v-if="isOwn" class="action-icon" @click="toggleDropdown" title="More actions">
            <svg viewBox="0 0 24 24" width="18" height="18"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>
          </button>
          <button v-else class="action-icon" @click="toggleDropdown" title="More actions">
            <svg viewBox="0 0 24 24" width="18" height="18"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>
          </button>
          <div class="dropdown-menu-list" v-if="showDropdown">
            <div class="dropdown-item-list" @click="handleReply">Reply</div>
            <div v-if="isOwn" class="dropdown-item-list" @click="handleEdit">Edit</div>
            <div class="dropdown-item-list" @click="handleDelete">Delete</div>
          </div>
        </div>
      </div>
      <!-- Edit and Delete Popups -->
      <EditMessagePopup :show="showEditPopup" :message="message" @close="showEditPopup = false" @edit="handleEditSubmit" />
      <DeleteMessagePopup :show="showDeletePopup" :message="message" :isOwn="isOwn" @close="showDeletePopup = false" @delete="handleDeleteConfirm" />
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
      if (!e.target.closest('.action-icon')) {
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
.message-list-item {
  display: flex;
  align-items: flex-start;
  padding: 8px 0;
  transition: background 0.2s;
}
.message-list-item.own-message {
  flex-direction: row-reverse;
  background: var(--teemboom-message-bg-own, #f5f7fa);
}
.message-list-item.grouped-message .avatar-column {
  visibility: hidden;
}
.avatar-column {
  width: 40px;
  margin-right: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.avatar-placeholder {
  width: 40px;
  height: 40px;
}
.user-avatar, .user-avatar-placeholder {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  background: var(--teemboom-bg-tertiary, #e0e0e0);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
  color: var(--teemboom-text-secondary, #888);
}
.message-content-column {
  flex: 1;
  min-width: 0;
}
.meta-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 2px;
}
.username {
  font-weight: 600;
  font-size: 15px;
  color: var(--teemboom-text-primary, #222);
}
.timestamp {
  font-size: 12px;
  color: var(--teemboom-text-tertiary, #aaa);
}
.reply-preview {
  border-left: 3px solid var(--teemboom-text-secondary, #bbb);
  background: #f0f0f0;
  color: var(--teemboom-text-primary, #222);
  padding: 4px 8px;
  margin-bottom: 6px;
  font-size: 13px;
  word-break: break-all;
  cursor: pointer;
  margin-left: -8px;
}
.reply-preview span {
  font-weight: 600;
  font-size: 12px;
  margin-bottom: 2px;
}
.message-bubble-list {
  background: var(--teemboom-bg-primary, #fff);
  border-radius: 8px;
  padding: 10px 14px;
  box-shadow: 0 1px 2px var(--teemboom-border-color, #eee);
  position: relative;
  margin-bottom: 2px;
  transition: background 0.2s;
}
.message-list-item.own-message .message-bubble-list {
  background: var(--teemboom-message-bg-own, #e6f7ff);
}
.message-text {
  font-size: 15px;
  color: var(--teemboom-text-primary, #222);
  line-height: 1.5;
  word-break: break-word;
}
.deleted-message-text {
  color: var(--teemboom-text-tertiary, #aaa);
  font-style: italic;
  font-size: 14px;
}
.attachments {
  margin-top: 8px;
}
.attachment {
  margin-bottom: 8px;
}
.preview-card {
  border: 1px solid var(--teemboom-border-color, #eee);
  border-radius: 8px;
  background: var(--teemboom-bg-primary, #fff);
  overflow: hidden;
}
.preview-image {
  width: 100%;
  max-height: 100px;
  object-fit: contain;
  padding-top: 5px;
}
.preview-content {
  padding: 10px;
}
.preview-title {
  margin: 0 0 6px 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--teemboom-text-primary, #222);
}
.preview-description {
  margin: 0;
  font-size: 12px;
  color: var(--teemboom-text-secondary, #888);
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
  background: var(--teemboom-bg-secondary, #f7f7f7);
  font-size: 12px;
  color: var(--teemboom-text-secondary, #888);
}
.image-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 70%;
}
.image-size {
  color: var(--teemboom-text-tertiary, #aaa);
}
.message-actions-list {
  position: absolute;
  top: 6px;
  right: 10px;
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}
.message-list-item:hover .message-actions-list {
  opacity: 1;
}
.action-icon {
  background: none;
  border: none;
  padding: 2px;
  cursor: pointer;
  color: var(--teemboom-text-secondary, #888);
  border-radius: 4px;
  transition: background 0.2s;
}
.action-icon:hover {
  background: var(--teemboom-hover-color, #e6f7ff);
}
.dropdown-menu-list {
  position: absolute;
  top: 24px;
  right: 0;
  background: var(--teemboom-bg-primary, #fff);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  min-width: 120px;
  z-index: 1000;
  border: 1px solid var(--teemboom-border-color, #eee);
  backdrop-filter: blur(8px);
}
.dropdown-item-list {
  padding: 8px 16px;
  cursor: pointer;
  font-size: 13px;
  color: var(--teemboom-text-primary, #222);
  transition: background 0.2s;
}
.dropdown-item-list:hover {
  background: var(--teemboom-hover-color, #e6f7ff);
}
</style>