// NGA Alpha - Content Script
// Transforms NGA board pages: card layout, sticky nav, theme toggle

export default defineContentScript({
  matches: ['*://bbs.nga.cn/*', '*://nga.178.com/*', '*://ngabbs.com/*'],
  runAt: 'document_start',

  main() {
    const THEME_KEY = 'nga-alpha-theme';
    type Theme = 'light' | 'dark';

    // -- Inject CSS early --

    const cssUrl = browser.runtime.getURL('/contentStyle.css');
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = cssUrl;
    (document.head || document.documentElement).appendChild(link);

    // -- Theme System --

    function getTheme(): Theme {
      return (localStorage.getItem(THEME_KEY) as Theme) || 'light';
    }

    function applyTheme(theme: Theme) {
      localStorage.setItem(THEME_KEY, theme);
      document.documentElement.setAttribute('data-nga-theme', theme);
    }

    // Apply theme immediately to prevent flash
    applyTheme(getTheme());

    // -- Floating Toolbar --

    function createToolbar() {
      const toolbar = document.createElement('div');
      toolbar.id = 'nga-alpha-toolbar';

      // Theme toggle
      const themeBtn = document.createElement('button');
      themeBtn.id = 'nga-alpha-theme-btn';
      themeBtn.title = '切换亮/暗主题';
      const updateIcon = () => {
        themeBtn.textContent = getTheme() === 'light' ? '🌙' : '☀️';
      };
      updateIcon();
      themeBtn.addEventListener('click', () => {
        applyTheme(getTheme() === 'light' ? 'dark' : 'light');
        updateIcon();
      });

      // Back to top
      const topBtn = document.createElement('button');
      topBtn.id = 'nga-alpha-top-btn';
      topBtn.title = '回到顶部';
      topBtn.textContent = '↑';
      topBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });

      window.addEventListener(
        'scroll',
        () => {
          topBtn.classList.toggle('visible', window.scrollY > 400);
        },
        { passive: true },
      );

      toolbar.appendChild(themeBtn);
      toolbar.appendChild(topBtn);
      document.body.appendChild(toolbar);
    }

    // -- Hide Unwanted Elements --

    function hideElements() {
      const selectors = [
        '#m_ads',
        '#m_footer',
        '#footer',
        'iframe[src*="ad"]',
        'div[id*="ad_"]',
        'div[class*="advertisement"]',
      ];
      selectors.forEach((sel) => {
        document.querySelectorAll(sel).forEach((el) => {
          (el as HTMLElement).style.display = 'none';
        });
      });
    }

    // -- Reorganize Post Actions --
    // Move voting buttons (.goodbad) into the postInfo footer bar

    function reorganizePostActions() {
      document.querySelectorAll('tr.postrow').forEach((row) => {
        const postInfo =
          row.querySelector('[id^="postInfo"]') ||
          row.querySelector('.postInfo');
        if (!postInfo) return;

        const goodbad = row.querySelector('.goodbad');
        if (goodbad && !postInfo.contains(goodbad)) {
          postInfo.appendChild(goodbad);
        }
      });
    }

    // -- Init --

    function init() {
      createToolbar();
      hideElements();
      reorganizePostActions();

      // Watch for dynamically loaded content (NGA lazy-loads some elements)
      const observer = new MutationObserver(() => {
        hideElements();
        reorganizePostActions();
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }

    console.log('[NGA Alpha] Content script loaded, theme:', getTheme());
  },
});
