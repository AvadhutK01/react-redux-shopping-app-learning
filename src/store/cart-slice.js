import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { uiActions } from './ui-slice';

export const sendCartData = createAsyncThunk(
  'cart/sendCartData',
  async (cart, { rejectWithValue }) => {
    try {
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

      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

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

export const cartActions = cartSlice.actions;

export default cartSlice;
