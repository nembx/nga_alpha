export default defineBackground(() => {
  console.log('[NGA Alpha] Background script loaded', {
    id: browser.runtime.id,
  });
});
