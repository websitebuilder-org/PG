import { Outlet, Link, useLocation } from "react-router-dom";
import { Sparkles, History, Star } from "lucide-react";

const Layout = () => {
  const location = useLocation();

  const navItems = [
    { path: "/", label: "Generator", icon: Sparkles },
    { path: "/history", label: "History", icon: History },
    { path: "/favorites", label: "Favorites", icon: Star },
  ];

  return (
    <div className="flex min-h-screen bg-[#0A0A0A]">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0A0A0A] border-r border-[#333] flex flex-col">
        <div className="p-6 border-b border-[#333]">
          <h1 className="font-manrope font-bold text-2xl tracking-tight text-white flex items-center gap-2">
            <Sparkles className="text-[#007AFF]" size={28} />
            PromptGen
          </h1>
          <p className="text-sm text-[#A1A1AA] mt-1 font-inter">Microstock Prompt Generator</p>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    data-testid={`nav-${item.label.toLowerCase()}`}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg font-inter font-medium text-sm transition-all ${
                      isActive
                        ? "bg-[#007AFF] text-white"
                        : "text-[#A1A1AA] hover:bg-[#1E1E1E] hover:text-white"
                    }`}
                  >
                    <Icon size={20} />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-[#333]">
          <div className="bg-[#121212] border border-[#333] rounded-lg p-4">
            <p className="text-xs text-[#A1A1AA] font-inter">
              Generate professional microstock prompts with AI
            </p>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;