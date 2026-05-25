import { toast } from "react-hot-toast";

interface ToastOptions {
  position?: "top-right" | "top-center" | "top-left" | "bottom-right" | "bottom-center" | "bottom-left";
  duration?: number;
}

const defaultOptions: ToastOptions = {
  position: "top-right",
  duration: 4000,
};

export const showToast = {
  success: (message: string, options?: ToastOptions) => {
    return toast.success(message, { ...defaultOptions, ...options });
  },
  error: (error: any, options?: ToastOptions) => {
    const message = error?.data?.message || error?.message || (typeof error === 'string' ? error : "Something went wrong");
    return toast.error(message, { ...defaultOptions, ...options });
  },
  loading: (message: string, options?: ToastOptions) => {
    return toast.loading(message, { ...defaultOptions, ...options });
  },
  dismiss: (toastId?: string) => {
    return toast.dismiss(toastId);
  }
};
