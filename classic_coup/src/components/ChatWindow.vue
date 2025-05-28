<template>
  <div class="chat-window">
    <div class="chat-header">
      <button v-if="isMobile" class="back-button" @click="$emit('back')">
        ← Back
      </button>
      <div class="chat-title">
        <img class="avatar" :src=appStore.selectedRoom.recipient.profile_pic>
        <span>{{ appStore.selectedRoom.title }}</span>
      </div>
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
      <MessageBubble v-else v-for="message in appStore.messages" :key="message.id" :message="message" @reply="setReplyMessage" />
    </div>

    <MessageInput @send-message="handleSendMessage" :reply="replyTo" @cancel-reply="replyTo=null" />
  </div>
</template>

<script>
import { useAppStore } from '../store/store'
import MessageBubble from './MessageBubble.vue'
import MessageInput from './MessageInput.vue'

export default {
  name: 'ChatWindow',
  components: {
    MessageBubble,
    MessageInput
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
      isLoading: true
    }
  },
  methods: {
    loadMessages() {
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
          app_id: this.appStore.appId
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
    handleSendMessage(content) {
      // We save this in the variable so even if the state changes while this function is running it won't affect the end result
      const recipient = this.appStore.selectedRoom.recipient
      fetch(`${this.appStore.apiUrl}/new_message`, {
			'headers': { 'Content-type': 'application/json' },
			'method': 'POST',
			'body': JSON.stringify({
				'app_id': this.appStore.appId,
				'room_id': this.appStore.selectedRoomId,
				'user_id': this.appStore.user._id,
				'content': content,
				'reply_to': this.replyTo?._id || null
			})
		})
			.then(res => { return res.json() })
			.then(res => {
				if (!res.status) {
					return
				}
        this.appStore.addMessageToRoom(res.data)
        this.appStore.socketSendMessage(recipient._id, res.data)
			})
    },
    setReplyMessage(message){
      this.replyTo = message
    }
    
  },
  watch:{
    'appStore.selectedRoom'(newVal){
      this.replyTo = null
      this.loadMessages()
    }
  },
  mounted() {
    this.loadMessages()
    this.appStore.setMessagesContainerRef(this.$refs.messagesContainer)
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
}

.chat-header {
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  background-color: white;
}

.back-button {
  background: none;
  border: none;
  font-size: 16px;
  color: #2196f3;
  cursor: pointer;
  padding: 8px;
  margin-right: 8px;
}

.chat-title {
  display: flex;
  align-items: center;
  font-weight: 500;
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
  background-color: #f5f5f5;
}

.loading-bubble {
  display: flex;
  margin-bottom: 12px;
  animation: fadeIn 0.3s ease-in;
}


.loading-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #e0e0e0;
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
  background: #e0e0e0;
  border-radius: 6px;
  margin-bottom: 8px;
  animation: pulse 1.5s infinite;
}

.loading-line:first-child {
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

@media (max-width: 768px) {
  .chat-window {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: white;
  }
}
</style>