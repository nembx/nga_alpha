// NGA Alpha - Content Script
// Transforms NGA board pages: card layout, sticky nav, theme toggle

export default defineContentScript({
  matches: ['*://bbs.nga.cn/*', '*://nga.178.com/*', '*://ngabbs.com/*'],
  runAt: 'document_start',

  main() {
    const THEME_KEY = 'nga-alpha-theme';
    type Theme = 'light' | 'dark';

    let link: HTMLLinkElement | null = null;
    let observer: MutationObserver | null = null;

    // -- Inject CSS early --

    function injectCSS() {
      if (link) return;
      const cssUrl = browser.runtime.getURL('/contentStyle.css');
      link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = cssUrl;
      (document.head || document.documentElement).appendChild(link);
    }

    function removeCSS() {
      if (link) {
        link.remove();
        link = null;
      }
    }

    // -- Theme System --

    function getTheme(): Theme {
      return (localStorage.getItem(THEME_KEY) as Theme) || 'light';
    }

    function applyTheme(theme: Theme) {
      localStorage.setItem(THEME_KEY, theme);
      document.documentElement.setAttribute('data-nga-theme', theme);
    }

    function removeTheme() {
      document.documentElement.removeAttribute('data-nga-theme');
    }

    // -- Floating Toolbar --

    function createToolbar() {
      if (document.getElementById('nga-alpha-toolbar')) return;
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

    function removeToolbar() {
      document.getElementById('nga-alpha-toolbar')?.remove();
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

    function unhideElements() {
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
          (el as HTMLElement).style.removeProperty('display');
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

    // -- Enable / Disable --

    function enable() {
      injectCSS();
      applyTheme(getTheme());
      createToolbar();
      hideElements();
      reorganizePostActions();

      observer = new MutationObserver(() => {
        hideElements();
        reorganizePostActions();
      });
      observer.observe(document.body, { childList: true, subtree: true });
      console.log('[NGA Alpha] Enabled');
    }

    function disable() {
      observer?.disconnect();
      observer = null;
      removeToolbar();
      removeCSS();
      removeTheme();
      unhideElements();
      console.log('[NGA Alpha] Disabled');
    }

    // -- Listen for toggle from popup --

    browser.storage.onChanged.addListener((changes) => {
      if (changes.enabled) {
        if (changes.enabled.newValue === false) {
          disable();
        } else {
          enable();
        }
      }
    });

    // -- Init --

    function init() {
      browser.storage.local.get('enabled').then((result) => {
        if (result.enabled === false) {
          console.log('[NGA Alpha] Content script loaded (disabled)');
          return;
        }
        enable();
        console.log('[NGA Alpha] Content script loaded, theme:', getTheme());
      });
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  },
});
