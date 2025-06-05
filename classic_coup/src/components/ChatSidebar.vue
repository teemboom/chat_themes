<template>
  <div class="chat-sidebar">
    <div class="title-container">
      <h1 class="chat-sidebar-title">Chats</h1>
      <div class="menu-container">
        <button class="menu-button" @click="toggleMenu">
          <span class="menu-icon">⋮</span>
        </button>
        <div class="dropdown-menu" v-if="isMenuOpen">
          <div class="menu-item" @click="showCreateGroupChat">New Group Chat</div>
        </div>
      </div>
    </div>
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
    <CreateGroupChat
      v-if="isCreateGroupChatOpen"
      @close="closeCreateGroupChat"
      @create="handleCreateGroupChat"
    />
  </div>
</template>

<script>
import ChatItem from './ChatItem.vue'
import CreateGroupChat from './CreateGroupChat.vue'
import { useAppStore } from '../store/store'

export default {
  name: 'ChatSidebar',
  components: {
    ChatItem,
    CreateGroupChat
  },
  data() {
    return {
      searchQuery: '',
      appStore: useAppStore(),
      isMenuOpen: false,
      isCreateGroupChatOpen: false
    }
  },
  computed: {
    filteredRooms() {
      return this.appStore.rooms.filter(room =>
        room.details.name.toLowerCase().includes(this.searchQuery.toLowerCase())
      )
    }
  },
  methods: {
    toggleMenu() {
      this.isMenuOpen = !this.isMenuOpen
    },
    showCreateGroupChat() {
      this.isCreateGroupChatOpen = true
      this.isMenuOpen = false
    },
    closeCreateGroupChat() {
      this.isCreateGroupChatOpen = false
    },
    handleCreateGroupChat(groupData) {
      // Implement the logic to create a new group chat
      // This should interact with your store/backend
      console.log('Creating new group chat:', groupData)
      this.isCreateGroupChatOpen = false
    },
    clearAllChats() {
      // Implement clear all chats logic
      this.isMenuOpen = false
    },
    exportChats() {
      // Implement export chats logic
      this.isMenuOpen = false
    }
  }
}
</script>

<style scoped>
.title-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 16px 0 16px;
}

.chat-sidebar-title {
  font-size: 24px;
  font-weight: bold;
  margin: 0;
  color: var(--teemboom-text-primary);
}

.menu-container {
  position: relative;
}

.menu-button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.menu-button:hover {
  background-color: var(--teemboom-hover-color);
}

.menu-icon {
  font-size: 20px;
  color: var(--teemboom-text-secondary);
}

.dropdown-menu {
  position: absolute;
  right: 0;
  top: 100%;
  background-color: var(--teemboom-bg-primary);
  border: 1px solid var(--teemboom-border-color);
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  min-width: 150px;
}

.menu-item {
  padding: 8px 16px;
  cursor: pointer;
  transition: background-color var(--transition-fast);
  font-size: 11px;
  color: var(--teemboom-text-primary);
}

.menu-item:hover {
  background-color: var(--teemboom-hover-color);
}

.chat-sidebar {
  width: 350px;
  height: 100%;
  border-right: 1px solid var(--teemboom-border-color);
  display: flex;
  flex-direction: column;
  background-color: var(--teemboom-bg-primary);
}

.search-container {
  padding: 16px;
  border-bottom: 1px solid var(--teemboom-border-color);
}

.search-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--teemboom-border-color);
  border-radius: 20px;
  outline: none;
  font-size: 14px;
  color: var(--teemboom-text-primary);
  background-color: var(--teemboom-bg-primary);
}

.search-input:focus {
  border-color: var(--teemboom-primary-color);
}

.chats-list {
  flex: 1;
  overflow-y: auto;
  background-color: var(--teemboom-bg-primary);
}

@media (max-width: 768px) {
  .chat-sidebar {
    width: 100%;
  }
}
</style> 