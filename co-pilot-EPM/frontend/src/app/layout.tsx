import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";
import Sidebar from "@/components/layout/Sidebar";

export const metadata: Metadata = {
  title: "EBS Project Management",
  description: "Engineering Project Management — Milestones, Resources & Analytics",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen">
        <Providers>
          <Sidebar />
          <main className="flex-1 overflow-auto">
            <div className="max-w-[1600px] mx-auto p-6">{children}</div>
          </main>
        </Providers>
      </body>
    </html>
  );
}
