import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: { cartIsVisible: false, notification: null },
  reducers: {
    toggle(state) {
      state.cartIsVisible = !state.cartIsVisible;
    },
    showNotification(state, action) {
      state.notification = {
        status: action.payload.status,
        title: action.payload.title,
        message: action.payload.message,
      };
    },
  },
  extraReducers: (builder) => {
    // Note: We use the string action types because importing sendCartData here
    // would cause a circular dependency (cart-slice imports uiActions).
    builder
      .addCase('cart/sendCartData/pending', (state) => {
        state.notification = {
          status: 'pending',
          title: 'Sending...',
          message: 'Sending cart data!',
        };
      })
      .addCase('cart/sendCartData/fulfilled', (state) => {
        state.notification = {
          status: 'success',
          title: 'Success!',
          message: 'Sent cart data successfully!',
        };
      })
      .addCase('cart/sendCartData/rejected', (state, action) => {
        state.notification = {
          status: 'error',
          title: 'Error!',
          message: action.payload || 'Sending cart data failed!',
        };
      });
  },
});

export const uiActions = uiSlice.actions;

export default uiSlice;
