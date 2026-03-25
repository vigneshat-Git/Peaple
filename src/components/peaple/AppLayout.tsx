import Navbar from "@/components/peaple/Navbar";
import AppSidebar from "@/components/peaple/AppSidebar";
import DiscoverPanel from "@/components/peaple/DiscoverPanel";
import MobileNav from "@/components/peaple/MobileNav";
import { Outlet } from "react-router-dom";

const AppLayout = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex justify-center">
        <div className="w-full max-w-[1600px] flex gap-4 px-4">
          {/* Left Sidebar - Fixed width, sticky */}
          <div className="w-60 shrink-0 hidden lg:block">
            <div className="sticky top-14 h-[calc(100vh-3.5rem)]">
              <AppSidebar />
            </div>
          </div>
          
          {/* Main Content - Flexible width */}
          <main className="flex-1 min-w-0 py-4 pb-20 lg:pb-4 max-w-2xl mx-auto lg:mx-0">
            <Outlet />
          </main>
          
          {/* Right Sidebar - Fixed width, sticky */}
          <div className="w-80 shrink-0 hidden xl:block">
            <div className="sticky top-14 h-[calc(100vh-3.5rem)]">
              <DiscoverPanel />
            </div>
          </div>
        </div>
      </div>
      <MobileNav />
    </div>
  );
};

export default AppLayout;
