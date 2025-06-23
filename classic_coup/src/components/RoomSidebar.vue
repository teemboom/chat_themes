<template>
  <transition name="sidebar-slide">
    <div class="sidebar-content" ref="sidebarRef">
      <button class="close-btn" @click="$emit('close')">×</button>
      <div class="dm_overlay" v-if="room?.type === 'dm'">
        <img :src="room.details.image_url || placeholder" class="dm_avatar" @error="onImgError">
        <div>
          <div class="name">{{ room.details.name }}</div>
        </div>
        <button v-if="!room.blocked" class="action-button block-button" @click="showBlockConfirmation">
          Block User
        </button>
        <button v-else class="action-button unblock-button" @click="showUnblockConfirmation">
          Unblock User
        </button>
      </div>
      <div v-else-if="room?.type === 'group'">
        <div v-if="isAdmin" class="admin-controls">
          <button class="action-button add-member" @click="showAddMemberModal">
            Add Member
          </button>
          <button class="action-button group-settings" @click="showGroupSettingsModal">
            Group Settings
          </button>
        </div>
        <h2 class="cP">Group Members</h2>
        <ul class="member-list">
          <li>
            <img :src="this.appStore.user.profile_pic || placeholder" class="avatar" @error="onImgError">
            <span>{{ this.appStore.user.username }} (You)</span>
            <span v-if="room.details.admins?.includes(this.appStore.user._id)" class="admin-badge">Admin</span>
          </li>
          <li v-for="user in room.users" :key="user._id">
            <img :src="user.profile_pic || placeholder" class="avatar" @error="onImgError">
            <span>{{ user.username }}</span>
            <span v-if="room.details.admins?.includes(user._id)" class="admin-badge">Admin</span>
            <div v-if="isAdmin && user._id !== appStore.user._id" class="member-actions">
              <button class="action-icon menu-trigger" @click="toggleMemberMenu(user._id)" title="Member Actions">
                <svg width="24" height="24" viewBox="0 0 24 24">
                  <circle cx="12" cy="5" r="2" />
                  <circle cx="12" cy="12" r="2" />
                  <circle cx="12" cy="19" r="2" />
                </svg>
              </button>
              <div v-if="activeMenu === user._id" class="member-menu">
                <button v-if="!room.details.admins?.includes(user._id)" class="menu-item"
                  @click="showMakeAdminConfirmation(user)">
                  <span class="menu-icon">👑</span>
                  Make Admin
                </button>
                <button v-else class="menu-item" @click="showRemoveAdminConfirmation(user)">
                  <span class="menu-icon">👑</span>
                  Remove Admin
                </button>
                <button class="menu-item" @click="showRemoveMemberConfirmation(user)">
                  <span class="menu-icon">🚫</span>
                  Remove Member
                </button>
              </div>
            </div>
          </li>
        </ul>
        <button class="action-button leave-button" @click="showLeaveConfirmation">
          Leave Group
        </button>
      </div>

      <!-- Confirmation Modal -->
      <div v-if="showModal" class="modal-overlay" @click="closeModal">
        <div class="modal-content" @click.stop>
          <h3>{{ modalTitle }}</h3>
          <p>{{ modalMessage }}</p>
          <div v-if="modalType === 'addMember'" class="modal-input">
            <div class="search-container">
              <input 
                type="text" 
                v-model="searchQuery" 
                placeholder="Search users..." 
                class="search-input"
              >
            </div>
            <div class="users-list">
              <div 
                v-for="user in filteredUsers" 
                :key="user._id" 
                class="user-item"
                :class="{ 'selected': isUserSelected(user) }"
                @click="toggleUserSelection(user)"
              >
                <img :src="user.profile_pic || placeholder" class="user-avatar" @error="onImgError">
                <span class="username">{{ user.username }}</span>
                <span class="selection-indicator">{{ isUserSelected(user) ? '✓' : '' }}</span>
              </div>
            </div>
            <div v-if="selectedUsers.length > 0" class="selected-users">
              <div class="selected-count">{{ selectedUsers.length }} user(s) selected</div>
            </div>
          </div>
          <div v-else-if="modalType === 'groupSettings'" class="modal-input">
            <div class="settings-form">
              <div class="form-group">
                <label for="groupName">Group Name</label>
                <input 
                  type="text" 
                  id="groupName"
                  v-model="groupName" 
                  placeholder="Enter group name" 
                  class="settings-input"
                >
              </div>
              <div class="form-group">
                <label for="groupImage">Group Image URL</label>
                <input 
                  type="text" 
                  id="groupImage"
                  v-model="groupImageUrl" 
                  placeholder="Enter image URL" 
                  class="settings-input"
                >
              </div>
              <div v-if="groupImageUrl" class="image-preview">
                <img :src="groupImageUrl" @error="onImgError" alt="Group preview">
              </div>
            </div>
          </div>
          <div class="modal-actions">
            <button class="modal-button cancel" @click="closeModal">Cancel</button>
            <button class="modal-button confirm" @click="handleConfirmation">Confirm</button>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
