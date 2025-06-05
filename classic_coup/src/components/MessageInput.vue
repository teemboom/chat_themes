<template>
  <div class="message-input-container">
    <LinkPreview v-for="(item, index) in detectedUrls" :key="item" :url="item" layout="w" @success="attachPreview" />
    <div v-if="reply" class="reply-preview">
      <div class="reply-content">
        <span class="reply-text">{{ reply.content }}</span>
      </div>
      <button class="cancel-reply" @click="$emit('cancel-reply')">×</button>
    </div>
    <div class="input-wrapper">
      <div class="emoji-picker">
        <button @click="toggleEmojiPicker"><svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M9 16C9.85038 16.6303 10.8846 17 12 17C13.1154 17 14.1496 16.6303 15 16" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round"></path> <path d="M16 10.5C16 11.3284 15.5523 12 15 12C14.4477 12 14 11.3284 14 10.5C14 9.67157 14.4477 9 15 9C15.5523 9 16 9.67157 16 10.5Z" fill="#1C274C"></path> <ellipse cx="9" cy="10.5" rx="1" ry="1.5" fill="#1C274C"></ellipse> <path d="M7 3.33782C8.47087 2.48697 10.1786 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 10.1786 2.48697 8.47087 3.33782 7" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round"></path> </g></svg></button>
        <div v-if="showEmojiPicker" class="emoji-picker-container">
          <EmojiPicker :native="true" @select="onSelectEmoji" :disable-skin-tones="true" :display-recent="true" />
        </div>
      </div>
      <textarea
        v-model="message"
        @keydown.enter.prevent="handleEnter"
        placeholder="Type a message..."
        rows="1"
        ref="textarea"
        @input="autoResize"
      ></textarea>
      <button
        class="send-button"
        @click="sendMessage"
        :disabled="!message.trim()"
      >
      <svg viewBox="0 0 32 32" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:sketch="http://www.bohemiancoding.com/sketch/ns" fill="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><desc>Created with Sketch Beta.</desc> <defs> </defs> <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd" sketch:type="MSPage"> <g id="Icon-Set-Filled" sketch:type="MSLayerGroup" transform="translate(-570.000000, -257.000000)" fill="#000000"> <path d="M580.407,278.75 C581.743,281.205 586,289 586,289 C586,289 601.75,258.5 602,258 L602.02,257.91 L580.407,278.75 L580.407,278.75 Z M570,272 C570,272 577.298,276.381 579.345,277.597 L601,257 C598.536,258.194 570,272 570,272 L570,272 Z" id="send-email" sketch:type="MSShapeGroup"> </path> </g> </g> </g></svg>
      </button>
    </div>
  </div>
</template>

<script>
// These are the tools we need to make our chat work
import EmojiPicker from 'vue3-emoji-picker'  // This helps us add fun emoji faces to our messages
import 'vue3-emoji-picker/css'  // This makes the emoji picker look pretty
import { detectUrls } from '../utils/helpers'  // This helps us find website links in our messages
import LinkPreview from './LinkPreview.vue'  // This shows a preview of websites we share

