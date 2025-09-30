// Simple stub for use-toast to prevent build failures
interface ToastOptions {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
}

export const useToast = () => ({
  toast: (options: ToastOptions) => {
    console.log('Toast:', options);
  }
});

export const toast = (options: ToastOptions) => {
  console.log('Toast:', options);
};

export default useToast;
