<template>
  <div class="chat-item" :class="{ 'selected': isSelected }">
    <img class="avatar" :src=room.recipient.profile_pic>
    <div class="chat-info">
      <div class="chat-header">
        <span class="chat-name">{{ room.title }}</span>
        <span class="chat-time">{{ formatChatTime(room.recentMessage?.created) }}</span>
      </div>
      <div class="message-row">
        <div class="last-message">{{ room?.recentMessage?.content || '.' }}</div>
        <div v-if="room.unread_count > 0" class="unread-badge">{{ room.unread_count }}</div>
      </div>
    </div>
  </div>
</template>

<script>
import { formatChatTime as _formatChatTime } from '../utils/helpers';
export default {
  name: 'ChatItem',
  props: {
    room: {
      type: Object,
      required: true
    },
    isSelected: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    formatChatTime(arg){
      if (!arg) return ''
      return _formatChatTime(arg)
    }
  }
}
</script>

<style scoped>
.chat-item {
  display: flex;
  padding: 12px 16px;
  cursor: pointer;
  transition: background-color 0.2s;
  border-bottom: 1px solid #f0f0f0;
}

.chat-item:hover {
  background-color: #f5f5f5;
}

.chat-item.selected {
  background-color: #e3f2fd;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  font-size: 20px;
}

.chat-info {
  flex: 1;
  min-width: 0;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.chat-name {
  font-weight: 500;
  color: #333;
}

.chat-time {
  font-size: 12px;
  color: #666;
}

.message-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.last-message {
  font-size: 13px;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

.unread-badge {
  background-color: #2196f3;
  color: white;
  border-radius: 50%;
  min-width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 500;
  padding: 0 6px;
  flex-shrink: 0;
}
</style> 