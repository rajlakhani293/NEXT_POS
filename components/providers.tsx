"use client";

import { Provider } from "react-redux";
import { store } from "@/lib/redux/store";
import { Toaster } from "react-hot-toast";
import { SessionProvider } from "@/lib/redux/session-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <SessionProvider>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#363636",
              color: "#fff",
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: "#4aed88",
                secondary: "#fff",
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: "#ff6b6b",
                secondary: "#fff",
              },
            },
          }}
        />
      </SessionProvider>
    </Provider>
  );
}
