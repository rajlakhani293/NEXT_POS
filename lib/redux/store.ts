import { configureStore } from "@reduxjs/toolkit"
import { accounting } from "../api/accounting"
import { auth } from "../api/auth"
import { catalog } from "../api/catalog"
import { customers } from "../api/customers"
import { expenses } from "../api/expenses"
import { inventory } from "../api/inventory"
import { media } from "../api/media"
import { notifications } from "../api/notifications"
import { payments } from "../api/payments"
import { promotions } from "../api/promotions"
import { purchases } from "../api/purchases"
import { registers } from "../api/registers"
import { reports } from "../api/reports"
import { rewards } from "../api/rewards"
import { settings } from "../api/settings"
import sessionSlice from "./sessionSlice"

export const store = configureStore({
  reducer: {
    [accounting.reducerPath]: accounting.reducer,
    [auth.reducerPath]: auth.reducer,
    [catalog.reducerPath]: catalog.reducer,
    [customers.reducerPath]: customers.reducer,
    [expenses.reducerPath]: expenses.reducer,
    [inventory.reducerPath]: inventory.reducer,
    [media.reducerPath]: media.reducer,
    [notifications.reducerPath]: notifications.reducer,
    [payments.reducerPath]: payments.reducer,
    [promotions.reducerPath]: promotions.reducer,
    [purchases.reducerPath]: purchases.reducer,
    [registers.reducerPath]: registers.reducer,
    [reports.reducerPath]: reports.reducer,
    [rewards.reducerPath]: rewards.reducer,
    [settings.reducerPath]: settings.reducer,
    session: sessionSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat([
      accounting.middleware,
      auth.middleware,
      catalog.middleware,
      customers.middleware,
      expenses.middleware,
      inventory.middleware,
      media.middleware,
      notifications.middleware,
      payments.middleware,
      promotions.middleware,
      purchases.middleware,
      registers.middleware,
      reports.middleware,
      rewards.middleware,
      settings.middleware,
    ]),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