export default {
  name: 'MessageInput',  // This is the name of our chat box component
  emits: ['send-message', 'cancel-reply'],  // These are the special messages our component can send to its parent
  props: {
    reply: Object  // This lets us know if we're replying to someone else's message
  },
  components: {
    EmojiPicker,  // We're using the emoji picker tool
    LinkPreview   // We're using the link preview tool
  },
  data() {
    return {
      message: '',  // This is where we store what the user types
      previews: [],  // This keeps track of website previews
      showEmojiPicker: false,  // This tells us if we should show the emoji picker
      detectedUrls: [],  // This keeps track of website links we find
      detectUrlTimeout: null  // This helps us wait before checking for website links
    }
  },
  mounted() {
    // When our chat box appears, we start listening for clicks outside of it
    document.addEventListener('click', this.handleClickOutside)
  },
  beforeUnmount() {
    // When our chat box disappears, we stop listening for clicks
    document.removeEventListener('click', this.handleClickOutside)
  },
  methods: {
    autoResize() {
      // This makes our typing box grow bigger as we type more
      const textareaEl = this.$refs.textarea
      textareaEl.style.height = 'auto'
      textareaEl.style.height = textareaEl.scrollHeight + 'px'

      // We wait a little bit before checking for website links
      if (this.detectUrlTimeout){
        clearInterval(this.detectUrlTimeout)
      }
      this.detectUrlTimeout = setTimeout(() => {
        this.detectedUrls = detectUrls(this.message)
      }, 4000);
    },
    
    handleEnter(event) {
      // When we press Enter, we send the message (unless we're holding Shift)
      if (!event.shiftKey) {
        this.sendMessage()
      }
    },
    attachPreview(data){
      // This adds a preview of a website we shared
      data.type = 'preview'
      const find = this.previews.find(item => item.url === data.url)
      if (!find) this.previews.push(data)
    },
    sendMessage() {
      // This sends our message when we click the send button
      const trimmedMessage = this.message.trim()
      // We make sure we only keep previews for links that are still in our message
      this.previews = this.previews.filter(item => this.detectedUrls.includes(item.url))
      const attachments = [...this.previews]
      if (trimmedMessage) {
        // We send the message and any website previews to our parent
        this.$emit('send-message', trimmedMessage, attachments)
        // We clear everything and start fresh
        this.message = ''
        this.detectedUrls = []
        if (this.$refs.textarea) {
          this.$refs.textarea.style.height = 'auto'
        }
        this.$emit('cancel-reply')
      }
    },
    toggleEmojiPicker() {
      // This shows or hides the emoji picker
      this.showEmojiPicker = !this.showEmojiPicker
    },
    onSelectEmoji(emoji) {
      // This adds the emoji we picked to our message
      this.message += emoji.i
    },
    handleClickOutside(event) {
      // This closes the emoji picker when we click somewhere else
      const emojiPicker = this.$el.querySelector('.emoji-picker')
      if (this.showEmojiPicker && emojiPicker && !emojiPicker.contains(event.target)) {
        this.showEmojiPicker = false
      }
    }
  }
}
</script>

<style scoped>
.message-input-container {
  padding: 16px;
  background-color: white;
  border-top: 1px solid #e0e0e0;
}

@media (max-width: 768px) {
  .message-input-container {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 1000;
    padding: 12px;
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  }
}

.reply-preview {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background-color: #f5f5f5;
  border-radius: 3px;
  border-left: 4px #333 solid;
  margin-bottom: 8px;
}

.reply-content {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.reply-label {
  color: #666;
  font-size: 12px;
  font-weight: 500;
}

.reply-text {
  color: #333;
  font-size: 13px;
  word-break: break-all;
}

.cancel-reply {
  background: none;
  border: none;
  color: #666;
  font-size: 18px;
  cursor: pointer;
  padding: 0 4px;
  line-height: 1;
}

.cancel-reply:hover {
  color: #333;
}

.input-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.emoji-picker {
  position: relative;
  width: 30px;
  height: 30px;
}

.emoji-picker button {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.emoji-picker button svg {
  width: 24px;
  height: 24px;
}

.emoji-picker-container {
  position: absolute;
  bottom: 100%;
  left: 0;
  margin-bottom: 8px;
  z-index: 1000;
}

textarea {
  flex: 1;
  padding: 12px;
  /* border: 1px solid #e0e0e0; */
  border: none;
  border-radius: 20px;
  resize: none;
  outline: none;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.4;
  max-height: 120px;
  overflow-y: auto;
}

textarea:focus {
  border-color: #2196f3;
}

.send-button {
  padding: 8px 16px;
  color: white;
  border: none;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}
.send-button svg{
  width: 25px;
  height: 25px;
}

.send-button:hover:not(:disabled) {
  background-color: #1976d2;
}

.send-button:disabled {
  cursor: not-allowed;
}
</style> 