/**
 * NotificationManager - User notifications, alerts, and reminders
 * Handles in-app notifications, browser notifications, and email alerts
 */

class NotificationManager {
  constructor(security) {
    this.security = security;
    this.notifications = [];
    this.alertSettings = {
      enableBrowserNotifications: true,
      enableSoundAlerts: true,
      enableEmailAlerts: false,
      alertThresholds: {
        largeWin: 100,
        largeLoss: -100,
        winStreak: 3,
        lossStreak: 2
      }
    };
    this.notificationQueue = [];
    this.maxNotifications = 50;
    this.soundEnabled = true;
    this.audio = new Audio();
  }

  /**
   * Request browser notification permission
   */
  requestBrowserNotificationPermission() {
    if (!('Notification' in window)) {
      return {
        success: false,
        message: 'Browser notifications not supported'
      };
    }

    if (Notification.permission === 'granted') {
      return {
        success: true,
        permission: 'granted'
      };
    }

    if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        return { success: true, permission };
      });
    }

    return {
      success: false,
      message: 'User denied notification permission'
    };
  }

  /**
   * Send notification to user
   */
  sendNotification(title, options = {}) {
    try {
      const notification = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title,
        type: options.type || 'info',
        message: options.message || '',
        timestamp: new Date(),
        read: false,
        data: options.data || {},
        persistent: options.persistent || false,
        actionUrl: options.actionUrl || null
      };

      // Sanitize notification content
      notification.title = this.security.sanitizeInput(notification.title);
      notification.message = this.security.sanitizeInput(notification.message);

      this.notifications.unshift(notification);
      this.notificationQueue.push(notification);

      // Keep only recent notifications
      if (this.notifications.length > this.maxNotifications) {
        this.notifications.pop();
      }

      // Show browser notification if enabled
      if (this.alertSettings.enableBrowserNotifications && Notification.permission === 'granted') {
        this.showBrowserNotification(title, options);
      }

      // Play sound if enabled
      if (this.alertSettings.enableSoundAlerts && this.soundEnabled) {
        this.playNotificationSound(notification.type);
      }

      return { success: true, notification };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Show browser notification
   */
  showBrowserNotification(title, options) {
    try {
      new Notification(title, {
        body: options.message,
        icon: options.icon || '/assets/icon.png',
        badge: '/assets/badge.png',
        tag: options.tag || 'default',
        requireInteraction: options.persistent || false
      });
    } catch (error) {
      console.warn('Browser notification failed:', error);
    }
  }

  /**
   * Play notification sound
   */
  playNotificationSound(type) {
    try {
      const soundMap = {
        info: '/sounds/info.mp3',
        success: '/sounds/success.mp3',
        warning: '/sounds/warning.mp3',
        error: '/sounds/error.mp3',
        alert: '/sounds/alert.mp3'
      };

      const soundUrl = soundMap[type] || soundMap.info;
      this.audio.src = soundUrl;
      this.audio.play().catch(() => {
        // Silent fail - user may have disabled audio
      });
    } catch (error) {
      // Silently fail
    }
  }

  /**
   * Alert on large win
   */
  alertLargeWin(bet) {
    if (bet.pnl > this.alertSettings.alertThresholds.largeWin) {
      this.sendNotification('🎉 Large Win!', {
        type: 'success',
        message: `Won $${Math.round(bet.pnl)} on ${bet.event}`,
        data: { bet },
        persistent: true
      });
    }
  }

  /**
   * Alert on large loss
   */
  alertLargeLoss(bet) {
    if (bet.pnl < this.alertSettings.alertThresholds.largeLoss) {
      this.sendNotification('⚠️ Large Loss', {
        type: 'warning',
        message: `Lost $${Math.abs(Math.round(bet.pnl))} on ${bet.event}`,
        data: { bet },
        persistent: true
      });
    }
  }

  /**
   * Alert on winning streak
   */
  alertWinningStreak(streakLength) {
    if (streakLength >= this.alertSettings.alertThresholds.winStreak) {
      this.sendNotification('🔥 Hot Streak!', {
        type: 'success',
        message: `You're on a ${streakLength}-bet winning streak!`,
        persistent: false
      });
    }
  }

  /**
   * Alert on losing streak
   */
  alertLosingStreak(streakLength) {
    if (streakLength >= this.alertSettings.alertThresholds.lossStreak) {
      this.sendNotification('📉 Losing Streak', {
        type: 'warning',
        message: `Be careful - ${streakLength} consecutive losses`,
        persistent: true
      });
    }
  }

  /**
   * Alert on bet settlement
   */
  alertBetSettled(bet) {
    const result = bet.status === 'WON' ? '✅ Won' : bet.status === 'LOST' ? '❌ Lost' : '➖ Push';
    const pnlDisplay = bet.pnl > 0 ? `+$${Math.round(bet.pnl)}` : `$${Math.round(bet.pnl)}`;

    this.sendNotification(`${result}: ${bet.event}`, {
      type: bet.status === 'WON' ? 'success' : 'warning',
      message: `${bet.pick} - ${pnlDisplay}`,
      data: { bet }
    });
  }

  /**
   * Alert on ROI milestone
   */
  alertROIMilestone(roi, milestone) {
    this.sendNotification(`🎯 ROI Milestone!`, {
      type: 'success',
      message: `Congratulations! You've reached ${milestone}% ROI`,
      persistent: true
    });
  }

  /**
   * Send reminder notifications
   */
  sendReminder(title, message, delay = 5000) {
    setTimeout(() => {
      this.sendNotification(title, {
        type: 'info',
        message: message,
        persistent: false
      });
    }, delay);
  }

  /**
   * Mark notification as read
   */
  markAsRead(notificationId) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      return { success: true };
    }
    return { success: false, error: 'Notification not found' };
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead() {
    this.notifications.forEach(n => {
      n.read = true;
    });
    return { success: true, count: this.notifications.length };
  }

  /**
   * Get unread notification count
   */
  getUnreadCount() {
    return this.notifications.filter(n => !n.read).length;
  }

  /**
   * Get notifications
   */
  getNotifications(limit = 20, filter = null) {
    let filtered = [...this.notifications];

    if (filter) {
      if (filter.type) {
        filtered = filtered.filter(n => n.type === filter.type);
      }
      if (filter.read !== undefined) {
        filtered = filtered.filter(n => n.read === filter.read);
      }
    }

    return filtered.slice(0, limit);
  }

  /**
   * Clear old notifications
   */
  clearOldNotifications(hoursOld = 24) {
    const cutoff = new Date(Date.now() - hoursOld * 60 * 60 * 1000);
    const before = this.notifications.length;

    this.notifications = this.notifications.filter(n => n.timestamp > cutoff || n.persistent);

    return {
      success: true,
      removed: before - this.notifications.length
    };
  }

  /**
   * Delete notification
   */
  deleteNotification(notificationId) {
    const index = this.notifications.findIndex(n => n.id === notificationId);
    if (index !== -1) {
      this.notifications.splice(index, 1);
      return { success: true };
    }
    return { success: false, error: 'Notification not found' };
  }

  /**
   * Update notification settings
   */
  updateSettings(newSettings) {
    this.alertSettings = {
      ...this.alertSettings,
      ...newSettings
    };
    return { success: true, settings: this.alertSettings };
  }

  /**
   * Get notification settings
   */
  getSettings() {
    return this.alertSettings;
  }

  /**
   * Toggle sound alerts
   */
  toggleSoundAlerts(enabled) {
    this.soundEnabled = enabled;
    return { success: true, soundEnabled: this.soundEnabled };
  }

  /**
   * Get notification statistics
   */
  getNotificationStats() {
    const byType = {};
    let totalUnread = 0;

    this.notifications.forEach(n => {
      byType[n.type] = (byType[n.type] || 0) + 1;
      if (!n.read) totalUnread++;
    });

    return {
      total: this.notifications.length,
      unread: totalUnread,
      byType,
      oldestNotification: this.notifications.length > 0 ? this.notifications[this.notifications.length - 1].timestamp : null,
      newestNotification: this.notifications.length > 0 ? this.notifications[0].timestamp : null
    };
  }

  /**
   * Export notifications
   */
  exportNotifications(format = 'json') {
    if (format === 'json') {
      return {
        success: true,
        data: JSON.stringify({
          exportDate: new Date().toISOString(),
          notifications: this.notifications
        }, null, 2)
      };
    } else if (format === 'csv') {
      const headers = ['ID', 'Title', 'Type', 'Message', 'Timestamp', 'Read'];
      const rows = this.notifications.map(n => [
        n.id,
        n.title,
        n.type,
        n.message,
        n.timestamp.toISOString(),
        n.read
      ]);

      let csv = headers.join(',') + '\n';
      rows.forEach(row => {
        csv += row.map(cell => {
          if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"'))) {
            return `"${cell.replace(/"/g, '""')}"`;
          }
          return cell;
        }).join(',') + '\n';
      });

      return {
        success: true,
        data: csv
      };
    }

    return { success: false, error: 'Unsupported format' };
  }

  /**
   * Create alert for edge detection
   */
  alertEdgeDetected(bet) {
    if (bet.edge && bet.edge > 2) {
      this.sendNotification('💡 High Edge Opportunity!', {
        type: 'success',
        message: `Detected ${bet.edge}% edge on ${bet.event}`,
        data: { bet },
        persistent: false
      });
    }
  }

  /**
   * Create daily summary notification
   */
  sendDailySummary(stats) {
    const roi = stats.roi > 0 ? `+${stats.roi}%` : `${stats.roi}%`;
    const profitability = stats.profitability;

    this.sendNotification('📊 Daily Summary', {
      type: 'info',
      message: `${stats.settledBets} settled bets | ${stats.winRate}% win rate | ${roi} ROI | ${profitability}`,
      persistent: false
    });
  }

  /**
   * Clear all notifications
   */
  clearAll() {
    const count = this.notifications.length;
    this.notifications = [];
    return { success: true, cleared: count };
  }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = NotificationManager;
}