import { useAppStore } from '../store/store';
export default {
  name: 'RoomSidebar',
  data() {
    return {
      placeholder: 'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png',
      appStore: useAppStore(),
      room: null,
      showModal: false,
      modalTitle: '',
      modalMessage: '',
      pendingAction: null,
      isAdmin: false,
      modalType: '',
      selectedUser: null,
      newMemberUsername: '',
      activeMenu: null,
      selectedNewMember: null,
      searchQuery: '',
      selectedUsers: [],
      groupName: '',
      groupImageUrl: ''
    }
  },
  computed: {
    availableUsers() {
      // Get all unique users from all rooms
      const allUsers = this.appStore.rooms.flatMap(room => room.users)
        .filter((user, index, self) =>
          index === self.findIndex(u => u._id === user._id)
        );
      
      // Filter out users already in this group
      return allUsers.filter(user => 
        !this.room.users.some(groupUser => groupUser._id === user._id)
      );
    },
    filteredUsers() {
      if (!this.searchQuery) return this.availableUsers;
      const query = this.searchQuery.toLowerCase();
      return this.availableUsers.filter(user => 
        user.username.toLowerCase().includes(query)
      );
    },
    showGroupSettingsModal() {
      this.modalTitle = 'Group Settings';
      this.modalMessage = 'Update group information:';
      this.modalType = 'groupSettings';
      this.pendingAction = 'updateGroupSettings';
      this.groupName = this.room.details.name;
      this.groupImageUrl = this.room.details.image_url || '';
      this.showModal = true;
    }
  },
  methods: {
    onImgError(e) {
      e.target.src = this.placeholder
    },
    handleClickOutside(event) {
      if (this.$refs.sidebarRef && !this.$refs.sidebarRef.contains(event.target)) {
        this.$emit('close');
      }
    },
    showBlockConfirmation() {
      this.modalTitle = 'Block User';
      this.modalMessage = `Are you sure you want to block ${this.room.details.name}? You will no longer receive messages from them.`;
      this.pendingAction = 'block';
      this.showModal = true;
    },
    showUnblockConfirmation() {
      this.modalTitle = 'Unblock User';
      this.modalMessage = `Are you sure you want to unblock ${this.room.details.name}? You will start receiving messages from them again.`;
      this.pendingAction = 'unblock';
      this.showModal = true;
    },
    showLeaveConfirmation() {
      this.modalTitle = 'Leave Group';
      this.modalMessage = 'Are you sure you want to leave this group? You will no longer have access to the group chat and will lose all messages.';
      this.pendingAction = 'leave';
      this.showModal = true;
    },
    showAddMemberModal() {
      this.modalTitle = 'Add Group Members';
      this.modalMessage = 'Search and select users to add to the group:';
      this.modalType = 'addMember';
      this.pendingAction = 'addMember';
      this.showModal = true;
      this.searchQuery = '';
      this.selectedUsers = [];
    },
    showMakeAdminConfirmation(user) {
      this.modalTitle = 'Make Admin';
      this.modalMessage = `Are you sure you want to make ${user.username} an admin?`;
      this.modalType = 'confirmation';
      this.pendingAction = 'makeAdmin';
      this.selectedUser = user;
      this.showModal = true;
    },
    showRemoveAdminConfirmation(user) {
      this.modalTitle = 'Remove Admin';
      this.modalMessage = `Are you sure you want to remove ${user.username}'s admin status?`;
      this.modalType = 'confirmation';
      this.pendingAction = 'removeAdmin';
      this.selectedUser = user;
      this.showModal = true;
    },
    showRemoveMemberConfirmation(user) {
      this.modalTitle = 'Remove Member';
      this.modalMessage = `Are you sure you want to remove ${user.username} from the group?`;
      this.modalType = 'confirmation';
      this.pendingAction = 'removeMember';
      this.selectedUser = user;
      this.showModal = true;
    },
    closeModal() {
      this.showModal = false;
      this.pendingAction = null;
      this.modalType = '';
      this.selectedUser = null;
      this.newMemberUsername = '';
      this.activeMenu = null;
      this.selectedNewMember = null;
      this.searchQuery = '';
      this.selectedUsers = [];
      this.groupName = '';
      this.groupImageUrl = '';
    },
    handleConfirmation() {
      switch (this.pendingAction) {
        case 'addMember':
          this.handleAddMember();
          break;
        case 'makeAdmin':
          this.handleMakeAdmin();
          break;
        case 'removeAdmin':
          this.handleRemoveAdmin();
          break;
        case 'removeMember':
          this.handleRemoveMember();
          break;
        case 'updateGroupSettings':
          this.handleUpdateGroupSettings();
          break;
        default:
          if (this.pendingAction === 'block') {
            this.handleBlockUser();
          } else if (this.pendingAction === 'leave') {
            this.handleLeaveGroup();
          } else if (this.pendingAction === 'unblock') {
            this.handleUnblockUser();
          }
      }
      this.closeModal();
    },
    handleBlockUser() {
      // TODO: Implement block user functionality
      fetch(`${this.appStore.apiUrl}/block_dm_user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          room_id: this.appStore.selectedRoomId,
          user_id: this.appStore.user._id,
          app_id: this.appStore.appId,
          block_user_id: this.appStore.selectedRoom.recipient._id
        })
      })
        .then(response => response.json())
        .then(res => {
          if (!res.status) console.error('error leaving group')
          else {
            this.appStore.getUserRooms(true)
            this.$emit('close')
          }
        })
    },
    handleLeaveGroup() {
      // TODO: Implement leave group functionality

      fetch(`${this.appStore.apiUrl}/leave_group`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          room_id: this.appStore.selectedRoomId,
          user_id: this.appStore.user._id,
          app_id: this.appStore.appId
        })
      })
        .then(response => response.json())
        .then(res => {
          if (!res.status) console.error('error leaving group')
          else {
            this.appStore.getUserRooms(true)
            this.$emit('close')
          }
        })
    },
    handleUnblockUser() {
      fetch(`${this.appStore.apiUrl}/unblock_dm_user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          room_id: this.appStore.selectedRoomId,
          user_id: this.appStore.user._id,
          app_id: this.appStore.appId,
          unblock_user_id: this.appStore.selectedRoom.recipient._id
        })
      })
        .then(response => response.json())
        .then(res => {
          if (!res.status) console.error('error unblocking user')
          else {
            this.appStore.getUserRooms(true)
            this.$emit('close')
          }
        })
    },
    handleAddMember() {
      if (this.selectedUsers.length === 0) return;
      
      // Add users sequentially
      const addUserPromises = this.selectedUsers.map(user => 
        fetch(`${this.appStore.apiUrl}/add_group_member`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            room_id: this.appStore.selectedRoomId,
            admin_id: this.appStore.user._id,
            app_id: this.appStore.appId,
            new_user_id: user._id
          })
        }).then(response => response.json())
      );

      Promise.all(addUserPromises)
        .then(results => {
          const hasError = results.some(res => !res.status);
          if (hasError) {
            console.error('error adding members');
          } else {
            this.appStore.getUserRooms(true);
            this.selectedUsers = [];
            this.closeModal();
          }
        })
        .catch(error => {
          console.error('Error adding members:', error);
        });
    },
    handleMakeAdmin() {
      fetch(`${this.appStore.apiUrl}/add_group_admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          room_id: this.appStore.selectedRoomId,
          user_id: this.appStore.user._id,
          app_id: this.appStore.appId,
          new_admin_id: this.selectedUser._id
        })
      })
        .then(response => response.json())
        .then(res => {
          if (!res.status) console.error('error making admin')
          else {
            this.appStore.getUserRooms(true)
          }
        })
    },
    handleRemoveAdmin() {
      fetch(`${this.appStore.apiUrl}/remove_group_admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          room_id: this.appStore.selectedRoomId,
          user_id: this.appStore.user._id,
          app_id: this.appStore.appId,
          target_admin_id: this.selectedUser._id
        })
      })
        .then(response => response.json())
        .then(res => {
          if (!res.status) console.error('error removing admin')
          else {
            this.appStore.getUserRooms(true)
          }
        })
    },
    handleRemoveMember() {
      fetch(`${this.appStore.apiUrl}/remove_group_member`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          room_id: this.appStore.selectedRoomId,
          admin_id: this.appStore.user._id,
          app_id: this.appStore.appId,
          remove_user_id: this.selectedUser._id
        })
      })
        .then(response => response.json())
        .then(res => {
          if (!res.status) {
            console.error('error removing member:', res.message);
          } else {
            this.appStore.getUserRooms(true);
            this.closeModal();
          }
        })
        .catch(error => {
          console.error('Error removing member:', error);
        });
    },
    handleUpdateGroupSettings() {
      fetch(`${this.appStore.apiUrl}/update_group_details`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          room_id: this.appStore.selectedRoomId,
          admin_id: this.appStore.user._id,
          app_id: this.appStore.appId,
          new_name: this.groupName,
          new_image_url: this.groupImageUrl
        })
      })
        .then(response => response.json())
        .then(res => {
          if (!res.status) {
            console.error('error updating group settings:', res.message);
          } else {
            this.appStore.getUserRooms(true);
            this.closeModal();
          }
        })
        .catch(error => {
          console.error('Error updating group settings:', error);
        });
    },
    toggleMemberMenu(userId) {
      this.activeMenu = this.activeMenu === userId ? null : userId;
    },
    toggleUserSelection(user) {
      const index = this.selectedUsers.findIndex(u => u._id === user._id);
      if (index === -1) {
        this.selectedUsers.push(user);
      } else {
        this.selectedUsers.splice(index, 1);
      }
    },
    isUserSelected(user) {
      return this.selectedUsers.some(u => u._id === user._id);
    }
  },
  mounted() {
    this.room = this.appStore.selectedRoom;
    this.isAdmin = this.room?.details?.admins?.includes(this.appStore.user._id);

    setTimeout(() => {
      document.addEventListener('click', this.handleClickOutside);
    }, 1000);
    
  },
  beforeUnmount() {
    document.removeEventListener('click', this.handleClickOutside);
  }
}
</script>

