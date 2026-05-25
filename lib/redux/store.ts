import { configureStore } from '@reduxjs/toolkit';
import { auth } from '../api/auth';
import { products } from '../api/products';
// import { settings } from '../api/settings';
import sessionSlice from './sessionSlice';

export const store = configureStore({
  reducer: {
    [auth.reducerPath]: auth.reducer,
    [products.reducerPath]: products.reducer,
    // settings: settings.reducer,
    session: sessionSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat([
      auth.middleware,
      products.middleware,
      // settings.middleware
    ]),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
