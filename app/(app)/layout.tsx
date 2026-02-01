import "@/app/globals.css";
import Nav from "@/components/Nav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-gray-50">
            <Nav />
            <main className="mx-auto max-w-5xl p-4 md:p-6">{children}</main>
        </div>
    );
}