<style scoped>
.sidebar-content {
  background: var(--teemboom-bg-primary);
  width: 320px;
  max-width: 100%;
  height: 100vh;
  box-shadow: -2px 0 8px var(--teemboom-border-color);
  padding: 20px 16px;
  position: absolute;
  top: 0;
  right: 0;
  overflow-y: auto;
  z-index: 1000;
  font-size: 13px;
}

.close-btn {
  position: absolute;
  top: 12px;
  right: 16px;
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: var(--teemboom-text-secondary);
  transition: color 0.2s;
}

.close-btn:hover {
  color: var(--teemboom-text-primary);
}

.cP{
  color: var(--teemboom-text-primary);
  margin-top: 40px;
}

.dm_overlay {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80px 0 30px 0;
}

.dm_avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  margin: 10px auto;
  object-position: center;
  border: 3px solid var(--teemboom-border-color);
  transition: border-color 0.2s;
}

.dm_avatar:hover {
  border-color: var(--teemboom-text-primary);
}

.name {
  font-weight: 600;
  font-size: 16px;
  color: var(--teemboom-text-primary);
  margin-top: 12px;
}

.member-list {
  list-style: none;
  padding: 0;
  margin: 10px 0 20px 0;
  color: var(--teemboom-text-primary);
}

.member-list li {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  color: var(--teemboom-text-primary);
  padding: 8px 12px;
  border-radius: 8px;
  transition: all 0.2s;
  font-size: 13px;
}

