import { configureStore } from "@reduxjs/toolkit"
import { auth } from "../api/auth"
import { catalog } from "../api/catalog"
import { products } from "../api/products"
import { settings } from "../api/settings"
import sessionSlice from "./sessionSlice"

export const store = configureStore({
  reducer: {
    [auth.reducerPath]: auth.reducer,
    [catalog.reducerPath]: catalog.reducer,
    [products.reducerPath]: products.reducer,
    [settings.reducerPath]: settings.reducer,
    session: sessionSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat([
      auth.middleware,
      catalog.middleware,
      products.middleware,
      settings.middleware,
    ]),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
