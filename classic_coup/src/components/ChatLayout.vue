<template>
    <div class="chat-layout">
        <div class="chat-container" :class="{ 'mobile-view': appStore.isMobileView }">
            <!-- if it is not a mobile view, it will always show the sidebar and if it is a mobile view, 
                it will show the sidebar only if there is no selected chat -->
            <ChatSidebar v-if="!appStore.isMobileView || !appStore.selectedRoomId" />
            <!-- if it is a mobile view, it will show the chat window only if there is a selected chat -->
            <ChatWindow v-if="appStore.selectedRoomId" @back="handleBack" :is-mobile="appStore.isMobileView" />
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
        }
    },
    methods: {
        loadChats() {
        },
        handleChatSelect(chatId) {
            this.selectedChatId = chatId
        },
        handleBack() {
            this.appStore.selectedRoomId = null
        }
    }
}
</script>

<style scoped>
.chat-layout {
    height: 100vh;
    max-height: 100%;
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

.mobile-view {
    position: relative;
}
</style>