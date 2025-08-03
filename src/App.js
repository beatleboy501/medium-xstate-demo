import { useMachine } from "@xstate/react";
import { fetchMachine } from "./StateMachine";
import { usStates } from "./usStates";
import "./App.css";

const toReadable = ([k, v]) => (
  <p>
    {k}: {v}
  </p>
);

function App() {
  const [state, send] = useMachine(fetchMachine);
  
  const parseFormData = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    return data;
  };

  const startOver = () =>
    send({
      type: "CART (back)",
      context: {},
    });
  const goToShipping = () =>
    send({
      type: "SHIPPING",
      context: {},
    });
  const goToPayment = (shippingData) =>
    send({
      type: "CREDIT CARD",
      context: { shippingData },
    });
  const goToBilling = (creditCardData) =>
    send({
      type: "BILLING",
      context: { creditCardData },
    });
  const goToPaymentBack = () =>
    send({
      type: "PAYMENT (back)",
      context: {},
    });
  const goToCreditCardBack = () =>
    send({
      type: "CREDIT CARD (back)",
      context: {},
    });
  const goToReviewOrder = (billingData) =>
    send({
      type: "REVIEW ORDER",
      context: { billingData },
    });

  const goToSubmitOrder = () =>
    send({
      type: "SUBMIT_ORDER",
      context: {},
    });

  const onSubmitShippingAddress = (e) => goToPayment(parseFormData(e));

  const onSubmitcreditCardData = (e) => goToBilling(parseFormData(e));

  const onSubmitBillingAddress = (e) => goToReviewOrder(parseFormData(e));

  return (
    <div className="App">
      <header className="App-header">
        <h2>Current State: {state.value}</h2>

        {state.matches("CALL SERVICE") && (
          <div>
            <h3>Getting Shopping Cart...</h3>
          </div>
        )}

        {state.matches("TRANSIENT PAGE") && (
          <div>
            <h3>Redirecting to Checkout...</h3>
          </div>
        )}

        {state.matches("CART MAIN PAGE") && (
          <div>
            <h3>Items:</h3>
            {state.context.data.output.map(({ name, price }, index) => (
              <p key={`${name}-${price}-${index}`}>
                {name} ${price}
              </p>
            ))}
            <button onClick={goToShipping}>Proceed to Shipping</button>
          </div>
        )}

        {state.matches("SHIPPING ADDRESS") && (
          <div>
            <h3>Shipping Address</h3>
            <form onSubmit={onSubmitShippingAddress}>
              <>
                <label htmlFor="streetAddress1">Street Address 1</label>
                <input
                  id="streetAddress1"
                  name="streetAddress1"
                  type="text"
                  required
                />
              </>
              <>
                <label htmlFor="streetAddress2">Street Address 2</label>
                <input id="streetAddress2" name="streetAddress2" type="text" />
              </>
              <>
                <label htmlFor="city">City</label>
                <input id="city" name="city" type="text" required />
              </>
              <>
                <label htmlFor="state">State</label>
                <select id="state" name="state" required>
                  <option value="">Select a state</option>
                  {usStates.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </>
              <>
                <label htmlFor="zip">Zip</label>
                <input id="zip" name="zip" type="text" required />
              </>
              <>
                <button type="submit">Continue to Payment</button>
                <button type="button" onClick={startOver}>
                  Back to Cart
                </button>
              </>
            </form>
          </div>
        )}

        {state.matches("CREDIT CARD DETAILS") && (
          <div>
            <h3>Credit Card Details</h3>
            <form onSubmit={onSubmitcreditCardData}>
              <>
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
              </>
              <>
                <label htmlFor="cardHolder">Card Holder</label>
                <input
                  type="text"
                  autoComplete="name"
                  name="cardHolder"
                  id="cardHolder"
                  required
                />
              </>
              <>
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
              </>
              <>
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
              </>
              <>
                <button type="submit">Continue to Billing Address</button>
                <button type="button" onClick={goToPaymentBack}>
                  Back to Shipping Address
                </button>
              </>
            </form>
          </div>
        )}

        {state.matches("BILLING ADDRESS") && (
          <div>
            <h3>Billing Address</h3>
            <form onSubmit={onSubmitBillingAddress}>
              <div>
                <label htmlFor="sameAsShipping">Same as Shipping</label>
                <input
                  type="checkbox"
                  id="sameAsShipping"
                  name="sameAsShipping"
                />
              </div>
              <button type="submit">Continue to Review Order</button>
              <button type="button" onClick={goToCreditCardBack}>
                Back
              </button>
            </form>
          </div>
        )}

        {state.matches("ORDER REVIEW") && (
          <div id="orderReview">
            <h3>Order Review</h3>
            <div style={{ textAlign: "left", maxWidth: "400px" }}>
              <h4>Items:</h4>
              {state.context.data.output.map(({ name, price }, index) => (
                <p key={index}>
                  {name}: ${price}
                </p>
              ))}

              <h4>Shipping Address:</h4>
              {Object.entries(state.context.data.shippingData).map(toReadable)}

              <h4>Credit Card Details:</h4>
              {Object.entries(state.context.data.creditCardData).map(
                toReadable
              )}

              <h4>Billing Address:</h4>
              {Object.entries(state.context.data.billingData).map(toReadable)}
            </div>
            <button onClick={goToSubmitOrder}>Submit Order</button>
            <br />
            <button onClick={goToShipping}>Edit Shipping</button>
            <br />
            <button
              onClick={() => goToBilling(state.context.data.creditCardData)}
            >
              Edit Billing
            </button>
          </div>
        )}

        {state.matches("SUCCESS PAGE") && (
          <div>
            <h3>Order Successful</h3>
          </div>
        )}
      </header>
    </div>
  );
}

export default App;
