/**
 * Mock API service for demonstrating async operations
 * In a real application, these would be actual HTTP requests
 */

// Simulate network delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Mock database for storing orders
let mockDatabase = {
  orders: [],
  customers: [],
  inventory: [
    { id: 1, name: "Duct Tape", price: 12.99, stock: 50 },
    { id: 2, name: "Rope", price: 8.50, stock: 25 },
    { id: 3, name: "Flashlight", price: 24.99, stock: 15 },
    { id: 4, name: "Multi-tool", price: 45.00, stock: 8 },
  ]
};

/**
 * Fetch available products from inventory
 */
export const fetchProducts = async () => {
  await delay(800); // Simulate network delay
  
  // Randomly fail 10% of the time to demonstrate error handling
  if (Math.random() < 0.1) {
    throw new Error('Failed to fetch products from server');
  }
  
  return {
    products: mockDatabase.inventory.map(item => ({
      id: item.id,
      name: item.name,
      price: (item.price + Math.random() * 5 - 2.5).toFixed(2), // Add some price variation
      available: item.stock > 0
    })),
    timestamp: new Date().toISOString()
  };
};

/**
 * Validate shipping address with external service
 */
export const validateShippingAddress = async (shippingData) => {
  await delay(1200);
  
  // Simulate validation failure for certain zip codes
  if (shippingData.zip && shippingData.zip.startsWith('00000')) {
    throw new Error('Invalid shipping address: Zip code not serviceable');
  }
  
  return {
    isValid: true,
    normalizedAddress: {
      ...shippingData,
      streetAddress1: shippingData.streetAddress1?.toUpperCase(),
      city: shippingData.city?.toUpperCase(),
    },
    estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
  };
};

/**
 * Process payment with payment gateway
 */
export const processPayment = async (paymentData, orderTotal) => {
  await delay(2000);
  
  // Simulate payment failure for certain card numbers
  if (paymentData.cardNumber && paymentData.cardNumber.includes('0000')) {
    throw new Error('Payment declined: Invalid card number');
  }
  
  return {
    transactionId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    amount: orderTotal,
    status: 'completed',
    timestamp: new Date().toISOString(),
  };
};

/**
 * Save order to remote database
 */
export const saveOrder = async (orderData) => {
  await delay(1000);
  
  const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const order = {
    id: orderId,
    ...orderData,
    status: 'confirmed',
    createdAt: new Date().toISOString(),
  };
  
  mockDatabase.orders.push(order);
  
  return order;
};

/**
 * Send order confirmation email (mock)
 */
export const sendOrderConfirmation = async (orderData, customerEmail) => {
  await delay(500);
  
  return {
    emailSent: true,
    confirmationNumber: `conf_${Date.now()}`,
    sentTo: customerEmail,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Update inventory after order
 */
export const updateInventory = async (items) => {
  await delay(300);
  
  items.forEach(item => {
    const inventoryItem = mockDatabase.inventory.find(inv => inv.id === item.id);
    if (inventoryItem) {
      inventoryItem.stock = Math.max(0, inventoryItem.stock - (item.quantity || 1));
    }
  });
  
  return {
    updated: true,
    timestamp: new Date().toISOString(),
  };
};
