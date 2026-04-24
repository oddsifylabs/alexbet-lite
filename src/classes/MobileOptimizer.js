/**
 * MobileOptimizer - Enhance UX for mobile devices
 * - Detect viewport size and optimize layouts
 * - Improve touch interactions
 * - Handle iOS/Android specific issues
 * - Optimize scrolling and performance
 */
class MobileOptimizer {
  constructor() {
    this.isMobile = this.detectMobile();
    this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    this.isAndroid = /Android/.test(navigator.userAgent);
    this.viewportWidth = window.innerWidth;
    this.viewportHeight = window.innerHeight;
    
    this.init();
  }

  init() {
    // Apply mobile-specific optimizations
    this.optimizeScrolling();
    this.optimizeTouchTargets();
    this.fixIOSIssues();
    this.preventZoom();
    this.setupOrientationHandling();
    this.improveFormInputs();
    
    if (this.isMobile) {
      console.log(`[MobileOptimizer] Mobile device detected: ${this.viewportWidth}x${this.viewportHeight}`);
      if (this.isIOS) console.log('[MobileOptimizer] iOS device detected');
      if (this.isAndroid) console.log('[MobileOptimizer] Android device detected');
    }

    // Listen for viewport changes
    window.addEventListener('resize', () => this.onViewportChange());
  }

  /**
   * Detect if device is mobile based on viewport width and user agent
   */
  detectMobile() {
    return window.innerWidth < 768 || /Mobile|Android|iPhone/.test(navigator.userAgent);
  }

  /**
   * Optimize scrolling performance
   */
  optimizeScrolling() {
    if (!this.isMobile) return;

    // Enable hardware acceleration
    const style = document.createElement('style');
    style.textContent = `
      * {
        -webkit-backface-visibility: hidden;
        -webkit-perspective: 1000;
        backface-visibility: hidden;
      }
      
      body {
        overflow-x: hidden;
      }
      
      .tabs, .controls, .form-section {
        -webkit-overflow-scrolling: touch;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Ensure touch targets are at least 44px (iOS HIG recommendation)
   */
  optimizeTouchTargets() {
    if (!this.isMobile) return;

    // Buttons
    document.querySelectorAll('button').forEach(btn => {
      const minHeight = Math.max(44, parseInt(getComputedStyle(btn).height));
      btn.style.minHeight = minHeight + 'px';
      btn.style.padding = '12px 16px';
    });

    // Form inputs
    document.querySelectorAll('input, select, textarea').forEach(input => {
      input.style.minHeight = '44px';
      input.style.padding = '12px';
      input.style.fontSize = '16px'; // Prevents auto-zoom on iOS
    });

    // Links
    document.querySelectorAll('a').forEach(link => {
      const rect = link.getBoundingClientRect();
      if (rect.height < 44 || rect.width < 44) {
        link.style.padding = '8px 12px';
        link.style.display = 'inline-block';
        link.style.minHeight = '44px';
        link.style.minWidth = '44px';
      }
    });
  }

  /**
   * Fix iOS-specific issues
   */
  fixIOSIssues() {
    if (!this.isIOS) return;

    const style = document.createElement('style');
    style.textContent = `
      /* Fix 100vh on iOS (includes address bar) */
      body {
        height: 100%;
        height: 100dvh;
      }
      
      /* Prevent iOS input zoom */
      input, select, textarea {
        font-size: 16px !important;
      }
      
      /* Prevent rubber band scrolling */
      body {
        overscroll-behavior: none;
        -webkit-user-select: text;
        -webkit-touch-callout: none;
      }
      
      /* Smooth scrolling */
      html {
        scroll-behavior: smooth;
      }
      
      /* Fix input focus outline */
      input:focus, select:focus, textarea:focus {
        outline: none;
        border-color: var(--primary);
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Prevent unwanted zoom on double tap
   */
  preventZoom() {
    document.addEventListener('touchstart', (e) => {
      // Allow zoom on form elements
      if (e.target.tagName.match(/input|select|textarea/i)) return;
      
      // Prevent double-tap zoom
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    }, false);
  }

  /**
   * Handle orientation changes
   */
  setupOrientationHandling() {
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        this.onViewportChange();
        window.scrollTo(0, 0);
      }, 100);
    });
  }

  /**
   * Improve form inputs on mobile
   */
  improveFormInputs() {
    if (!this.isMobile) return;

    document.querySelectorAll('input[type="number"]').forEach(input => {
      // Use tel for better mobile keyboard
      if (input.id === 'entryOdds' || input.id === 'odds') {
        input.inputMode = 'numeric';
      }
      if (input.id === 'stake' || input.id === 'edge' || input.id === 'confidence') {
        input.inputMode = 'decimal';
      }
    });

    // Add autocomplete attributes
    document.querySelectorAll('input[type="text"]').forEach(input => {
      if (input.id === 'pick') {
        input.setAttribute('autocomplete', 'off');
      }
    });

    // Improve select elements
    document.querySelectorAll('select').forEach(select => {
      select.style.fontSize = '16px'; // Prevent zoom on iOS
    });
  }

  /**
   * Handle viewport size changes (orientation change, resize)
   */
  onViewportChange() {
    const newWidth = window.innerWidth;
    const newHeight = window.innerHeight;

    if (newWidth !== this.viewportWidth || newHeight !== this.viewportHeight) {
      this.viewportWidth = newWidth;
      this.viewportHeight = newHeight;
      this.isMobile = this.detectMobile();

      // Re-optimize touch targets on resize
      this.optimizeTouchTargets();

      console.log(`[MobileOptimizer] Viewport changed: ${newWidth}x${newHeight}`);
    }
  }

  /**
   * Show/hide viewport info for debugging (development only)
   */
  showDebugInfo() {
    const debugDiv = document.createElement('div');
    debugDiv.id = 'mobile-debug';
    debugDiv.style.cssText = `
      position: fixed;
      bottom: 10px;
      right: 10px;
      background: rgba(0,0,0,0.8);
      color: #0f0;
      padding: 10px;
      font-family: monospace;
      font-size: 11px;
      z-index: 9999;
      border-radius: 4px;
      max-width: 200px;
    `;
    debugDiv.innerHTML = `
      Mobile: ${this.isMobile}<br>
      iOS: ${this.isIOS}<br>
      Android: ${this.isAndroid}<br>
      Size: ${this.viewportWidth}x${this.viewportHeight}<br>
      DPR: ${window.devicePixelRatio}
    `;
    document.body.appendChild(debugDiv);
  }
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const mobileOptimizer = new MobileOptimizer();
  });
} else {
  const mobileOptimizer = new MobileOptimizer();
}
