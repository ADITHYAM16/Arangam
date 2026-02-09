import { Building2, LogOut, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import templeLogo from "@/assets/temple-logo.png";

interface HeaderProps {
  logoSrc?: string;
}

const Header = ({ logoSrc }: HeaderProps) => {
  const { user, logout } = useAuth();
  return (
    <header className="bg-green-800 text-white py-5 px-4 md:px-8 shadow-lg border-4 border-orange-500 hover:border-orange-600 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between gap-4">
          {/* Left spacer */}
          <div className="hidden md:block flex-shrink-0 w-20"></div>

          {/* Center - Title with Logo */}
          <div className="flex-1 flex items-center justify-center gap-2 md:gap-6">
            <div className="bg-white/95 p-1 md:p-2 rounded-full shadow-lg">
              <img
                src={logoSrc || templeLogo}
                alt="Mahendra Engineering College"
                className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-32 lg:h-32 object-contain"
              />
            </div>
            <div className="text-center">
              <h1 className="font-display text-xs sm:text-sm md:text-lg lg:text-2xl xl:text-3xl font-bold tracking-wide leading-tight uppercase">
                Mahendra Engineering College
                <span className="block text-[8px] sm:text-[10px] md:text-xs lg:text-sm xl:text-base font-medium mt-0.5 opacity-90">
                  (Autonomous)
                </span>
              </h1>
              <div className="text-[6px] sm:text-[8px] md:text-[10px] lg:text-xs xl:text-sm text-white/90 mt-1 max-w-4xl mx-auto leading-tight">
                <p>Autonomous Institution | Approved by AICTE | Recognized U/S 12(B) & 2(F) of UGC ACT 1956</p>
                <p>Affiliated to Anna University, Chennai | NAAC Accredited with A++ Grade & NBA Tier – 1 UG: CSE, ECE, EEE</p>
              </div>
            </div>
          </div>

          {/* Right Side - User Menu */}
          <div className="flex-shrink-0 flex items-center justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="bg-white/10 hover:bg-white/20 p-1">
                  <User className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <div className="px-2 py-1.5 text-sm border-b">
                  <p className="font-medium">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <DropdownMenuItem onClick={logout} className="text-red-600">
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
