// Simple stub for use-toast to prevent build failures
export const useToast = () => ({
  toast: (options) => {
    console.log('Toast:', options);
  }
});

export const toast = (options) => {
  console.log('Toast:', options);
};

export default useToast;
