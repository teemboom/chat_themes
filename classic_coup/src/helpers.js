export function formatChatTime(dateString) {
    const date = new Date(dateString)

    const options = {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }

    return new Intl.DateTimeFormat('en-US', options).format(date)
  }