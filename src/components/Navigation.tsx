"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { name: "Dash", path: "/", icon: (isActive: boolean) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={isActive ? "stroke-primary" : "stroke-gray-400"}>
      <rect width="7" height="9" x="3" y="3" rx="1" />
      <rect width="7" height="5" x="14" y="3" rx="1" />
      <rect width="7" height="9" x="14" y="12" rx="1" />
      <rect width="7" height="5" x="3" y="16" rx="1" />
    </svg>
  )},
  { name: "Income", path: "/income", icon: (isActive: boolean) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={isActive ? "stroke-primary" : "stroke-gray-400"}>
      <path d="M12 2v20" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  )},
  { name: "Expense", path: "/expenses", icon: (isActive: boolean) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={isActive ? "stroke-primary" : "stroke-gray-400"}>
      <path d="M4 2v20" />
      <circle cx="12" cy="12" r="2" />
      <path d="m18 16 4-4-4-4" />
      <path d="M14 8h3" />
      <path d="M14 16h3" />
      <path d="M4 8h4" />
      <path d="M4 16h4" />
    </svg>
  )},
  { name: "Savings", path: "/savings", icon: (isActive: boolean) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={isActive ? "stroke-primary" : "stroke-gray-400"}>
      <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5" />
      <path d="M8.5 8.5v.01" />
      <path d="M16 16v.01" />
      <path d="M12 12v.01" />
    </svg>
  )},
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 z-50 flex justify-center pointer-events-none">
      <nav className="card !rounded-full !p-2 !mb-0 max-w-[380px] w-full flex items-center justify-between shadow-2xl bg-[#18181b]/90 border border-white/10 pointer-events-auto backdrop-blur-xl">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link 
              key={item.path} 
              href={item.path}
              className={`flex-1 flex flex-col items-center justify-center py-2 rounded-full transition-all duration-300 ${isActive ? 'bg-white/5' : ''}`}
            >
              <div className={`transition-transform duration-300 ${isActive ? 'scale-110 mb-1' : ''}`}>
                {item.icon(isActive)}
              </div>
              {isActive && (
                <span className="text-[10px] font-bold text-primary animate-in fade-in slide-in-from-bottom-1">
                  {item.name}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
