// PATH: frontend/src/components/LoadingSpinner.tsx
export default function LoadingSpinner({ label = 'Chargement...' }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <svg width="18" height="18" viewBox="0 0 24 24" className="animate-spin">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" opacity="0.25" />
        <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" />
      </svg>
      <span>{label}</span>
    </div>
  );
}
