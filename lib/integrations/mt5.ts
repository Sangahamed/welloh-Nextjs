import { logger } from "@/lib/logger";

/**
 * MT5Bridge Handler
 * Pattern: REST Bridge for MetaTrader 5 Terminal
 */
export class MT5Service {
  private static bridgeUrl = process.env.MT5_BRIDGE_URL;
  private static bridgeToken = process.env.MT5_BRIDGE_TOKEN;

  /**
   * Send an order to MT5 Bridge
   */
  static async placeOrder(params: {
    symbol: string;
    action: 'BUY' | 'SELL';
    volume: number;
    type: 'MARKET' | 'LIMIT';
    price?: number;
  }) {
    if (!this.bridgeUrl) {
      logger.warn("MT5 Bridge not configured. Operating in SIMULATED mode.");
      return { success: true, simulated: true, executionId: `sim_${Date.now()}` };
    }

    try {
      const response = await fetch(`${this.bridgeUrl}/order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.bridgeToken}`
        },
        body: JSON.stringify(params)
      });

      if (!response.ok) {
        throw new Error(`MT5 Bridge responded with ${response.status}`);
      }

      return await response.json();
    } catch (e) {
      logger.error({ e, params }, "MT5 Order execution failed");
      throw e;
    }
  }

  /**
   * Fetch real-time account data from MT5
   */
  static async getAccountSummary() {
    if (!this.bridgeUrl) return { balance: 0, equity: 0, margin: 0, simulated: true };

    try {
      const response = await fetch(`${this.bridgeUrl}/account`, {
        headers: { 'Authorization': `Bearer ${this.bridgeToken}` }
      });
      return await response.json();
    } catch (e) {
      logger.error({ e }, "Failed to fetch MT5 account summary");
      return null;
    }
  }

  /**
   * Fetch open positions
   */
  static async getPositions() {
    if (!this.bridgeUrl) return [];

    try {
      const response = await fetch(`${this.bridgeUrl}/positions`, {
        headers: { 'Authorization': `Bearer ${this.bridgeToken}` }
      });
      return await response.json();
    } catch (e) {
      logger.error({ e }, "Failed to fetch MT5 positions");
      return [];
    }
  }
}
