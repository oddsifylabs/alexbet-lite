/**
 * UserPreferences - User settings and preferences management
 * Handles UI settings, display preferences, and user customizations
 */

class UserPreferences {
  constructor() {
    this.storageKey = 'alexbet_preferences';
    this.defaultPreferences = {
      // UI Settings
      theme: 'dark',
      colorScheme: 'blue',
      fontSize: 'medium',
      layout: 'compact',
      sidebarCollapsed: false,
      
      // Display Settings
      showCurrencySymbol: true,
      currencyCode: 'USD',
      decimalPlaces: 2,
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h',
      
      // Analytics Settings
      defaultChartType: 'bar',
      autoRefreshDashboard: true,
      refreshInterval: 5000,
      defaultTimeRange: '30d',
      
      // Notification Settings
      enableNotifications: true,
      enableSoundAlerts: true,
      enableBrowserNotifications: true,
      notificationPosition: 'top-right',
      
      // Data Settings
      autoBackup: true,
      backupFrequency: 'daily',
      dataRetention: 'unlimited',
      
      // Privacy Settings
      privacyMode: false,
      anonymizeNames: false,
      
      // Advanced Settings
      enableBetTracking: true,
      enableAnalytics: true,
      enableExportImport: true,
      debugMode: false
    };

    this.preferences = this.loadPreferences();
  }

