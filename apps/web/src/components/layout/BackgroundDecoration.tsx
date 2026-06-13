export function BackgroundDecoration() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-primary/10" />
      <div className="absolute top-1/3 -left-32 h-64 w-64 rotate-12 bg-secondary/10" />
      <div className="absolute right-1/4 bottom-0 h-80 w-80 rounded-full bg-accent/10" />
      <div className="absolute top-0 left-1/2 h-full w-px -translate-x-1/2 bg-gradient-to-b from-border to-transparent opacity-60" />
    </div>
  );
}
