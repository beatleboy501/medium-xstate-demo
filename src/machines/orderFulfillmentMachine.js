import { createMachine, assign, fromPromise } from "xstate";
import { saveOrder, sendOrderConfirmation, updateInventory } from "../services/apiService";

/**
 * Child machine for handling order fulfillment
 * This runs after successful payment and handles the backend processes
 */
export const orderFulfillmentMachine = createMachine({
  id: "orderFulfillment",
  initial: "idle",
  context: {
    orderData: null,
    savedOrder: null,
    confirmationResult: null,
    inventoryResult: null,
    error: null,
  },
  states: {
    idle: {
      on: {
        FULFILL_ORDER: {
          target: "savingOrder",
          actions: assign({
            orderData: ({ event }) => event.orderData,
            error: () => null,
          }),
        },
      },
    },
    savingOrder: {
      invoke: {
        src: fromPromise(async ({ input }) => {
          return await saveOrder(input.orderData);
        }),
        input: ({ context }) => ({
          orderData: context.orderData,
        }),
        onDone: {
          target: "sendingConfirmation",
          actions: assign({
            savedOrder: ({ event }) => event.output,
          }),
        },
        onError: {
          target: "failed",
          actions: assign({
            error: ({ event }) => `Failed to save order: ${event.error.message}`,
          }),
        },
      },
    },
    sendingConfirmation: {
      invoke: {
        src: fromPromise(async ({ input }) => {
          const customerEmail = input.orderData.shippingData?.email || 'customer@example.com';
          return await sendOrderConfirmation(input.savedOrder, customerEmail);
        }),
        input: ({ context }) => ({
          orderData: context.orderData,
          savedOrder: context.savedOrder,
        }),
        onDone: {
          target: "updatingInventory",
          actions: assign({
            confirmationResult: ({ event }) => event.output,
          }),
        },
        onError: {
          // Continue even if email fails - order is still valid
          target: "updatingInventory",
          actions: assign({
            confirmationResult: () => ({ emailSent: false, error: "Email failed" }),
          }),
        },
      },
    },
    updatingInventory: {
      invoke: {
        src: fromPromise(async ({ input }) => {
          return await updateInventory(input.orderData.items || []);
        }),
        input: ({ context }) => ({
          orderData: context.orderData,
        }),
        onDone: {
          target: "completed",
          actions: assign({
            inventoryResult: ({ event }) => event.output,
          }),
        },
        onError: {
          // Continue even if inventory update fails - order is still valid
          target: "completed",
          actions: assign({
            inventoryResult: () => ({ updated: false, error: "Inventory update failed" }),
          }),
        },
      },
    },
    completed: {
      type: "final",
      data: ({ context }) => ({
        success: true,
        order: context.savedOrder,
        confirmation: context.confirmationResult,
        inventory: context.inventoryResult,
      }),
    },
    failed: {
      type: "final",
      data: ({ context }) => ({
        success: false,
        error: context.error,
      }),
    },
  },
});
