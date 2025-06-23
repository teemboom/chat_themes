<template>
  <div class="chat-window" :class="{ 'chat-window-mobile': appStore.isMobileView }">
    <!-- Placeholder when no room is selected -->
    <div v-if="!appStore.selectedRoom && !appStore.selectedRoomId" class="chat-placeholder">
      <img src="https://studio.uxpincdn.com/studio/wp-content/uploads/2023/04/Chat-User-Interface-Design.png.webp" alt="Welcome" class="placeholder-img" />
      <h2>Welcome to Chat</h2>
      <p>Select a chat to start messaging.</p>
    </div>
    <!-- Actual chat UI -->
    <template v-else>
      <div class="chat-header">
        
        <div class="chat-title" @click="sidebarOpen = true" style="cursor:pointer;">
          <img class="avatar" :src="appStore.selectedRoom.details.image_url || (appStore.selectedRoom.details.type === 'group' ? 'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png' : 'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png')" @error="handleImageError">
          <div class="chat-title-text">
            <span>{{ appStore.selectedRoom.details.name }}</span>
            <span v-if="showTitleDetails" class="chat-title-text-status">Click For Details</span>
          </div>
        </div>
        <button v-if="isMobile" class="back-button" @click="$emit('back')">
          ←
        </button>
      </div>

      <div class="messages-container" ref="messagesContainer">
        <template v-if="isLoading">
          <div class="loading-bubble" v-for="n in 7" :key="n">
            <div class="loading-avatar"></div>
            <div class="loading-content">
              <div class="loading-line"></div>
              <div class="loading-line"></div>
            </div>
          </div>
        </template>
        <MessageBubble v-else v-for="(message, index) in appStore.messages" :previous-message="appStore.messages[index - 1]" :key="message.id" :message="message" @reply="setReplyMessage" />
      </div>

      <MessageInput @send-message="handleSendMessage" :reply="replyTo" @cancel-reply="replyTo=null" />

      <RoomSidebar
        v-if="sidebarOpen"
        @close="sidebarOpen = false"
      />
    </template>
  </div>
</template>

