import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2">
          <span className="text-2xl">🎬</span>
          <span className="text-lg font-semibold tracking-tight">Watch Together</span>
        </Link>
        {children}
      </div>
    </div>
  );
}
