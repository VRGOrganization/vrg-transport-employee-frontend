

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-primary">
      <div className="flex-1 flex flex-col">{children}</div>
      
    </div>
  );
}