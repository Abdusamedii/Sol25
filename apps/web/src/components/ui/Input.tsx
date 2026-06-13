import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';

type FieldProps = {
  label: string;
  children: ReactNode;
  className?: string;
};

export function Field({ label, children, className = '' }: FieldProps) {
  return (
    <label className={`grid gap-2 ${className}`}>
      <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">{label}</span>
      {children}
    </label>
  );
}

const inputClasses =
  'h-12 w-full rounded-md border-0 bg-muted px-4 text-foreground transition-all duration-200 placeholder:text-muted-foreground focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary';

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={inputClasses} {...props} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={inputClasses} {...props} />;
}
