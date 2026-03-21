import contentCss from '../assets/contentStyle.css?raw';

// NGA Alpha - Content Script
// Transforms NGA board pages: card layout, sticky nav, theme toggle

export default defineContentScript({
  matches: ['*://bbs.nga.cn/*', '*://nga.178.com/*', '*://ngabbs.com/*'],
  runAt: 'document_start',

  main() {
    const POST_CONTENT_ID_SELECTOR =
      '[id^="postcontent"]:not([id^="postcontentandsubject"])';
    const POST_CONTENT_SELECTOR = `.postcontent, ${POST_CONTENT_ID_SELECTOR}`;
    const POST_CONTENT_WRAPPER_SELECTOR = '[id^="postcontentandsubject"]';
    const COMMENT_CONTAINER_SELECTOR = '.comment_c';
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
      const host = document.head || document.documentElement;
      if (!host) return;

      if (!style) {
        style = document.createElement('style');
        style.id = 'nga-alpha-style';
        style.textContent = contentCss;
      }

      if (style.parentNode !== host || host.lastElementChild !== style) {
        host.appendChild(style);
      }
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
      themeBtn.title = '\u5207\u6362\u660e\u6697\u4e3b\u9898';
      const updateIcon = () => {
        themeBtn.textContent = getTheme() === 'light' ? '\u263d' : '\u2600';
      };
      updateIcon();
      themeBtn.addEventListener('click', () => {
        applyTheme(getTheme() === 'light' ? 'dark' : 'light');
        updateIcon();
      });

      // Back to top
      const topBtn = document.createElement('button');
      topBtn.id = 'nga-alpha-top-btn';
      topBtn.title = '\u56de\u5230\u9876\u90e8';
      topBtn.textContent = '\u2191';
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

      toggleNavUtilityLinks(true);
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

      toggleNavUtilityLinks(false);
    }

    function toggleNavUtilityLinks(hidden: boolean) {
      const targetTexts = new Set(['\u8bc4\u5206', '\u5f00\u59cb']);

      document.querySelectorAll<HTMLAnchorElement>('a.mmdefault').forEach((link) => {
        const label = (link.textContent || '').replace(/\s+/g, ' ').trim();
        const href = link.getAttribute('href') || '';
        const isTarget =
          targetTexts.has(label) ||
          href.includes('game.nga.cn') ||
          link.title === '\u8bc4\u5206';

        if (!isTarget) return;

        const wrapper = link.closest<HTMLElement>('.td');
        const target =
          wrapper && wrapper.querySelectorAll('a.mmdefault').length === 1 ? wrapper : link;

        if (hidden) {
          target.style.setProperty('display', 'none', 'important');
        } else {
          target.style.removeProperty('display');
        }
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

    function alignPostContent(root: ParentNode = document) {
      const elements: HTMLElement[] = [];

      if (root instanceof HTMLElement && root.matches(POST_CONTENT_SELECTOR)) {
        elements.push(root);
      }

      if ('querySelectorAll' in root) {
        elements.push(
          ...Array.from(root.querySelectorAll<HTMLElement>(POST_CONTENT_SELECTOR)),
        );
      }

      elements.forEach((element) => {
        element.style.setProperty('text-indent', '0', 'important');
        element.style.setProperty('display', 'block', 'important');

        if (element.closest(COMMENT_CONTAINER_SELECTOR)) {
          element.style.setProperty('padding-left', 'var(--nga-post-indent)', 'important');
          return;
        }

        element.style.setProperty(
          'padding-left',
          'calc(20px + var(--nga-post-indent))',
          'important',
        );
      });
    }

    function normalizePostContainers(root: ParentNode = document) {
      const containers: HTMLElement[] = [];

      if (root instanceof HTMLElement && root.matches(POST_CONTENT_WRAPPER_SELECTOR)) {
        containers.push(root);
      }

      if ('querySelectorAll' in root) {
        containers.push(
          ...Array.from(
            root.querySelectorAll<HTMLElement>(POST_CONTENT_WRAPPER_SELECTOR),
          ),
        );
      }

      containers.forEach((container) => {
        Array.from(container.children).forEach((child) => {
          if (!(child instanceof HTMLElement)) return;
          if (child.tagName !== 'BR') return;
          child.style.setProperty('display', 'none', 'important');
        });
      });
    }

    function collapseAttachments(root: ParentNode = document) {
      const buttons: HTMLAnchorElement[] = [];
      const selector = 'a.contentFullWidthButton';

      if (root instanceof HTMLAnchorElement && root.matches(selector)) {
        buttons.push(root);
      }

      if ('querySelectorAll' in root) {
        buttons.push(...Array.from(root.querySelectorAll<HTMLAnchorElement>(selector)));
      }

      buttons.forEach((button) => {
        const label = button.textContent?.trim() || '';
        const shouldCollapse = /鏀惰捣|鎶樺彔|闅愯棌/.test(label) && !/灞曞紑/.test(label);

        if (!shouldCollapse) return;
        if (button.dataset.ngaAlphaCollapsed === 'true') return;

        button.dataset.ngaAlphaCollapsed = 'true';
        button.click();
      });
    }

    function hideQuotedImageBlocks(root: ParentNode = document) {
      const blocks: HTMLElement[] = [];
      const selector = '.quote.left';

      if (root instanceof HTMLElement && root.matches(selector)) {
        blocks.push(root);
      }

      if ('querySelectorAll' in root) {
        blocks.push(...Array.from(root.querySelectorAll<HTMLElement>(selector)));
      }

      blocks.forEach((block) => {
        if (block.dataset.ngaAlphaQuotedImageHidden === 'true') return;

        const previewImage = block.querySelector(
          'a[href*="/attachments/"] > img, a[title*="鍘熷浘"] > img, a[href$=".jpg"] > img, a[href$=".jpeg"] > img, a[href$=".png"] > img, a[href$=".gif"] > img, a[href$=".webp"] > img',
        );
        if (!previewImage) return;

        const visibleText = (block.textContent || '').replace(/\u00a0/g, ' ').trim();
        if (visibleText.length > 0) return;

        block.dataset.ngaAlphaQuotedImageHidden = 'true';
        block.style.setProperty('display', 'none', 'important');
      });
    }

    // -- Enable / Disable --

    function enableDomFeatures() {
      if (!isEnabled || !document.body) return;

      injectCSS();
      createToolbar();
      hideElements();
      reorganizePostActions();
      normalizePostContainers(document.body);
      alignPostContent(document.body);
      collapseAttachments(document.body);
      hideQuotedImageBlocks(document.body);

      if (!observer) {
        observer = new MutationObserver((mutations) => {
          hideElements();
          reorganizePostActions();
          mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
              if (node instanceof HTMLElement) {
                normalizePostContainers(node);
                alignPostContent(node);
                collapseAttachments(node);
                hideQuotedImageBlocks(node);
              }
            });
          });
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




