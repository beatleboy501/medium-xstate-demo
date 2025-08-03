import { createMachine, assign, fromPromise } from "xstate";

const setNull = () => null;
const getRandomPrice = () => (Math.random() * 100).toFixed(2);

export const fetchMachine = createMachine(
  {
    id: "Shopping Cart Checkout",
    initial: "CALL SERVICE",
    context: {
      data: null,
      error: null,
    },
    states: {
      "CALL SERVICE": {
        invoke: {
          src: fromPromise(async () => {
            return new Promise((resolve) => {
              setTimeout(() => {
                resolve({
                  output: [
                    {
                      name: "Duct Tape",
                      price: getRandomPrice(),
                    },
                    {
                      name: "Rope",
                      price: getRandomPrice(),
                    },
                  ],
                });
              }, 500);
            });
          }),
          onDone: {
            target: "TRANSIENT PAGE",
            actions: assign({
              data: ({ event: { output } }) => output,
              error: setNull,
            }),
          },
          onError: {
            target: "ERROR PAGE",
            actions: assign({
              data: setNull,
              error: ({ event: { error } }) => error,
            }),
          },
        },
      },
      "TRANSIENT PAGE": {
        after: {
          500: {
            target: "CART MAIN PAGE",
            actions: ["buildOutputsList"],
          },
        },
      },
      "CART MAIN PAGE": {
        on: {
          SHIPPING: {
            target: "SHIPPING ADDRESS",
          },
        },
      },
      "SHIPPING ADDRESS": {
        on: {
          "CREDIT CARD": {
            target: "CREDIT CARD DETAILS",
            actions: assign({
              data: ({
                context,
                event: {
                  context: { shippingData },
                },
              }) => ({
                ...context.data,
                shippingData,
              }),
            }),
          },
          "CART (back)": {
            target: "CART MAIN PAGE",
          },
        },
      },
      "CREDIT CARD DETAILS": {
        on: {
          BILLING: {
            target: "BILLING ADDRESS",
            actions: assign({
              data: ({
                context,
                event: {
                  context: { creditCardData },
                },
              }) => ({
                ...context.data,
                creditCardData,
              }),
            }),
          },
          "PAYMENT (back)": {
            target: "SHIPPING ADDRESS",
          },
        },
      },
      "BILLING ADDRESS": {
        on: {
          "REVIEW ORDER": {
            target: "ORDER REVIEW",
            actions: assign({
              data: ({
                context,
                event: {
                  context: { billingData },
                },
              }) => ({
                ...context.data,
                billingData,
              }),
            }),
          },
          "CREDIT CARD (back)": {
            target: "CREDIT CARD DETAILS",
          },
        },
      },
      "ORDER REVIEW": {
        on: {
          SUBMIT_ORDER: {
            target: "SUCCESS PAGE",
            actions: ["chargePaymentMethod", "processOrder"],
          },
          SHIPPING: {
            target: "SHIPPING ADDRESS",
          },
          BILLING: {
            target: "BILLING ADDRESS",
          },
          PAYMENT: {
            target: "CREDIT CARD DETAILS",
          },
          ERROR: {
            target: "ERROR PAGE",
          },
        },
      },
      "SUCCESS PAGE": {
        after: {
          5000: {
            target: "CALL SERVICE",
          },
        },
      },
      "ERROR PAGE": {
        on: {
          SUPPORT: "SUPPORT PAGE",
          TRY_AGAIN: {
            target: "CALL SERVICE",
          },
        },
      },
      "SUPPORT PAGE": {
        type: "final",
      },
    },
  },
  {
    actions: {
      buildOutputsList: ({ context }) => {
        console.log("Building output list", context);
      },
      chargePaymentMethod: ({ context }) => {
        console.log("Charging payment method", context);
      },
      processOrder: ({ context }) => {
        console.log("Processing order", context);
      },
    },
  }
);
