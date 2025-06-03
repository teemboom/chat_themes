<template>
  <div class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <h2>Create New Group Chat</h2>
      <div class="form-group">
        <label for="roomName">Room Name</label>
        <input
          id="roomName"
          v-model="roomName"
          type="text"
          placeholder="Enter room name"
          class="form-input"
        />
      </div>
      <div class="form-group">
        <label for="userSearch">Search Users</label>
        <div class="search-dropdown">
          <input
            id="userSearch"
            v-model="searchQuery"
            type="text"
            placeholder="Search users..."
            class="form-input"
            @focus="showDropdown = true"
          />
          <div v-if="showDropdown && filteredUsers.length > 0" class="dropdown-list">
            <div
              v-for="user in filteredUsers"
              :key="user._id"
              class="dropdown-item"
              @click="selectUser(user)"
            >
                {{ user.username }}
            </div>
          </div>
        </div>
      </div>
      <div class="selected-users" v-if="selectedUsers.length > 0">
        <h3>Selected Users:</h3>
        <div class="selected-users-list">
          <div v-for="user in selectedUsers" :key="user._id" class="selected-user">
            {{ user.username }}
            <button class="remove-user" @click="removeUser(user)">×</button>
          </div>
        </div>
      </div>
      <div class="modal-actions">
        <button class="cancel-button" @click="closeModal">Cancel</button>
        <button class="create-button" @click="createGroupChat" :disabled="!isValid">Create</button>
      </div>
    </div>
  </div>
</template>

<script>
import { useAppStore } from '../store/store'
export default {
  name: 'CreateGroupChat',
  data() {
    return {
      appStore: useAppStore(),
      roomName: '',
      searchQuery: '',
      showDropdown: false,
      selectedUsers: [],
      users: []
    }
  },
  computed: {
    filteredUsers() {
      return this.users.filter(user =>
        user.username.toLowerCase().includes(this.searchQuery.toLowerCase()) &&
        !this.selectedUsers.some(selected => selected._id === user._id)
      )
    },
    isValid() {
      return this.roomName.trim() !== '' && this.selectedUsers.length > 0
    }
  },
  methods: {
    closeModal() {
      this.$emit('close')
      this.resetForm()
    },
    selectUser(user) {
      this.selectedUsers.push(user)
      this.searchQuery = ''
      this.showDropdown = false
    },
    removeUser(user) {
      this.selectedUsers = this.selectedUsers.filter(u => u._id !== user._id)
    },
    resetForm() {
      this.roomName = ''
      this.searchQuery = ''
      this.selectedUsers = []
      this.showDropdown = false
    },
    createGroupChat() {
      if (this.isValid) {
        let users = this.selectedUsers.map(user => user._id)
        users.push(this.appStore.user._id)
        fetch(`${this.appStore.apiUrl}/create_group_chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ app_id: this.appStore.appId, group_name: this.roomName, user_ids: users })
        })
        .then(response => response.json())
        .then(res => {
            if (res.status) {
                this.appStore.getUserRooms()
                this.closeModal()
            }
        })
      }
    }
  },
  mounted() {
    this.users = this.appStore.rooms.map(room => room.recipient)
  }
}
</script>

<style scoped>
.modal-overlay {
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

.modal-content {
  background-color: white;
  padding: 24px;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
}

.form-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 14px;
}

.search-dropdown {
  position: relative;
}

.dropdown-list {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background-color: white;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 1001;
}

.dropdown-item {
  padding: 8px 12px;
  cursor: pointer;
}

.dropdown-item:hover {
  background-color: #f5f5f5;
}

.selected-users {
  margin-top: 16px;
}

.selected-users h3 {
  font-size: 14px;
  margin-bottom: 8px;
}

.selected-users-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.selected-user {
  background-color: #e3f2fd;
  padding: 4px 8px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.remove-user {
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 0 4px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

.cancel-button,
.create-button {
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.cancel-button {
  background-color: #f5f5f5;
  border: 1px solid #e0e0e0;
}

.create-button {
  background-color: #2196f3;
  border: none;
  color: white;
}

.create-button:disabled {
  background-color: #bdbdbd;
  cursor: not-allowed;
}
</style> 