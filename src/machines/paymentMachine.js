import { createMachine, assign, fromPromise } from "xstate";
import { processPayment } from "../services/apiService";

/**
 * Child machine for handling payment processing
 * This demonstrates a complex async workflow with multiple steps
 */
export const paymentMachine = createMachine({
  id: "paymentProcessor",
  initial: "idle",
  context: {
    paymentData: null,
    orderTotal: 0,
    transactionResult: null,
    error: null,
    retryCount: 0,
  },
  states: {
    idle: {
      on: {
        PROCESS_PAYMENT: {
          target: "validating",
          actions: assign({
            paymentData: ({ event }) => event.paymentData,
            orderTotal: ({ event }) => event.orderTotal,
            error: () => null,
          }),
        },
      },
    },
    validating: {
      after: {
        500: {
          target: "processing",
          actions: assign({
            error: () => null,
          }),
        },
      },
    },
    processing: {
      invoke: {
        src: fromPromise(async ({ input }) => {
          return await processPayment(input.paymentData, input.orderTotal);
        }),
        input: ({ context }) => ({
          paymentData: context.paymentData,
          orderTotal: context.orderTotal,
        }),
        onDone: {
          target: "success",
          actions: assign({
            transactionResult: ({ event }) => event.output,
            error: () => null,
          }),
        },
        onError: {
          target: "failed",
          actions: assign({
            error: ({ event }) => event.error.message,
            retryCount: ({ context }) => context.retryCount + 1,
          }),
        },
      },
    },
    success: {
      type: "final",
      data: ({ context }) => ({
        success: true,
        transactionResult: context.transactionResult,
      }),
    },
    failed: {
      on: {
        RETRY: [
          {
            guard: ({ context }) => context.retryCount < 3,
            target: "processing",
          },
          {
            target: "maxRetriesReached",
          },
        ],
        CANCEL: {
          target: "cancelled",
        },
      },
    },
    maxRetriesReached: {
      type: "final",
      data: ({ context }) => ({
        success: false,
        error: "Maximum retry attempts reached",
        originalError: context.error,
      }),
    },
    cancelled: {
      type: "final",
      data: () => ({
        success: false,
        error: "Payment cancelled by user",
      }),
    },
  },
});
