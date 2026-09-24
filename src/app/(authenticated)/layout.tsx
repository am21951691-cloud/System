import Navbar from '@/components/Navbar'

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="container">{children}</main>
    </>
  )
}
