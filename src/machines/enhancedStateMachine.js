import { createMachine, assign, fromPromise, sendParent } from "xstate";
import { fetchProducts, validateShippingAddress } from "../services/apiService";
import { paymentMachine } from "./paymentMachine";
import { orderFulfillmentMachine } from "./orderFulfillmentMachine";
import { saveStateToStorage } from "../utils/persistence";

/**
 * Enhanced main shopping cart machine with:
 * - localStorage persistence after every state change
 * - Async operations for data fetching and validation
 * - Parent/child machine relationships
 * - Complex error handling and retry logic
 */
export const enhancedShoppingMachine = createMachine(
  {
    id: "enhancedShoppingCart",
    initial: "initializing",
    context: {
      products: [],
      selectedItems: [],
      shippingData: null,
      creditCardData: null,
      billingData: null,
      validatedShipping: null,
      paymentResult: null,
      orderResult: null,
      error: null,
      isLoading: false,
      orderTotal: 0,
    },
    states: {
      initializing: {
        entry: "persistState",
        always: {
          target: "loadingProducts",
        },
      },
      loadingProducts: {
        entry: ["setLoading", "persistState"],
        invoke: {
          src: fromPromise(async () => {
            return await fetchProducts();
          }),
          onDone: {
            target: "productSelection",
            actions: [
              assign({
                products: ({ event }) => event.output.products,
                selectedItems: ({ event }) => event.output.products.slice(0, 2), // Auto-select first 2 items
                isLoading: () => false,
                error: () => null,
              }),
              "calculateTotal",
              "persistState",
            ],
          },
          onError: {
            target: "errorState",
            actions: [
              assign({
                error: ({ event }) => `Failed to load products: ${event.error.message}`,
                isLoading: () => false,
              }),
              "persistState",
            ],
          },
        },
      },
      productSelection: {
        entry: "persistState",
        on: {
          ADD_ITEM: {
            actions: [
              assign({
                selectedItems: ({ context, event }) => {
                  const existing = context.selectedItems.find(item => item.id === event.item.id);
                  if (existing) {
                    return context.selectedItems.map(item =>
                      item.id === event.item.id
                        ? { ...item, quantity: (item.quantity || 1) + 1 }
                        : item
                    );
                  }
                  return [...context.selectedItems, { ...event.item, quantity: 1 }];
                },
              }),
              "calculateTotal",
              "persistState",
            ],
          },
          REMOVE_ITEM: {
            actions: [
              assign({
                selectedItems: ({ context, event }) =>
                  context.selectedItems.filter(item => item.id !== event.itemId),
              }),
              "calculateTotal",
              "persistState",
            ],
          },
          PROCEED_TO_SHIPPING: {
            target: "shippingAddress",
          },
        },
      },
      shippingAddress: {
        entry: "persistState",
        on: {
          SUBMIT_SHIPPING: {
            target: "validatingShipping",
            actions: [
              assign({
                shippingData: ({ event }) => event.shippingData,
              }),
              "persistState",
            ],
          },
          BACK_TO_CART: {
            target: "productSelection",
          },
        },
      },
      validatingShipping: {
        entry: ["setLoading", "persistState"],
        invoke: {
          src: fromPromise(async ({ input }) => {
            return await validateShippingAddress(input.shippingData);
          }),
          input: ({ context }) => ({
            shippingData: context.shippingData,
          }),
          onDone: {
            target: "creditCardDetails",
            actions: [
              assign({
                validatedShipping: ({ event }) => event.output,
                isLoading: () => false,
                error: () => null,
              }),
              "persistState",
            ],
          },
          onError: {
            target: "shippingAddress",
            actions: [
              assign({
                error: ({ event }) => event.error.message,
                isLoading: () => false,
              }),
              "persistState",
            ],
          },
        },
      },
      creditCardDetails: {
        entry: "persistState",
        on: {
          SUBMIT_PAYMENT: {
            target: "billingAddress",
            actions: [
              assign({
                creditCardData: ({ event }) => event.creditCardData,
              }),
              "persistState",
            ],
          },
          BACK_TO_SHIPPING: {
            target: "shippingAddress",
          },
        },
      },
      billingAddress: {
        entry: "persistState",
        on: {
          SUBMIT_BILLING: {
            target: "orderReview",
            actions: [
              assign({
                billingData: ({ event }) => event.billingData,
              }),
              "persistState",
            ],
          },
          BACK_TO_PAYMENT: {
            target: "creditCardDetails",
          },
        },
      },
      orderReview: {
        entry: "persistState",
        on: {
          SUBMIT_ORDER: {
            target: "processingPayment",
          },
          EDIT_SHIPPING: {
            target: "shippingAddress",
          },
          EDIT_PAYMENT: {
            target: "creditCardDetails",
          },
          EDIT_BILLING: {
            target: "billingAddress",
          },
        },
      },
      processingPayment: {
        entry: ["setLoading", "persistState"],
        invoke: {
          src: paymentMachine,
          input: ({ context }) => ({
            paymentData: context.creditCardData,
            orderTotal: context.orderTotal,
          }),
          onDone: [
            {
              guard: ({ event }) => event.output.success,
              target: "fulfillingOrder",
              actions: [
                assign({
                  paymentResult: ({ event }) => event.output,
                  isLoading: () => false,
                  error: () => null,
                }),
                "persistState",
              ],
            },
            {
              target: "paymentFailed",
              actions: [
                assign({
                  error: ({ event }) => event.output.error,
                  isLoading: () => false,
                }),
                "persistState",
              ],
            },
          ],
        },
      },
      paymentFailed: {
        entry: "persistState",
        on: {
          RETRY_PAYMENT: {
            target: "processingPayment",
          },
          EDIT_PAYMENT: {
            target: "creditCardDetails",
          },
          CANCEL_ORDER: {
            target: "productSelection",
            actions: [
              assign({
                error: () => null,
                paymentResult: () => null,
              }),
              "persistState",
            ],
          },
        },
      },
      fulfillingOrder: {
        entry: ["setLoading", "persistState"],
        invoke: {
          src: orderFulfillmentMachine,
          input: ({ context }) => ({
            orderData: {
              items: context.selectedItems,
              shippingData: context.validatedShipping,
              billingData: context.billingData,
              paymentResult: context.paymentResult,
              total: context.orderTotal,
            },
          }),
          onDone: {
            target: "orderComplete",
            actions: [
              assign({
                orderResult: ({ event }) => event.output,
                isLoading: () => false,
              }),
              "persistState",
            ],
          },
          onError: {
            target: "fulfillmentFailed",
            actions: [
              assign({
                error: ({ event }) => `Order fulfillment failed: ${event.error.message}`,
                isLoading: () => false,
              }),
              "persistState",
            ],
          },
        },
      },
      fulfillmentFailed: {
        entry: "persistState",
        on: {
          RETRY_FULFILLMENT: {
            target: "fulfillingOrder",
          },
          CONTACT_SUPPORT: {
            target: "supportContact",
          },
        },
      },
      orderComplete: {
        entry: "persistState",
        after: {
          10000: {
            target: "productSelection",
            actions: [
              assign({
                // Reset for new order
                selectedItems: [],
                shippingData: null,
                creditCardData: null,
                billingData: null,
                validatedShipping: null,
                paymentResult: null,
                orderResult: null,
                orderTotal: 0,
              }),
              "persistState",
            ],
          },
        },
        on: {
          START_NEW_ORDER: {
            target: "productSelection",
            actions: [
              assign({
                // Reset for new order
                selectedItems: [],
                shippingData: null,
                creditCardData: null,
                billingData: null,
                validatedShipping: null,
                paymentResult: null,
                orderResult: null,
                orderTotal: 0,
              }),
              "persistState",
            ],
          },
        },
      },
      errorState: {
        entry: "persistState",
        on: {
          RETRY: {
            target: "loadingProducts",
          },
          RESET: {
            target: "initializing",
            actions: [
              assign({
                error: () => null,
                products: () => [],
                selectedItems: () => [],
              }),
              "persistState",
            ],
          },
        },
      },
      supportContact: {
        entry: "persistState",
        type: "final",
      },
    },
  },
  {
    actions: {
      setLoading: assign({
        isLoading: () => true,
      }),
      calculateTotal: assign({
        orderTotal: ({ context }) => {
          return context.selectedItems.reduce((total, item) => {
            return total + (parseFloat(item.price) * (item.quantity || 1));
          }, 0);
        },
      }),
      persistState: ({ context, self }) => {
        // Save state to localStorage after every state change
        saveStateToStorage(self.getSnapshot(), context);
      },
    },
  }
);
