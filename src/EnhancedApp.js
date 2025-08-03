import React, { useEffect } from "react";
import { useMachine } from "@xstate/react";
import { enhancedShoppingMachine } from "./machines/enhancedStateMachine";
import { usStates } from "./usStates";
import { loadStateFromStorage, clearSavedState, hasSavedState } from "./utils/persistence";
import DemoSwitcher from "./DemoSwitcher";
import "./App.css";

const LoadingSpinner = () => (
  <div className="loading-spinner">
    <div className="spinner"></div>
    <p>Processing...</p>
  </div>
);

const ErrorDisplay = ({ error, onRetry, onReset }) => (
  <div className="error-display">
    <h3>⚠️ Error</h3>
    <p>{error}</p>
    <div>
      <button onClick={onRetry}>Retry</button>
      <button onClick={onReset}>Reset</button>
    </div>
  </div>
);

const ProductSelection = ({ products, selectedItems, onAddItem, onRemoveItem, onProceed, orderTotal }) => (
  <div className="product-selection">
    <h3>Available Products</h3>
    <div className="products-grid">
      {products.map((product) => (
        <div key={product.id} className="product-card">
          <h4>{product.name}</h4>
          <p>${product.price}</p>
          <p>Available: {product.available ? "Yes" : "No"}</p>
          <button 
            onClick={() => onAddItem(product)}
            disabled={!product.available}
          >
            Add to Cart
          </button>
        </div>
      ))}
    </div>
    
    <h3>Shopping Cart</h3>
    {selectedItems.length === 0 ? (
      <p>Your cart is empty</p>
    ) : (
      <div className="cart-items">
        {selectedItems.map((item) => (
          <div key={item.id} className="cart-item">
            <span>{item.name} x{item.quantity || 1}</span>
            <span>${(parseFloat(item.price) * (item.quantity || 1)).toFixed(2)}</span>
            <button onClick={() => onRemoveItem(item.id)}>Remove</button>
          </div>
        ))}
        <div className="cart-total">
          <strong>Total: ${orderTotal.toFixed(2)}</strong>
        </div>
        <button onClick={onProceed} className="proceed-button">
          Proceed to Checkout
        </button>
      </div>
    )}
  </div>
);

const StateDebugger = ({ state, context }) => (
  <div className="state-debugger">
    <h4>Debug Info</h4>
    <p><strong>Current State:</strong> {JSON.stringify(state.value)}</p>
    <p><strong>Loading:</strong> {context.isLoading ? "Yes" : "No"}</p>
    <p><strong>Items in Cart:</strong> {context.selectedItems.length}</p>
    <p><strong>Order Total:</strong> ${context.orderTotal.toFixed(2)}</p>
    {context.error && <p><strong>Error:</strong> {context.error}</p>}
  </div>
);

