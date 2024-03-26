export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`${className} animate-spin`}
    >
      <circle cx="8" cy="8" r="7" strokeDasharray="48" strokeDashoffset="15" />
    </svg>
  );
}
