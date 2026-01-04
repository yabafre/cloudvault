export default function CallbackLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // No guards for callback - it handles its own auth flow
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4 dark:bg-black">
      {children}
    </div>
  )
}
