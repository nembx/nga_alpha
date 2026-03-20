import contentCss from '../assets/contentStyle.css?raw';

// NGA Alpha - Content Script
// Transforms NGA board pages: card layout, sticky nav, theme toggle

export default defineContentScript({
  matches: ['*://bbs.nga.cn/*', '*://nga.178.com/*', '*://ngabbs.com/*'],
  runAt: 'document_start',

  main() {
    const ENABLED_KEY = 'nga-alpha-enabled';
    const THEME_KEY = 'nga-alpha-theme';
    type Theme = 'light' | 'dark';

    let style: HTMLStyleElement | null = null;
    let observer: MutationObserver | null = null;
    let scrollHandler: (() => void) | null = null;
    let isEnabled = false;
    let domInitScheduled = false;

    // -- Inject CSS early --

    function injectCSS() {
      if (style) return;
      style = document.createElement('style');
      style.id = 'nga-alpha-style';
      style.textContent = contentCss;
      (document.head || document.documentElement).appendChild(style);
    }

    function removeCSS() {
      if (style) {
        style.remove();
        style = null;
      }
    }

    // -- Theme System --

    function getCachedEnabled(): boolean | null {
      const cached = localStorage.getItem(ENABLED_KEY);
      if (cached === 'true') return true;
      if (cached === 'false') return false;
      return null;
    }

    function setCachedEnabled(enabled: boolean) {
      localStorage.setItem(ENABLED_KEY, String(enabled));
    }

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
      if (!document.body) return;
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

      scrollHandler = () => {
        topBtn.classList.toggle('visible', window.scrollY > 400);
      };
      window.addEventListener('scroll', scrollHandler, { passive: true });
      scrollHandler();

      toolbar.appendChild(themeBtn);
      toolbar.appendChild(topBtn);
      document.body.appendChild(toolbar);
    }

    function removeToolbar() {
      document.getElementById('nga-alpha-toolbar')?.remove();
      if (scrollHandler) {
        window.removeEventListener('scroll', scrollHandler);
        scrollHandler = null;
      }
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

    function enableDomFeatures() {
      if (!isEnabled || !document.body) return;

      createToolbar();
      hideElements();
      reorganizePostActions();

      if (!observer) {
        observer = new MutationObserver(() => {
          hideElements();
          reorganizePostActions();
        });
        observer.observe(document.body, { childList: true, subtree: true });
      }
    }

    function scheduleDomFeatures() {
      if (document.body) {
        enableDomFeatures();
        return;
      }

      if (domInitScheduled) return;
      domInitScheduled = true;

      document.addEventListener(
        'DOMContentLoaded',
        () => {
          domInitScheduled = false;
          enableDomFeatures();
        },
        { once: true },
      );
    }

    function enable() {
      isEnabled = true;
      injectCSS();
      applyTheme(getTheme());
      scheduleDomFeatures();
      console.log('[NGA Alpha] Enabled');
    }

    function disable() {
      isEnabled = false;
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
          setCachedEnabled(false);
          disable();
        } else {
          setCachedEnabled(true);
          enable();
        }
      }
    });

    // -- Init --

    function init() {
      const cachedEnabled = getCachedEnabled();
      if (cachedEnabled !== false) {
        enable();
      }

      browser.storage.local.get('enabled').then((result) => {
        const enabled = result.enabled !== false;
        setCachedEnabled(enabled);

        if (!enabled) {
          disable();
          console.log('[NGA Alpha] Content script loaded (disabled)');
          return;
        }

        enable();
        console.log('[NGA Alpha] Content script loaded, theme:', getTheme());
      });
    }

    init();
  },
});
