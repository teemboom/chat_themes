import { defineStore } from 'pinia'
import { scrollToBottom } from '../utils/helpers'

export const useAppStore = defineStore('appStore', {
  // State
  state: () => ({
    authenticated: false,
    appId: null,
    apiUrl: null,
    socketUrl: null,
    user: null,
    recipient: null,
    appConfig: null,
    selectedRoom: null,
    selectedRoomId: null,
    rooms: [],
    messages: [],
    socket: null,
    messagesContainerRef: null,
    isMobileView: document.getElementById('teemboom_chat').clientWidth <= 768,
    loading: true
  }),

  actions: {
    appInit() {
      const config = window.teemboomChatConfig
      if (config.token) {
        fetch(`${config.apiUrl}/teemboom_token_config`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            token: config.token,
            app_id: config.appId,
            domain: window.location.origin
          })
        })
          .then(res => { return res.json() })
          .then(res => {
            if (res.status) {
              this.appId = config.appId
              this.apiUrl = config.apiUrl
              this.user = res.data.decoded.user
              this.recipient = res.data.decoded.recipient

              this.appConfig = res.data.app_config

              this.loadUserRooms()
              window.addEventListener('resize', this.handleResize)
              this.socketUrl = config.socketUrl
              this.authenticated = true
            } else {
              console.error(`Teemboom Chat: ${res.message}`)
            }
          })
      } else {
        this.appId = config.appId
        this.apiUrl = config.apiUrl
        this.user = config.user
        this.recipient = config.recipient

        fetch(`${this.apiUrl}/teemboom_config`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            app_id: this.appId,
            domain: window.location.origin
          })
        })
          .then(res => { return res.json() })
          .then(res => {
            if (res.status) {
              this.appConfig = res.data
              this.authenticated = true
              window.addEventListener('resize', this.handleResize)
              this.socketUrl = config.socketUrl
              this.loadUserRooms()
            }
            else console.error(`Teemboom Chat: ${res.message}`)
          })
      }
    },

    async loadUserRooms() {
      await this.initializeUsers()
      await this.getUserRooms()
      this.setupSocket()
      this.loading = false
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
    transformRoomData(room) {
      // Find the recipient in this room: the user who is not the current user
      let recipient = null
      let blocked = false // This only applies to DM rooms
      if (room.type === 'dm') {
        recipient = room.users.find(user => user._id !== this.user._id)
        recipient.meta = room.users_meta.find(user => user.user_id === recipient._id)
        blocked = recipient.meta.blocked
      }

      // For DM rooms, create details object if it doesn't exist
      if (room.type === 'dm' && !room.details) {
        room.details = {
          name: recipient?.username || 'Unknown User',
          image_url: recipient?.profile_pic || null
        }
      }

      return {
        _id: room._id,
        recipient: recipient || null,
        blocked: blocked,
        transmit: room.users.filter(user => user._id !== this.user._id).map(user => user._id), // An array of user ids that are in the room
        users: room.users.filter(user => user._id !== this.user._id),
        unread_count: room.unread_count || 0,
        recentMessage: room.recent_message || null,
        createdAt: room.created,
        updatedAt: room.updated,
        type: room.type,
        details: room.details
      }
    },
    async getUserRooms(reset = false) {
      if (reset) {
        this.rooms = []
        this.selectedRoom = null
        this.selectedRoomId = null
      }
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
          this.rooms = res.data.map(room => this.transformRoomData(room))

          // If a recipient is not defined, simply enter the user into the most recently updated room of theirs.
          if (this.recipient) {
            this.findRecipientRoom()
          }
        })
    },
    async findRecipientRoom() {
      // This function should only run if we need to create a room with a recipient
      if (!this.recipient || !this.recipient.id) return
      // If the room is found locally in the already fetched rooms, use it
      const existingRoom = this.rooms.find(room => room.recipient._id === this.recipient._id)
      if (existingRoom) {
        if (this.isMobileView) return
        if (existingRoom.blocked) return
        this.selectedRoom = existingRoom
        this.selectedRoomId = existingRoom._id
        this.markRoomAsRead(existingRoom._id)
      } else { // If not found locally, meaning this is their first time meeting, create a new room (rare)
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
          .then(res => { return res.json() })
          .then(res => {
            if (res.status) this.getUserRooms()
            // If a new room is created, emit to the recipient to update their interface with the new room
            this.sendWebSocketEvent(this.socket, 'new_room', { room_id: this.recipient._id, room: res.data })
          })
      }
    },
    updateRoom(room_id) {
      if (room_id === this.selectedRoomId) return
      this.selectedRoomId = room_id
      this.selectedRoom = this.rooms.find(room => room._id === room_id)
      // Mark room as read when selected
      this.markRoomAsRead(room_id)
    },
    updateRoomRecentMessage(message) {
      this.rooms = this.rooms.map(room => {
        if (room._id === message.room_id) {
          return { ...room, recentMessage: message }
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
    editMessage(msg, recipient_id) {
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
        .then(res => { return res.json() })
        .then(res => {
          this.sendWebSocketEvent(this.socket, 'edit_message', { room_id: recipient_id, data: res.data })
          this.updateMessageContent(res.data.message_id, res.data.content)
        })
    },
    updateMessageContent(message_id, content) {
      this.messages = this.messages.map(message => {
        if (message._id === message_id) {
          return { ...message, content: content }
        }
        return message
      })
    },
    updateEntireMessage(message) {
      this.messages = this.messages.map(msg => {
        if (msg._id === message._id) {
          return message
        }
        return msg
      })
    },

    deleteMessage(msg, deleteForEveryone, recipient_id) {
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
        .then(res => { return res.json() })
        .then(res => {
          this.updateEntireMessage(res.data)
          if (deleteForEveryone) this.sendWebSocketEvent(this.socket, 'delete_message', { room_id: recipient_id, data: res.data })
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
    updateUserLastSeenInRoom(room_id) {
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
    sendWebSocketEvent(socket, eventType, payload) {
      if (socket && socket.readyState === WebSocket.OPEN) {
        const message = {
          type: eventType,
          data: payload
        };
        socket.send(JSON.stringify(message));
      } else {
        console.error('WebSocket is not open. Cannot send message:', eventType, payload);
      }
    },
    setupSocket() {    
      this.socket = new WebSocket(this.socketUrl);
      // Handle socket open: join room
      this.socket.onopen = () => {
        console.log('WebSocket opened');
        // Send a join_room event
        this.sendWebSocketEvent(this.socket, 'join_room', { room: this.user._id });
      };

    
      // Handle incoming messages
      this.socket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        const type = message.type;
        const data = message.data;
    
        if (type === 'joined') {
          console.log(data);
        }
    
        if (type === 'receive_message') {
          this.addMessageToRoom(data);
        }
    
        if (type === 'edit_message') {
          this.updateMessageContent(data.message_id, data.content);
        }
    
        if (type === 'delete_message') {
          this.updateEntireMessage(data);
        }
    
        if (type === 'new_room') {
          const room_id = data.room_id; // assuming your server sends { room_id, ... } as data
          fetch(`${this.apiUrl}/get_room_details`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              user_id: this.user._id,
              room_id: room_id
            })
          })
          .then(res => res.json())
          .then(res => {
            if (!res.status) return;
            let room = this.transformRoomData(res.data);
            this.rooms.unshift(room);
          });
        }
      };
    
      this.socket.onerror = (error) => {
        console.error("WebSocket error:", error);
      };
    
      this.socket.onclose = () => {
        console.log("WebSocket closed");
      };
    },
    socketSendMessage(room_ids, message) {
      this.sendWebSocketEvent(this.socket, 'send_message', { room_ids: room_ids, message: message })
    },

    handleResize() {
      this.isMobileView = document.getElementById('teemboom_chat').clientWidth <= 768
    },
  },
})