<script>
import { useAppStore } from '../store/store'
import MessageBubble from './MessageBubble.vue'
import MessageInput from './MessageInput.vue'
import RoomSidebar from './RoomSidebar.vue'
import { addBackButtonHandler } from '../utils/helpers'
export default {
  name: 'ChatWindow',
  components: {
    MessageBubble,
    MessageInput,
    RoomSidebar
  },
  props: {
    isMobile: {
      type: Boolean,
      default: false
    }
  },
  emits: ['back'],
  data() {
    return {
      appStore: useAppStore(),
      replyTo: null,
      isLoading: true,
      sidebarOpen: false,
      showTitleDetails: true,
    }
  },
  computed: {
    sidebarRoom() {
      // For DM, show recipient info; for group, show group details
      if (!this.appStore.selectedRoom) return {}
      if (this.appStore.selectedRoom.type === 'dm') {
        // Use recipient info for DM
        return {
          ...this.appStore.selectedRoom.details,
          type: 'dm',
          status: this.appStore.selectedRoom.recipient?.status || '',
        }
      } else {
        // Use group details for group
        return {
          ...this.appStore.selectedRoom.details,
          type: 'group',
        }
      }
    },
    sidebarMembers() {
      // For group, show users; for DM, empty
      if (this.appStore.selectedRoom?.type === 'group') {
        return this.appStore.selectedRoom.users || []
      }
      return []
    }
  },
  methods: {
    loadMessages() {
      if (!this.appStore.selectedRoomId) return
      this.isLoading = null
      setTimeout(() => {
        if (this.isLoading === null) this.isLoading = true
      }, 500);
      this.appStore.messages = []
      fetch(`${this.appStore.apiUrl}/get_room_messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          room_id: this.appStore.selectedRoomId,
          app_id: this.appStore.appId,
          user_id: this.appStore.user._id
        })
      })
        .then(response => response.json())
        .then(res => {
          this.appStore.messages = res.data
          this.isLoading = false
          this.scrollToBottom()
        })
    },
    async scrollToBottom() {
      await this.$nextTick()
      if (this.$refs.messagesContainer) {
        this.$refs.messagesContainer.scrollTop = this.$refs.messagesContainer.scrollHeight
      }
    },
    handleSendMessage(content, attachments) {
      // We save this in the variable so even if the state changes while this function is running it won't affect the end result
      const transmit = this.appStore.selectedRoom.transmit
      fetch(`${this.appStore.apiUrl}/new_message`, {
			'headers': { 'Content-type': 'application/json' },
			'method': 'POST',
			'body': JSON.stringify({
				'app_id': this.appStore.appId,
				'room_id': this.appStore.selectedRoomId,
				'user_id': this.appStore.user._id,
				'content': content,
				'reply_to': this.replyTo?._id || null,
        'attachments': attachments
			})
		})
			.then(res => { return res.json() })
			.then(res => {
				if (!res.status) {
					return
				}
        this.appStore.addMessageToRoom(res.data)
        this.appStore.socketSendMessage(transmit, res.data)
			})
    },
    setReplyMessage(message){
      this.replyTo = message
    },
    handleImageError(e) {
      e.target.src = this.appStore.selectedRoom.details.type === 'group' ? '/group-placeholder.png' : '/person-placeholder.png'
    }
  },
  watch:{
    'appStore.selectedRoom'(newVal){
      this.replyTo = null
      this.loadMessages()
      this.showTitleDetails = true
      setTimeout(() => {
        this.showTitleDetails = false
      }, 3000);
    }
  },
  mounted() {
    this.loadMessages()
    this.appStore.setMessagesContainerRef(this.$refs.messagesContainer)
    if (this.appStore.isMobileView) addBackButtonHandler(()=>{this.$emit('back')})
    setTimeout(() => {
      this.showTitleDetails = false
    }, 3000);
  },
  beforeUnmount() {
    this.appStore.setMessagesContainerRef(null)
  }
}
</script>

<style scoped>
.chat-window {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: 100vh;
}

.chat-header {
  padding: 16px;
  border-bottom: 1px solid var(--teemboom-border-color);
  display: flex;
  justify-content: space-between;
  background-color: var(--teemboom-bg-primary);
}

.back-button {
  background: none;
  border: none;
  font-size: 16px;
  color: var(--teemboom-primary-color);
  cursor: pointer;
  padding: 8px;
  margin-right: 8px;
  display: flex;
  align-items: center;
}

.chat-title {
  display: flex;
  align-items: center;
  font-weight: 500;
  color: var(--teemboom-text-primary);
}

.avatar {
  margin-right: 8px;
  font-size: 20px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  padding-bottom: 100px;
  background-color: var(--teemboom-bg-secondary);
}

/* Custom scrollbar styling */
.messages-container::-webkit-scrollbar {
  width: 8px;
}

.messages-container::-webkit-scrollbar-track {
  background: var(--teemboom-bg-secondary);
  border-radius: 4px;
}

.messages-container::-webkit-scrollbar-thumb {
  background: var(--teemboom-bg-tertiary);
  border-radius: 4px;
  transition: background 0.2s ease;
}

.messages-container::-webkit-scrollbar-thumb:hover {
  background: var(--teemboom-primary-color);
}

/* Firefox scrollbar styling */
.messages-container {
  scrollbar-width: thin;
  scrollbar-color: var(--teemboom-bg-tertiary) var(--teemboom-bg-secondary);
}

.loading-bubble {
  display: flex;
  margin-bottom: 12px;
  animation: fadeIn 0.3s ease-in;
}

.chat-title-text {
  display: flex;
  flex-direction: column;
}

.chat-title-text-status {
  font-size: 10px;
  color: var(--teemboom-text-secondary);
  margin-top: 2px;
}

.loading-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--teemboom-bg-tertiary);
  margin-right: 12px;
  animation: pulse 1.5s infinite;
}

.loading-bubble:nth-of-type(even){
  flex-direction: row-reverse;
  justify-content: end;
}
.loading-bubble:nth-of-type(even) .loading-avatar{
  margin-left: 12px;
  margin-right: 0px;
}

.loading-content {
  flex: 1;
  width: 50%;
  max-width: 400px;
}

.loading-line {
  height: 12px;
  background: var(--teemboom-bg-tertiary);
  border-radius: 6px;
  margin-bottom: 8px;
  animation: pulse 1.5s infinite;
}

.loading-line:last-child {
  height: 50px;
}

@keyframes pulse {
  0% {
    opacity: 0.6;
  }
  50% {
    opacity: 0.8;
  }
  100% {
    opacity: 0.6;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.chat-window-mobile {
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: var(--teemboom-bg-primary);
}

.chat-placeholder {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--teemboom-text-secondary);
  background: var(--teemboom-bg-secondary);
  text-align: center;
}
.placeholder-img {
  width: 250px;
  margin-bottom: 32px;
  opacity: 0.8;
}
</style>