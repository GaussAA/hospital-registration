export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-blue-700">
            健康挂号
          </h1>
          <p className="mt-2 text-sm text-gray-500">在线预约挂号平台</p>
        </div>
        {children}
      </div>
    </div>
  );
}
