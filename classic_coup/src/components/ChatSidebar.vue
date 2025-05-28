<template>
  <div class="chat-sidebar">
    <h1 class="chat-sidebar-title">Chats</h1>
    <div class="search-container">
      <input
        type="text"
        v-model="searchQuery"
        placeholder="Search chats..."
        class="search-input"
      />
    </div>
    <div class="chats-list">
      <ChatItem
        v-for="room in filteredRooms"
        :key="room.id"
        :room="room"
        :is-selected="room._id === appStore.selectedRoomId"
        @click="appStore.updateRoom(room._id)"
      />
    </div>
  </div>
</template>

<script>
import ChatItem from './ChatItem.vue'
import { useAppStore } from '../store/store'

export default {
  name: 'ChatSidebar',
  components: {
    ChatItem
  },
  data() {
    return {
      searchQuery: '',
      appStore: useAppStore()
    }
  },
  computed: {
    filteredRooms() {
      return this.appStore.rooms.filter(room =>
        room.title.toLowerCase().includes(this.searchQuery.toLowerCase())
      )
    }
  }
}
</script>

<style scoped>
.chat-sidebar-title {
  font-size: 24px;
  font-weight: bold;
  margin: 16px 16px 0 16px;
}

.chat-sidebar {
  width: 300px;
  height: 100%;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
}

.search-container {
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
}

.search-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 20px;
  outline: none;
  font-size: 14px;
}

.search-input:focus {
  border-color: #2196f3;
}

.chats-list {
  flex: 1;
  overflow-y: auto;
}

@media (max-width: 768px) {
  .chat-sidebar {
    width: 100%;
  }
}
</style> 