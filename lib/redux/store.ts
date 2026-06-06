import { configureStore } from "@reduxjs/toolkit"
import { auth } from "../api/auth"
import { catalog } from "../api/catalog"
import { customers } from "../api/customers"
import { inventory } from "../api/inventory"
import { payments } from "../api/payments"
import { promotions } from "../api/promotions"
import { registers } from "../api/registers"
import { rewards } from "../api/rewards"
import { settings } from "../api/settings"
import sessionSlice from "./sessionSlice"

export const store = configureStore({
  reducer: {
    [auth.reducerPath]: auth.reducer,
    [catalog.reducerPath]: catalog.reducer,
    [customers.reducerPath]: customers.reducer,
    [inventory.reducerPath]: inventory.reducer,
    [payments.reducerPath]: payments.reducer,
    [promotions.reducerPath]: promotions.reducer,
    [registers.reducerPath]: registers.reducer,
    [rewards.reducerPath]: rewards.reducer,
    [settings.reducerPath]: settings.reducer,
    session: sessionSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat([
      auth.middleware,
      catalog.middleware,
      customers.middleware,
      inventory.middleware,
      payments.middleware,
      promotions.middleware,
      registers.middleware,
      rewards.middleware,
      settings.middleware,
    ]),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
