<template>
    <div class="chat-layout">
        <div class="chat-container" :class="{ 'mobile-view': isMobileView }">
            <!-- if it is not a mobile view, it will always show the sidebar and if it is a mobile view, 
                it will show the sidebar only if there is no selected chat -->
            <ChatSidebar v-if="!isMobileView || appStore.selectedRoomId" />
            <!-- if it is a mobile view, it will show the chat window only if there is a selected chat -->
            <ChatWindow v-if="appStore.selectedRoomId" @back="handleBack" :is-mobile="isMobileView" />
        </div>
    </div>
</template>

<script>
import ChatSidebar from './ChatSidebar.vue'
import ChatWindow from './ChatWindow.vue'
import { useAppStore } from '../store/store'

export default {
    name: 'ChatLayout',
    components: {
        ChatSidebar,
        ChatWindow
    },
    data() {
        return {
            appStore: useAppStore(),
            isMobileView: window.innerWidth <= 768,
        }
    },
    computed: {
        selectedChat() {
            return this.chats.find(chat => chat._id === this.selectedChatId)
        }
    },
    methods: {
        loadChats() {
        },
        handleChatSelect(chatId) {
            this.selectedChatId = chatId
        },
        handleBack() {
            this.selectedChatId = null
        },
        handleResize() {
            this.isMobileView = window.innerWidth <= 768
        }
    },
    mounted() {
    },
    beforeUnmount() {
        window.removeEventListener('resize', this.handleResize)
    }
}
</script>

<style scoped>
.chat-layout {
    height: 100vh;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #f5f5f5;
}

.chat-container {
    width: 100%;
    height: 100%;
    display: flex;
    background-color: white;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

@media (max-width: 768px) {
    .chat-container {
        max-width: 100%;
    }

    .mobile-view {
        position: relative;
    }
}
</style>