<template>
  <div class="link-preview" :class="{ 'layout-wide': layout === 'w' }">
    <div v-if="loading" class="loading">Loading preview...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else class="content-wrapper">
      <div class="text-content">
        <h3 class="title">{{ previewData.title }}</h3>
        <p class="description">{{ previewData.description }}</p>
      </div>
      <div class="image-container" v-if="!imageError">
        <img 
          :src="previewData.image" 
          :alt="previewData.title" 
          class="preview-image"
          @error="handleImageError"
        />
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'LinkPreview',
  props: {
    layout: {
      type: String,
      default: 'l',
    },
    url: {
      type: String,
      required: true
    },
    apiKey: {
      type: String,
      required: true,
      default: '605d81157eb076e3db4c7deaed75bc7e'
    }
  },
  data() {
    return {
      loading: true,
      error: null,
      previewData: {
        title: '',
        description: '',
        image: '',
        url: ''
      },
      imageError: false
    }
  },
  methods: {
    handleImageError() {
      this.imageError = true;
    }
  },
  async created() {
    try {
      const response = await fetch(`https://api.linkpreview.net/?q=${encodeURIComponent(this.url)}`, {
        headers: {
          'X-Linkpreview-Api-Key': this.apiKey
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch preview data');
      }
      
      this.previewData = await response.json();
      this.previewData.url = this.url
      this.$emit('success', this.previewData)
    } catch (err) {
      this.error = err.message;
    } finally {
      this.loading = false;
    }
  }
}
</script>

<style scoped>
.link-preview {
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  overflow: hidden;
  background: white;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  max-width: 300px;
  margin: 0.5rem 0;
}

.content-wrapper {
  padding: 0.75rem;
}

.layout-wide .content-wrapper {
  display: flex;
  flex-direction: row-reverse;
  align-items: center;
  gap: 0.75rem;
}

.text-content {
  flex: 1;
  min-width: 0; /* Prevents text from overflowing */
}

.title {
  margin: 0 0 0.25rem 0;
  font-size: 0.95rem;
  color: #333;
  font-weight: 600;
  /* white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis; */
}

.description {
  margin: 0;
  color: #666;
  font-size: 0.85rem;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.image-container {
  width: 100%;
  margin-top: 0.75rem;
}

.layout-wide .image-container {
  width: 120px;
  margin-top: 0;
  flex-shrink: 0;
}

.preview-image {
  width: 100%;
  height: auto;
  object-fit: contain;
  border-radius: 3px;
}

.layout-wide .preview-image {
  height: 80px;
}

.loading, .error {
  padding: 1rem;
  text-align: center;
  color: #666;
}

.error {
  color: #dc3545;
}
</style>
