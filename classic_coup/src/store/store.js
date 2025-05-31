import { defineStore } from 'pinia'
import { io } from 'socket.io-client'
import { scrollToBottom } from '../utils/helpers'

export const useAppStore = defineStore('appStore', {
  // State
  state: () => ({
    appId: null,
    apiUrl: null,
    user: null,
    recipient: null,
    appConfig: null,
    selectedRoom: null,
    selectedRoomId: null,
    rooms: [],
    isMobile: null,
    messages: [],
    socket: null,
    messagesContainerRef: null
  }),

  actions: {
    appInit() {
      const config = window.teemboomChatConfig
      this.appId = config.appId
      this.apiUrl = config.apiUrl
      this.user = config.user
      this.recipient = config.recipient
      this.socket = io(config.socketUrl)
      this.loadConfig()
      return true
    },
    async loadConfig() {
      fetch(`${this.apiUrl}/teemboom_config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          app_id: this.appId,
          domain_name: `${window.location.protocol}//${window.location.host}`
        })
      })
        .then(res => { return res.json() })
        .then(res => {
          if (res.status) this.appConfig = res.data
          else console.error('Application not initialized. Check your appId and make sure this domain is allowed')
        })
    },
    async initializeUsers() {
      await fetch(`${this.apiUrl}/init_users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          app_id: this.appId,
          user: this.user,
          recipient: this.recipient
        })
      })
        .then(res => { return res.json() })
        .then(res => {
          if (res.status) {
            this.user = res.user
            this.recipient = res.recipient
          }
        })
    },
    async getUserRooms() {
      await fetch(`${this.apiUrl}/get_user_rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: this.user._id,
          app_id: this.appId
        })
      })
        .then(response => response.json())
        .then(res => {
          if (!res.status) console.error('error loading rooms')
          // Transform the data to show other user's name as title
          this.rooms = res.data.map(room => {
            // Find the recipient in this room: the user who is not the current user
            const recipient = room.users.find(user => user._id !== this.user._id)
            return {
              _id: room._id,
              title: recipient?.username || 'Unknown User',
              recipient: recipient || null,
              users: room.users,
              unread_count: room.unread_count || 0,
              recentMessage: room.recent_message || null,
              createdAt: room.created,
              updatedAt: room.updated
            }
          })

          // If a recipient is not defined, simply enter the user into the most recently updated room of theirs.
          if (!this.recipient) {
            if (this.rooms.length > 0) {
              this.selectedRoom = this.rooms[0]
              this.selectedRoomId = this.rooms[0]._id
            }
          }else{
            this.findRecipientRoom()
          }
        })
    },
    async findRecipientRoom() {
      // This function should only run if we need to create a room with a recipient
      if (!this.recipient) return
      // If the room is found locally in the already fetched rooms, use it
      const existingRoom = this.rooms.find(room => room.recipient._id === this.recipient._id)
      if (existingRoom){
        this.selectedRoom = existingRoom
        this.selectedRoomId = existingRoom._id
      }else{ // If not found locally, meaning this is their first time meeting, create a new room (rare)
        console.log("new_room")
        await fetch(`${this.apiUrl}/create_room`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            user_id: this.user._id,
            recipient_id: this.recipient._id,
            app_id: this.appId
          })
        })
        .then(res => {return res.json()})
        .then(res=>{
          if (res.status) this.getUserRooms()
        })
      }
    },
    async loadUserRooms() {
      await this.initializeUsers()
      await this.getUserRooms()
      this.setupSocket()
    },
    updateRoom(room_id) {
      if (room_id === this.selectedRoomId) return
      this.selectedRoomId = room_id
      this.selectedRoom = this.rooms.find(room => room._id === room_id)
      // Mark room as read when selected
      this.markRoomAsRead(room_id)
    },
    updateRoomRecentMessage(message){
      this.rooms = this.rooms.map(room => {
        if (room._id === message.room_id) {
          return { ...room,  recentMessage: message}
        }
        return room
      })
    },
    setMessagesContainerRef(ref) {
      this.messagesContainerRef = ref;
    },
    async scrollToBottom() {
      await scrollToBottom(this.messagesContainerRef);
    },
    addMessageToRoom(msg) {
      if (this.selectedRoomId === msg.room_id) {
        this.messages.push(msg);
        this.updateRoomRecentMessage(msg);
        this.scrollToBottom();
        this.updateUserLastSeenInRoom(msg.room_id)
      } else {
        this.updateRoomRecentMessage(msg);
        // Increment unread count for other rooms
        this.incrementUnreadCount(msg.room_id);
      }
    },
    editMessage(msg, recipient_id){
      fetch(`${this.apiUrl}/edit_message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: this.user._id,
          app_id: this.appId,
          message_id: msg._id,
          content: msg.content
        })
      })
      .then(res => {return res.json()})
      .then(res=>{
        this.socket.emit('edit_message', {room_id: recipient_id, data: res.data })
        this.updateMessageContent(res.data.message_id, res.data.content)
      })
    },
    updateMessageContent(message_id, content){
      this.messages = this.messages.map(message => {
        if (message._id === message_id){
          return { ...message, content: content}
        }
        return message
      })
    },
    updateEntireMessage(message){
      this.messages = this.messages.map(msg => {
        if (msg._id === message._id){
          return message
        }
        return msg
      })
    },

    deleteMessage(msg, deleteForEveryone, recipient_id){
      fetch(`${this.apiUrl}/delete_message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: this.user._id,
          message_id: msg._id,
          delete_for_all: deleteForEveryone
        })
      })
      .then(res => {return res.json()})
      .then(res=>{
        this.updateEntireMessage(res.data)
        if (deleteForEveryone) this.socket.emit('delete_message', {room_id: recipient_id, data: res.data })
      })
    },
    incrementUnreadCount(roomId) {
      this.rooms = this.rooms.map(room => {
        if (room._id === roomId) {
          return { ...room, unread_count: (room.unread_count || 0) + 1 }
        }
        return room
      })
    },
    markRoomAsRead(roomId) {
      this.rooms = this.rooms.map(room => {
        if (room._id === roomId) {
          return { ...room, unread_count: 0 }
        }
        return room
      })
      this.updateUserLastSeenInRoom(roomId)
    },
    updateUserLastSeenInRoom(room_id){
      fetch(`${this.apiUrl}/update_last_seen`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: this.user._id,
          room_id: room_id,
          app_id: this.appId
        })
      })
    },
    setupSocket(){
      // this.socket.on('joined', (msg)=>{
      //   console.log(msg)
      // })
      this.socket.emit('join_room', this.user._id)
      this.socket.on('receive_message', (msg)=>{
        this.addMessageToRoom(msg)
      })
      this.socket.on('edit_message', (msg)=>{
        this.updateMessageContent(msg.message_id, msg.content)
      })
      this.socket.on('delete_message', (msg)=>{
        console.log(msg)
        this.updateEntireMessage(msg)
      })
    },
    socketSendMessage(room_id, message){
      this.socket.emit('send_message', {room_id, message})
    }
  },
})