.member-list li:hover {
  background-color: var(--teemboom-bg-secondary);
  transform: translateX(2px);
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--teemboom-border-color);
}

.action-button {
  padding: 8px 16px;
  border-radius: 6px;
  border: none;
  font-weight: 500;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.block-button {
  background-color: #ff4444;
  color: white;
  margin-top: 30px;
}

.block-button:hover {
  background-color: #ff2222;
  transform: translateY(-1px);
}

.leave-button {
  border: 1px solid #ff4444;
  background-color: var(--teemboom-bg-primary);
  color: #ff4444;
  width: 100%;
  margin-top: 20px;
}

.leave-button:hover {
  background-color: #ff2222;
  transform: translateY(-1px);
}

.unblock-button {
  background-color: #4CAF50;
  color: white;
  margin-top: 30px;
}

.unblock-button:hover {
  background-color: #45a049;
  transform: translateY(-1px);
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1100;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: var(--teemboom-bg-primary);
  padding: 20px;
  border-radius: 12px;
  width: 90%;
  max-width: 380px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.modal-content h3 {
  margin: 0 0 12px 0;
  color: var(--teemboom-text-primary);
  font-size: 16px;
  font-weight: 600;
}

.modal-content p {
  margin: 0 0 20px 0;
  color: var(--teemboom-text-secondary);
  line-height: 1.5;
  font-size: 13px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.modal-button {
  padding: 6px 14px;
  border-radius: 6px;
  border: none;
  font-weight: 500;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.modal-button.cancel {
  background-color: var(--teemboom-bg-secondary);
  color: var(--teemboom-text-primary);
}

.modal-button.confirm {
  background-color: #ff4444;
  color: white;
}

.modal-button:hover {
  transform: translateY(-1px);
  opacity: 0.9;
}

.admin-badge {
  background-color: #4CAF50;
  color: white;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 11px;
  margin-left: 6px;
  font-weight: 500;
}

.admin-controls {
  margin: 16px 0;
}

.add-member {
  border: 1px solid #4CAF50;
  background-color: var(--teemboom-bg-primary);
  color: #4CAF50;
  width: 100%;
  margin-top: 30px;
}

.add-member:hover {
  background-color: #45a049;
  color: #fff;
  transform: translateY(-1px);
}

.group-settings {
  border: 1px solid #4c77af;
  background-color: var(--teemboom-bg-primary);
  color: #4c77af;
  width: 100%;
  margin-top: 10px;
}

.group-settings:hover {
  background-color: #4c77af;
  color: #fff;
  transform: translateY(-1px);
}

.member-actions {
  position: relative;
  margin-left: auto;
}

.menu-trigger {
  border: none;
  background: none;
  color: var(--teemboom-text-secondary);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;
}

.menu-trigger:hover {
  background-color: var(--teemboom-bg-secondary);
  color: var(--teemboom-text-primary);
}

.menu-trigger svg {
  fill: currentColor;
  stroke: currentColor;
  width: 14px;
  height: 14px;
}

.member-menu {
  position: absolute;
  right: 0;
  top: 100%;
  background: var(--teemboom-bg-primary);
  border: 1px solid var(--teemboom-border-color);
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  min-width: 160px;
  z-index: 1000;
  margin-top: 4px;
  animation: menuFadeIn 0.2s ease;
}

@keyframes menuFadeIn {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 12px;
  border: none;
  background: none;
  color: var(--teemboom-text-primary);
  cursor: pointer;
  text-align: left;
  font-size: 13px;
  transition: all 0.2s;
}

.menu-item:hover {
  background-color: var(--teemboom-bg-secondary);
  transform: translateX(2px);
}

.menu-icon {
  font-size: 14px;
  width: 18px;
  text-align: center;
}

.search-container {
  margin-bottom: 12px;
}

.search-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--teemboom-border-color);
  border-radius: 6px;
  background: var(--teemboom-bg-primary);
  color: var(--teemboom-text-primary);
  font-size: 13px;
  transition: all 0.2s;
}

.search-input:focus {
  border-color: var(--teemboom-text-primary);
  outline: none;
  box-shadow: 0 0 0 2px rgba(var(--teemboom-text-primary-rgb), 0.1);
}

.users-list {
  max-height: 280px;
  overflow-y: auto;
  border: 1px solid var(--teemboom-border-color);
  border-radius: 6px;
  margin-bottom: 12px;
  scrollbar-width: thin;
  scrollbar-color: var(--teemboom-border-color) transparent;
}

.users-list::-webkit-scrollbar {
  width: 6px;
}

.users-list::-webkit-scrollbar-track {
  background: transparent;
}

.users-list::-webkit-scrollbar-thumb {
  background-color: var(--teemboom-border-color);
  border-radius: 3px;
}

.user-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  cursor: pointer;
  transition: all 0.2s;
  border-bottom: 1px solid var(--teemboom-border-color);
}

.user-item:last-child {
  border-bottom: none;
}

.user-item:hover {
  background-color: var(--teemboom-bg-secondary);
  transform: translateX(2px);
}

.user-item.selected {
  background-color: var(--teemboom-bg-secondary);
}

.user-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  margin-right: 10px;
  border: 2px solid var(--teemboom-border-color);
}

