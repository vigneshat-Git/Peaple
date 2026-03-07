import Navbar from "@/components/peaple/Navbar";
import AppSidebar from "@/components/peaple/AppSidebar";
import DiscoverPanel from "@/components/peaple/DiscoverPanel";
import MobileNav from "@/components/peaple/MobileNav";
import { Outlet } from "react-router-dom";

const AppLayout = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-[1400px] mx-auto px-4 flex gap-6">
        <AppSidebar />
        <main className="flex-1 min-w-0 py-4 pb-20 lg:pb-4">
          <Outlet />
        </main>
        <DiscoverPanel />
      </div>
      <MobileNav />
    </div>
  );
};

export default AppLayout;
