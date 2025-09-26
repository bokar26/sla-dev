export function Input({ className = "", ...props }) {
  return (
    <input
      className={`border px-3 py-2 rounded-md outline-none focus:ring-2 focus:ring-green-500 ${className}`}
      {...props}
    />
  );
}