.username {
  flex: 1;
  color: var(--teemboom-text-primary);
  font-size: 13px;
}

.selection-indicator {
  color: #4CAF50;
  font-weight: bold;
  font-size: 14px;
}

.selected-users {
  padding: 8px 12px;
  background-color: var(--teemboom-bg-secondary);
  border-radius: 6px;
  margin-top: 8px;
}

.selected-count {
  color: var(--teemboom-text-primary);
  font-size: 12px;
  font-weight: 500;
}

@media (max-width: 768px) {
  .sidebar-content {
    width: 100vw;
    max-width: 100vw;
    border-radius: 0;
    padding-top: 40px;
  }
}

.sidebar-slide-enter-active,
.sidebar-slide-leave-active {
  transition: all 0.3s cubic-bezier(.4, 0, .2, 1);
}

.sidebar-slide-enter-from,
.sidebar-slide-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

.settings-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  color: var(--teemboom-text-primary);
  font-size: 13px;
  font-weight: 500;
}

.settings-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--teemboom-border-color);
  border-radius: 6px;
  background: var(--teemboom-bg-primary);
  color: var(--teemboom-text-primary);
  font-size: 13px;
  transition: all 0.2s;
}

.settings-input:focus {
  border-color: var(--teemboom-text-primary);
  outline: none;
  box-shadow: 0 0 0 2px rgba(var(--teemboom-text-primary-rgb), 0.1);
}

.image-preview {
  margin-top: 8px;
  text-align: center;
}

.image-preview img {
  max-width: 120px;
  aspect-ratio: 1/1;
  border-radius: 50%;
  border: 2px solid var(--teemboom-border-color);
  object-fit: cover;
}
</style>