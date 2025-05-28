export const scrollToBottom = async (containerRef) => {
  if (!containerRef) return;
  
  await new Promise(resolve => setTimeout(resolve, 0));
  if (containerRef) {
    const { scrollTop, scrollHeight, clientHeight } = containerRef;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 200;
    
    if (isNearBottom) {
      containerRef.scrollTop = scrollHeight;
    }
  }
}; 