function EnhancedApp() {
  const [state, send] = useMachine(enhancedShoppingMachine);
  const { context } = state;

  // Check for saved state on component mount
  useEffect(() => {
    if (hasSavedState()) {
      const savedState = loadStateFromStorage();
      if (savedState && window.confirm("Resume from where you left off?")) {
        // Note: In a real app, you'd want to restore the machine state properly
        // This is a simplified demonstration
        console.log("Would restore state:", savedState);
      } else {
        clearSavedState();
      }
    }
  }, []);

  const parseFormData = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    return Object.fromEntries(formData.entries());
  };

  const handleAddItem = (item) => {
    send({ type: "ADD_ITEM", item });
  };

  const handleRemoveItem = (itemId) => {
    send({ type: "REMOVE_ITEM", itemId });
  };

  const handleShippingSubmit = (e) => {
    const shippingData = parseFormData(e);
    send({ type: "SUBMIT_SHIPPING", shippingData });
  };

  const handlePaymentSubmit = (e) => {
    const creditCardData = parseFormData(e);
    send({ type: "SUBMIT_PAYMENT", creditCardData });
  };

  const handleBillingSubmit = (e) => {
    const billingData = parseFormData(e);
    send({ type: "SUBMIT_BILLING", billingData });
  };

  return (
    <div className="App">
      <DemoSwitcher />
      <header className="App-header">
        <h1>Enhanced XState Shopping Demo</h1>
        <p>Features: localStorage persistence, async operations, parent/child machines</p>
        
        {/* Loading overlay */}
        {context.isLoading && <LoadingSpinner />}

        {/* Error State */}
        {state.matches("errorState") && (
          <ErrorDisplay
            error={context.error}
            onRetry={() => send({ type: "RETRY" })}
            onReset={() => send({ type: "RESET" })}
          />
        )}

        {/* Product Selection */}
        {state.matches("productSelection") && (
          <ProductSelection
            products={context.products}
            selectedItems={context.selectedItems}
            onAddItem={handleAddItem}
            onRemoveItem={handleRemoveItem}
            onProceed={() => send({ type: "PROCEED_TO_SHIPPING" })}
            orderTotal={context.orderTotal}
          />
        )}

        {/* Shipping Address */}
        {(state.matches("shippingAddress") || state.matches("validatingShipping")) && (
          <div className="shipping-form">
            <h3>Shipping Address</h3>
            {context.error && <div className="error-message">{context.error}</div>}
            <form onSubmit={handleShippingSubmit}>
              <div>
                <label htmlFor="email">Email</label>
                <input id="email" name="email" type="email" required />
              </div>
              <div>
                <label htmlFor="streetAddress1">Street Address 1</label>
                <input id="streetAddress1" name="streetAddress1" type="text" required />
              </div>
              <div>
                <label htmlFor="streetAddress2">Street Address 2</label>
                <input id="streetAddress2" name="streetAddress2" type="text" />
              </div>
              <div>
                <label htmlFor="city">City</label>
                <input id="city" name="city" type="text" required />
              </div>
              <div>
                <label htmlFor="state">State</label>
                <select id="state" name="state" required>
                  <option value="">Select a state</option>
                  {usStates.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="zip">Zip Code</label>
                <input id="zip" name="zip" type="text" required />
              </div>
              <div>
                <button type="submit" disabled={context.isLoading}>
                  {context.isLoading ? "Validating..." : "Continue to Payment"}
                </button>
                <button type="button" onClick={() => send({ type: "BACK_TO_CART" })}>
                  Back to Cart
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Credit Card Details */}
        {state.matches("creditCardDetails") && (
          <div className="payment-form">
            <h3>Payment Information</h3>
            <form onSubmit={handlePaymentSubmit}>
              <div>
                <label htmlFor="cardNumber">Card Number</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9\s]{13,19}"
                  autoComplete="cc-number"
                  placeholder="1234 5678 9012 3456"
                  maxLength="19"
                  name="cardNumber"
                  id="cardNumber"
                  required
                />
              </div>
              <div>
                <label htmlFor="cardHolder">Card Holder Name</label>
                <input type="text" autoComplete="name" name="cardHolder" id="cardHolder" required />
              </div>
              <div>
                <label htmlFor="expirationDate">Expiration Date</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="(0[1-9]|1[0-2])\/([0-9]{2})"
                  autoComplete="cc-exp"
                  placeholder="MM/YY"
                  maxLength="5"
                  name="expirationDate"
                  id="expirationDate"
                  required
                />
              </div>
              <div>
                <label htmlFor="cvv">CVV</label>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="cc-csc"
                  maxLength="4"
                  name="cvv"
                  id="cvv"
                  required
                />
              </div>
              <div>
                <button type="submit">Continue to Billing</button>
                <button type="button" onClick={() => send({ type: "BACK_TO_SHIPPING" })}>
                  Back to Shipping
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Billing Address */}
        {state.matches("billingAddress") && (
          <div className="billing-form">
            <h3>Billing Address</h3>
            <form onSubmit={handleBillingSubmit}>
              <div>
                <label htmlFor="sameAsShipping">
                  <input type="checkbox" id="sameAsShipping" name="sameAsShipping" />
                  Same as shipping address
                </label>
              </div>
              <div>
                <button type="submit">Review Order</button>
                <button type="button" onClick={() => send({ type: "BACK_TO_PAYMENT" })}>
                  Back to Payment
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Order Review */}
        {state.matches("orderReview") && (
          <div className="order-review">
            <h3>Order Review</h3>
            <div className="review-section">
              <h4>Items ({context.selectedItems.length})</h4>
              {context.selectedItems.map((item, index) => (
                <div key={index} className="review-item">
                  {item.name} x{item.quantity || 1}: ${(parseFloat(item.price) * (item.quantity || 1)).toFixed(2)}
                </div>
              ))}
              <div className="review-total">
                <strong>Total: ${context.orderTotal.toFixed(2)}</strong>
              </div>
            </div>

            {context.validatedShipping && (
              <div className="review-section">
                <h4>Shipping Address</h4>
                <p>{context.validatedShipping.normalizedAddress.streetAddress1}</p>
                <p>{context.validatedShipping.normalizedAddress.city}, {context.validatedShipping.normalizedAddress.state} {context.validatedShipping.normalizedAddress.zip}</p>
                <p>Estimated Delivery: {new Date(context.validatedShipping.estimatedDelivery).toLocaleDateString()}</p>
                <button onClick={() => send({ type: "EDIT_SHIPPING" })}>Edit</button>
              </div>
            )}

            <div className="review-actions">
              <button onClick={() => send({ type: "SUBMIT_ORDER" })} className="submit-order-button">
                Place Order
              </button>
            </div>
          </div>
        )}

        {/* Payment Failed */}
        {state.matches("paymentFailed") && (
          <div className="payment-failed">
            <h3>Payment Failed</h3>
            <p>{context.error}</p>
            <div>
              <button onClick={() => send({ type: "RETRY_PAYMENT" })}>Retry Payment</button>
              <button onClick={() => send({ type: "EDIT_PAYMENT" })}>Edit Payment Info</button>
              <button onClick={() => send({ type: "CANCEL_ORDER" })}>Cancel Order</button>
            </div>
          </div>
        )}

        {/* Fulfillment Failed */}
        {state.matches("fulfillmentFailed") && (
          <div className="fulfillment-failed">
            <h3>Order Processing Failed</h3>
            <p>{context.error}</p>
            <div>
              <button onClick={() => send({ type: "RETRY_FULFILLMENT" })}>Retry</button>
              <button onClick={() => send({ type: "CONTACT_SUPPORT" })}>Contact Support</button>
            </div>
          </div>
        )}

        {/* Order Complete */}
        {state.matches("orderComplete") && (
          <div className="order-complete">
            <h3>🎉 Order Complete!</h3>
            {context.orderResult && (
              <div>
                <p><strong>Order ID:</strong> {context.orderResult.order.id}</p>
                <p><strong>Total:</strong> ${context.orderTotal.toFixed(2)}</p>
                <p><strong>Status:</strong> {context.orderResult.order.status}</p>
                {context.orderResult.confirmation.emailSent && (
                  <p><strong>Confirmation:</strong> Email sent to {context.orderResult.confirmation.sentTo}</p>
                )}
              </div>
            )}
            <button onClick={() => send({ type: "START_NEW_ORDER" })}>
              Start New Order
            </button>
            <p><small>Automatically starting new order in 10 seconds...</small></p>
          </div>
        )}

        {/* Debug Information */}
        <StateDebugger state={state} context={context} />

        {/* Clear Storage Button */}
        <div className="storage-controls">
          <button onClick={clearSavedState}>Clear Saved State</button>
        </div>
      </header>
    </div>
  );
}

export default EnhancedApp;
