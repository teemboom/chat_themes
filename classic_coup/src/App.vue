<template>
  <ChatLayout v-if="appStore.authenticated" />
</template>

<script>
import ChatLayout from './components/ChatLayout.vue'
import { useAppStore } from './store/store'

export default {
  name: 'App',
  components: {
    ChatLayout
  },
  data(){
    return {
      appStore: useAppStore(),
    }
  },
  mounted(){
    this.appStore.appInit()
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
    Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}
img{
  object-fit: cover;
}
</style>
