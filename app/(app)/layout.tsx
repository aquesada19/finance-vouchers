import Nav from "@/components/Nav";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
     const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }
    return (
        <div className="min-h-screen bg-gray-50">
            <Nav />
            <main className="mx-auto max-w-5xl p-4 md:p-6">{children}</main>
        </div>
    );
}
