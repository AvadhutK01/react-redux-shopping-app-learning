import { createSlice } from '@reduxjs/toolkit';

import { uiActions } from './ui-slice';
import axios from 'axios';

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: [],
    totalQuantity: 0,
    changed: false,
  },
  reducers: {
    replaceCart(state, action) {
      state.totalQuantity = action.payload.totalQuantity;
      state.items = action.payload.items;
    },
    addItemToCart(state, action) {
      const newItem = action.payload;
      const existingItem = state.items.find((item) => item.id === newItem.id);
      state.totalQuantity++;
      state.changed = true;
      if (!existingItem) {
        state.items.push({
          id: newItem.id,
          price: newItem.price,
          quantity: 1,
          totalPrice: newItem.price,
          name: newItem.title,
        });
      } else {
        existingItem.quantity++;
        existingItem.totalPrice = existingItem.totalPrice + newItem.price;
      }
    },
    removeItemFromCart(state, action) {
      const id = action.payload;
      const existingItem = state.items.find((item) => item.id === id);
      state.totalQuantity--;
      state.changed = true;
      if (existingItem.quantity === 1) {
        state.items = state.items.filter((item) => item.id !== id);
      } else {
        existingItem.quantity--;
        existingItem.totalPrice = existingItem.totalPrice - existingItem.price;
      }
    },
  },
});

export const fetchCartData = () => {
  return async (dispatch) => {
    const fetchData = async () => {
      const response = await axios.get(
        'https://firestore.googleapis.com/v1/projects/sh-p-f50d3/databases/(default)/documents/cart/cartData'
      );

      if (response.status !== 200) {
        throw new Error('Could not fetch cart data!');
      }

      const data = response.data;
      return data;
    };

    try {
      const cartData = await fetchData();

      // Transform Firestore format back to application format
      const items = cartData.fields.items.arrayValue.values
        ? cartData.fields.items.arrayValue.values.map((item) => ({
          id: item.mapValue.fields.id.stringValue,
          price: parseFloat(item.mapValue.fields.price.doubleValue),
          quantity: parseInt(item.mapValue.fields.quantity.integerValue),
          totalPrice: parseFloat(item.mapValue.fields.totalPrice.doubleValue),
          name: item.mapValue.fields.name.stringValue,
        }))
        : [];

      dispatch(
        cartActions.replaceCart({
          items: items,
          totalQuantity: parseInt(cartData.fields.totalQuantity.integerValue),
        })
      );
    } catch (error) {
      console.error(error);
      dispatch(
        uiActions.showNotification({
          status: 'error',
          title: 'Error!',
          message: 'Fetching cart data failed!',
        })
      );
    }
  };
};

export const sendCartData = (cart) => {
  return async (dispatch) => {
    dispatch(
      uiActions.showNotification({
        status: 'pending',
        title: 'Sending...',
        message: 'Sending cart data!',
      })
    );

    const sendRequest = async () => {
      const response = await axios.patch(
        'https://firestore.googleapis.com/v1/projects/sh-p-f50d3/databases/(default)/documents/cart/cartData',
        {
          fields: {
            items: {
              arrayValue: {
                values: cart.items.map((item) => ({
                  mapValue: {
                    fields: {
                      id: { stringValue: item.id },
                      price: { doubleValue: item.price },
                      quantity: { integerValue: item.quantity.toString() },
                      totalPrice: { doubleValue: item.totalPrice },
                      name: { stringValue: item.name },
                    },
                  },
                })),
              },
            },
            totalQuantity: { integerValue: cart.totalQuantity.toString() },
          },
        }
      );

      if (response.status !== 200) {
        throw new Error('Sending cart data failed.');
      }
    };

    try {
      await sendRequest();

      dispatch(
        uiActions.showNotification({
          status: 'success',
          title: 'Success!',
          message: 'Sent cart data successfully!',
        })
      );
    } catch (error) {
      dispatch(
        uiActions.showNotification({
          status: 'error',
          title: 'Error!',
          message: 'Sending cart data failed!',
        })
      );
    }
  };
};

export const cartActions = cartSlice.actions;

export default cartSlice;
