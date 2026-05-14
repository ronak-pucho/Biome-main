import axios from 'axios';

/**
 * Price Tracking Service for Biome
 * Monitors price changes and sends notifications
 */

export interface PriceAlert {
  id: string;
  itemId: string;
  itemName: string;
  platform: string;
  currentPrice: number;
  targetPrice: number;
  domain: string;
  createdAt: Date;
  isActive: boolean;
}

export interface PriceHistory {
  itemId: string;
  platform: string;
  prices: Array<{
    price: number;
    timestamp: Date;
  }>;
}

export interface NotificationPreference {
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  notificationThreshold: number; // percentage drop
}

class PriceTrackingService {
  private apiUrl = import.meta.env.VITE_API_URL || '/api';
  private wsUrl = import.meta.env.VITE_WS_URL || 'wss://ws.biome.local';
  private ws: WebSocket | null = null;
  private priceAlerts: Map<string, PriceAlert> = new Map();
  private notificationListeners: Set<(alert: PriceAlert) => void> = new Set();

  /**
   * Initialize WebSocket connection for real-time price updates
   */
  initializeWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.wsUrl);

        this.ws.onopen = () => {
          console.log('Price tracking WebSocket connected');
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handlePriceUpdate(JSON.parse(event.data));
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('Price tracking WebSocket disconnected');
          // Attempt to reconnect after 5 seconds
          setTimeout(() => this.initializeWebSocket(), 5000);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Create a price alert for an item
   */
  async createPriceAlert(
    itemId: string,
    itemName: string,
    platform: string,
    currentPrice: number,
    targetPrice: number,
    domain: string
  ): Promise<PriceAlert> {
    try {
      const response = await axios.post(`${this.apiUrl}/price-alerts`, {
        itemId,
        itemName,
        platform,
        currentPrice,
        targetPrice,
        domain,
      });

      const alert = response.data;
      this.priceAlerts.set(alert.id, alert);
      return alert;
    } catch (error) {
      console.error('Failed to create price alert:', error);
      throw error;
    }
  }

  /**
   * Get all active price alerts for user
   */
  async getPriceAlerts(): Promise<PriceAlert[]> {
    try {
      const response = await axios.get(`${this.apiUrl}/price-alerts`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch price alerts:', error);
      throw error;
    }
  }

  /**
   * Delete a price alert
   */
  async deletePriceAlert(alertId: string): Promise<void> {
    try {
      await axios.delete(`${this.apiUrl}/price-alerts/${alertId}`);
      this.priceAlerts.delete(alertId);
    } catch (error) {
      console.error('Failed to delete price alert:', error);
      throw error;
    }
  }

  /**
   * Get price history for an item
   */
  async getPriceHistory(itemId: string, platform: string, days: number = 30): Promise<PriceHistory> {
    try {
      const response = await axios.get(`${this.apiUrl}/price-history`, {
        params: { itemId, platform, days },
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch price history:', error);
      throw error;
    }
  }

  /**
   * Subscribe to price update notifications
   */
  subscribe(callback: (alert: PriceAlert) => void): () => void {
    this.notificationListeners.add(callback);

    // Return unsubscribe function
    return () => {
      this.notificationListeners.delete(callback);
    };
  }

  /**
   * Handle incoming price updates from WebSocket
   */
  private handlePriceUpdate(data: any): void {
    const { alertId, itemId, newPrice, platform } = data;

    const alert = this.priceAlerts.get(alertId);
    if (alert) {
      alert.currentPrice = newPrice;

      // Notify all listeners
      this.notificationListeners.forEach((listener) => {
        listener(alert);
      });

      // Show browser notification if price target is reached
      if (newPrice <= alert.targetPrice) {
        this.showNotification(alert);
      }
    }
  }

  /**
   * Show browser notification
   */
  private showNotification(alert: PriceAlert): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`Price Drop Alert! 🎉`, {
        body: `${alert.itemName} is now ₹${alert.currentPrice} on ${alert.platform}. Target: ₹${alert.targetPrice}`,
        icon: '📉',
      });
    }
  }

  /**
   * Request notification permission
   */
  async requestNotificationPermission(): Promise<boolean> {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        return true;
      }

      if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
      }
    }

    return false;
  }

  /**
   * Update notification preferences
   */
  async updateNotificationPreferences(preferences: NotificationPreference): Promise<void> {
    try {
      await axios.put(`${this.apiUrl}/notification-preferences`, preferences);
    } catch (error) {
      console.error('Failed to update notification preferences:', error);
      throw error;
    }
  }

  /**
   * Get notification preferences
   */
  async getNotificationPreferences(): Promise<NotificationPreference> {
    try {
      const response = await axios.get(`${this.apiUrl}/notification-preferences`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch notification preferences:', error);
      throw error;
    }
  }

  /**
   * Cleanup WebSocket connection
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const priceTrackingService = new PriceTrackingService();
