// The demo product: "Parcelly", a small store. Every vendor receives the
// exact same event and payload so the comparison stays fair.

export type DemoOrder = {
  orderId: string;
  customerName: string;
  item: string;
  carrier: string;
  trackingNumber: string;
  trackingUrl: string;
  estimatedDelivery: string;
  shippingAddress: string;
};

export const DEMO_EVENT = 'order-shipped';

export function buildDemoOrder(subscriberId: string): DemoOrder {
  // Derive a stable, fake order number from the subscriber ID.
  const suffix = subscriberId.replace(/[^a-z0-9]/gi, '').slice(-4).toUpperCase();

  return {
    orderId: `PRC-${suffix}`,
    customerName: 'Sam',
    item: 'Trailhead 28L backpack',
    carrier: 'DHL Express',
    trackingNumber: `DHL${suffix}0042`,
    trackingUrl: 'https://example.com/track',
    estimatedDelivery: 'Thursday, 2 to 4 pm',
    shippingAddress: '14 Admiralty Way, Lekki, Lagos',
  };
}
