export function addBackButtonHandler(callback) {
  const handler = (event) => {
    // Prevent normal back behavior by pushing the state back
    history.pushState(null, null, location.href);
    callback();
  };

  let listenerAdded = false;

  if (document.getElementById('teemboom_chat').clientWidth <= 768) {
    // Push a dummy state to prevent going back
    history.pushState(null, null, location.href);

    // Listen for the popstate event
    window.addEventListener('popstate', handler);
    listenerAdded = true;
  }

  return () => {
    if (listenerAdded) {
      window.removeEventListener('popstate', handler);
      console.log('Back button handler removed.');
    }
  };
}
/**
 * Format a date string into a readable time format
 * @param {string} dateString - The date string to format
 * @returns {string} Formatted time string
 */
export function formatChatTime(dateString) {
  const date = new Date(dateString)

  const options = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }

  return new Intl.DateTimeFormat('en-US', options).format(date)
}


/**
 * Detect URLs in a text string
 * @param {string} text - The text to search for URLs
 * @returns {string[]} Array of unique found URLs
 */
export function detectUrls(text) {
  // This regex matches URLs with:
  // - http:// or https:// protocol
  // - domain name with at least one dot
  // - optional path, query parameters, and fragments
  text = text.toLowerCase()
  const urlRegex = /https?:\/\/(?:[\w-]+\.)+[\w-]+(?:\/[\w-./?%&=]*)?/g
  const urls = text.match(urlRegex)
  if (urls) {
    return [...new Set(urls)]
  }
  return []
}

export const scrollToBottom = async (containerRef) => {
  if (!containerRef) return;

  await new Promise(resolve => setTimeout(resolve, 0));
  if (containerRef) {
    const { scrollTop, scrollHeight, clientHeight } = containerRef;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 300;

    if (isNearBottom) {
      containerRef.scrollTop = scrollHeight;
    }
  }
};