  /**
   * Load preferences from localStorage
   */
  loadPreferences() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        return { ...this.defaultPreferences, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.warn('Failed to load preferences:', error);
    }
    return { ...this.defaultPreferences };
  }

  /**
   * Save preferences to localStorage
   */
  savePreferences() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.preferences));
      return { success: true, message: 'Preferences saved' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Update a single preference
   */
  updatePreference(key, value) {
    if (key in this.defaultPreferences) {
      this.preferences[key] = value;
      return this.savePreferences();
    }
    return { success: false, error: `Unknown preference: ${key}` };
  }

  /**
   * Update multiple preferences
   */
  updatePreferences(updates) {
    try {
      Object.keys(updates).forEach(key => {
        if (key in this.defaultPreferences) {
          this.preferences[key] = updates[key];
        }
      });
      return this.savePreferences();
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get a single preference
   */
  getPreference(key) {
    return this.preferences[key];
  }

  /**
   * Get all preferences
   */
  getAllPreferences() {
    return { ...this.preferences };
  }

  /**
   * Reset preference to default
   */
  resetPreference(key) {
    if (key in this.defaultPreferences) {
      this.preferences[key] = this.defaultPreferences[key];
      return this.savePreferences();
    }
    return { success: false, error: `Unknown preference: ${key}` };
  }

  /**
   * Reset all preferences to default
   */
  resetAllPreferences() {
    this.preferences = { ...this.defaultPreferences };
    return this.savePreferences();
  }

  /**
   * Format currency based on preferences
   */
  formatCurrency(amount) {
    const symbol = this.preferences.showCurrencySymbol ? '$' : '';
    const decimals = this.preferences.decimalPlaces;
    const formatted = parseFloat(amount).toFixed(decimals);
    return `${symbol}${formatted}`;
  }

  /**
   * Format date based on preferences
   */
  formatDate(date) {
    const d = new Date(date);
    const format = this.preferences.dateFormat;

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();

    switch (format) {
      case 'DD/MM/YYYY':
        return `${day}/${month}/${year}`;
      case 'YYYY-MM-DD':
        return `${year}-${month}-${day}`;
      default:
        return `${month}/${day}/${year}`;
    }
  }

  /**
   * Format time based on preferences
   */
  formatTime(date) {
    const d = new Date(date);
    const format = this.preferences.timeFormat;

    if (format === '24h') {
      return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    } else {
      return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    }
  }

  /**
   * Apply theme to document
   */
  applyTheme() {
    const theme = this.preferences.theme;
    const colorScheme = this.preferences.colorScheme;

    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-color-scheme', colorScheme);

    // Add CSS classes for styling
    if (theme === 'light') {
      document.body.classList.remove('dark-theme');
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
      document.body.classList.add('dark-theme');
    }
  }

  /**
   * Apply font size
   */
  applyFontSize() {
    const sizeMap = {
      small: '12px',
      medium: '14px',
      large: '16px',
      xlarge: '18px'
    };

    const size = sizeMap[this.preferences.fontSize] || sizeMap.medium;
    document.documentElement.style.fontSize = size;
  }

  /**
   * Apply layout
   */
  applyLayout() {
    const layout = this.preferences.layout;
    document.documentElement.setAttribute('data-layout', layout);
  }

  /**
   * Get notification position style
   */
  getNotificationPositionStyle() {
    const position = this.preferences.notificationPosition;
    const positions = {
      'top-left': { top: '20px', left: '20px' },
      'top-center': { top: '20px', left: '50%', transform: 'translateX(-50%)' },
      'top-right': { top: '20px', right: '20px' },
      'bottom-left': { bottom: '20px', left: '20px' },
      'bottom-center': { bottom: '20px', left: '50%', transform: 'translateX(-50%)' },
      'bottom-right': { bottom: '20px', right: '20px' }
    };

    return positions[position] || positions['top-right'];
  }

  /**
   * Export preferences to JSON
   */
  exportPreferences() {
    return {
      success: true,
      data: JSON.stringify({
        exportDate: new Date().toISOString(),
        version: '1.0',
        preferences: this.preferences
      }, null, 2)
    };
  }

  /**
   * Import preferences from JSON
   */
  importPreferences(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      
      if (!data.preferences || typeof data.preferences !== 'object') {
        throw new Error('Invalid preferences format');
      }

      // Validate preferences
      const updates = {};
      Object.keys(data.preferences).forEach(key => {
        if (key in this.defaultPreferences) {
          updates[key] = data.preferences[key];
        }
      });

      this.updatePreferences(updates);
      this.applyTheme();
      this.applyFontSize();
      this.applyLayout();

      return { success: true, message: 'Preferences imported successfully' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get preference category
   */
  getPreferenceCategory(category) {
    const categories = {
      ui: ['theme', 'colorScheme', 'fontSize', 'layout', 'sidebarCollapsed'],
      display: ['showCurrencySymbol', 'currencyCode', 'decimalPlaces', 'dateFormat', 'timeFormat'],
      analytics: ['defaultChartType', 'autoRefreshDashboard', 'refreshInterval', 'defaultTimeRange'],
      notifications: ['enableNotifications', 'enableSoundAlerts', 'enableBrowserNotifications', 'notificationPosition'],
      data: ['autoBackup', 'backupFrequency', 'dataRetention'],
      privacy: ['privacyMode', 'anonymizeNames'],
      advanced: ['enableBetTracking', 'enableAnalytics', 'enableExportImport', 'debugMode']
    };

    if (category in categories) {
      const result = {};
      categories[category].forEach(key => {
        result[key] = this.preferences[key];
      });
      return result;
    }

    return null;
  }

  /**
   * Get available options for preference
   */
  getPreferenceOptions(key) {
    const options = {
      theme: ['light', 'dark', 'auto'],
      colorScheme: ['blue', 'green', 'purple', 'red', 'orange', 'teal'],
      fontSize: ['small', 'medium', 'large', 'xlarge'],
      layout: ['compact', 'comfortable', 'spacious'],
      dateFormat: ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'],
      timeFormat: ['12h', '24h'],
      defaultChartType: ['bar', 'line', 'doughnut', 'pie'],
      defaultTimeRange: ['7d', '30d', '90d', '180d', '1y', 'all'],
      notificationPosition: ['top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right'],
      backupFrequency: ['daily', 'weekly', 'monthly', 'manual'],
      dataRetention: ['7d', '30d', '90d', '180d', '1y', 'unlimited'],
      currencyCode: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY']
    };

    return options[key] || [];
  }

  /**
   * Validate preference value
   */
  validatePreference(key, value) {
    const options = this.getPreferenceOptions(key);
    
    if (options.length > 0 && !options.includes(value)) {
      return {
        valid: false,
        error: `Invalid value for ${key}. Allowed: ${options.join(', ')}`
      };
    }

    return { valid: true };
  }

  /**
   * Get preference metadata
   */
  getPreferenceMetadata(key) {
    const metadata = {
      theme: { label: 'Theme', type: 'select', category: 'ui' },
      colorScheme: { label: 'Color Scheme', type: 'select', category: 'ui' },
      fontSize: { label: 'Font Size', type: 'select', category: 'ui' },
      layout: { label: 'Layout', type: 'select', category: 'ui' },
      showCurrencySymbol: { label: 'Show Currency Symbol', type: 'toggle', category: 'display' },
      enableNotifications: { label: 'Enable Notifications', type: 'toggle', category: 'notifications' },
      enableSoundAlerts: { label: 'Enable Sound Alerts', type: 'toggle', category: 'notifications' },
      autoBackup: { label: 'Auto Backup', type: 'toggle', category: 'data' },
      privacyMode: { label: 'Privacy Mode', type: 'toggle', category: 'privacy' }
    };

    return metadata[key] || null;
  }

  /**
   * Get all available preferences with metadata
   */
  getPreferencesWithMetadata() {
    return Object.keys(this.defaultPreferences).map(key => {
      const metadata = this.getPreferenceMetadata(key);
      return {
        key,
        value: this.preferences[key],
        default: this.defaultPreferences[key],
        options: this.getPreferenceOptions(key),
        metadata
      };
    });
  }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UserPreferences;
}
