<template>
  <transition name="sidebar-slide">
    <div class="sidebar-content" ref="sidebarRef">
      <button class="close-btn" @click="$emit('close')">×</button>
      <div class="dm_overlay" v-if="room?.type === 'dm'">
        <img :src="room.details.image_url || placeholder" class="dm_avatar" @error="onImgError">
        <div>
          <div class="name">{{ room.details.name }}</div>
        </div>
      </div>
      <div v-else-if="room?.type === 'group'">
        <h2>Group Members</h2>
        <ul class="member-list">
          <li v-for="user in room.users" :key="user._id">
            <img :src="user.profile_pic || placeholder" class="avatar" @error="onImgError">
            <span>{{ user.username }}</span>
          </li>
        </ul>
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
    }
  },
  mounted() {
    this.room = this.appStore.selectedRoom;

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
  background: #fff;
  width: 350px;
  max-width: 100vw;
  height: 100vh;
  box-shadow: -2px 0 8px rgba(0,0,0,0.1);
  padding: 24px 16px 16px 16px;
  position: fixed;
  top: 0;
  right: 0;
  overflow-y: auto;
  z-index: 1000;
}
.close-btn {
  position: absolute;
  top: 12px;
  right: 16px;
  background: none;
  border: none;
  font-size: 28px;
  cursor: pointer;
}
.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
}
.dm_overlay{
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 100px 0 40px 0;
}
.dm_avatar{
  width: 200px;
  height: 200px;
  border-radius: 50%;
  margin: 15px auto;
  object-position: center;
}
.avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
}
.name {
  font-weight: bold;
  font-size: 18px;
}
.status {
  color: #888;
  font-size: 14px;
}
.member-list {
  list-style: none;
  padding: 0;
  margin: 40px 0 30px 0;
}
.member-list li {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}
@media (max-width: 768px) {
  .sidebar-content {
    width: 100vw;
    max-width: 100vw;
    border-radius: 0;
    padding-top: 40px;
  }
}
.sidebar-slide-enter-active, .sidebar-slide-leave-active {
  transition: all 0.3s cubic-bezier(.4,0,.2,1);
}
.sidebar-slide-enter-from, .sidebar-slide-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
</style> 