export function Button({ children, className = "", variant = "default", ...props }) {
  const base = "px-4 py-2 rounded-md font-medium";
  const variants = {
    default: "bg-green-500 text-white hover:bg-green-600",
    outline: "border border-gray-300 text-gray-700",
    ghost: "text-gray-500 hover:text-gray-700"
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
