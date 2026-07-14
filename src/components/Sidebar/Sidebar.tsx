import React, {useEffect} from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  // UserCheck,
  Settings, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Handshake,
  FileCheck,
  FileSignature,
  ShieldCheck,
  // ChevronDown,
  // ChevronUp
} from 'lucide-react';
import { Button } from '../ui/button';
import {cn, getAvatarProps} from '../../lib/utils';
import {useUserProfile} from "../../lib/hooks.ts";
import {hasPermission} from "../auth/RequirePermission.tsx";
import {checkRole} from "../../lib/checkPrivilege.ts";

interface SidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
}


const navigationItems = [
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    path: '/admin/dashboard',
    id: 'dashboard',
    access: false
  },
  {
      title: 'Dashboard',
      icon: LayoutDashboard,
      path: '/app/dashboard',
      id: 'app-dashboard',
      access: false
  },
  {
    title: 'Reports',
    icon: FileText,
    path: '/admin/reports',
    id: 'reports',
    access: false
  },
  {
    title: 'Reports',
    icon: FileText,
    path: '/app/reports',
    id: 'app-reports',
    access: false
  },
  {
    title: 'Operators',
    icon: Users,
    path: '/operators',
    id: 'operators',
    access: false
  },
  {
    title: 'Partners',
    icon: Handshake,
    path: '/admin/partners',
    id: 'partners',
    access: false
  },
  {
    title: 'SLAs',
    icon: FileCheck,
    path: '/admin/slas',
    id: 'slas',
    access: false
  },
  {
    title: 'Agreements',
    icon: FileSignature,
    path: '/admin/partner-agreements',
    id: 'partner-agreements',
    access: false
  },
  {
    title: 'Verification Audit',
    icon: ShieldCheck,
    path: '/admin/verification-audit',
    id: 'verification-audit',
    access: false
  },
  {
        title: 'Api Usage',
        icon: LayoutDashboard,
        path: '/admin/api/dashboard',
        id: 'api-dashboard',
        access: false
  },
  {
    title: 'LGA',
    icon: MapPin,
    path: '/lga',
    id: 'lga',
    access: true
  },
  // {
  //   title: 'Team',
  //   icon: UserCheck,
  //   path: '/team',
  //   id: 'team'
  // },
  {
    title: 'Settings',
    icon: Settings,
    path: '/settings',
    id: 'settings',
    access: true
  }
];

export const Sidebar: React.FC<SidebarProps> = ({ 
  isCollapsed = false, 
  onToggle 
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useUserProfile();

  // const [expandedMenus, setExpandedMenus] = React.useState<string[]>([]);
    const activeUserNameOrEmail = `${user?.profile?.firstName || ""} ${user?.profile?.lastName || ""}`.trim() || user?.profile?.email;
    const { initials, bgClass, textClass } = getAvatarProps(activeUserNameOrEmail);

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const handleLogout = () => {
    navigate('/logout');
  };

  const isActiveRoute = (path: string) => {
    return location.pathname === path || 
           (path === '/operators' && (location.pathname.startsWith('/operators/') || location.pathname.startsWith('/operator-details/'))) ||
           (path === '/admin/partners' && location.pathname.startsWith('/admin/partners'));
  };

  const determinePath = (id: string, path: string) => {
      if (id === 'dashboard' && user?.profile?.settings?.role.toLowerCase() === 'admin') return '/admin/dashboard';
      return path;
  }

    useEffect(() => {
        const privileges = [
            ['CAN_VIEW_DASHBOARD'], ['CAN_VIEW_MINI_REPORTS'], ['CAN_VIEW_REPORTS'],
            ['CAN_VIEW_MINI_REPORTS'], ['CAN_VIEW_APPLICATIONS'], ['CAN_VIEW_DASHBOARD'], ['CAN_VIEW_SETTINGS']];
        const roleGatedIds = ['partners', 'slas', 'partner-agreements', 'verification-audit'];
        let index = 0;
        for(const navItem in navigationItems ) {
            if(
                navigationItems[navItem].id === 'settings' ||
                navigationItems[navItem].id === 'lga' ||
                roleGatedIds.includes(navigationItems[navItem].id)
            ) continue;
            navigationItems[navItem].access = hasPermission({anyOf: privileges[index++]});
        }
        navigationItems.forEach((item) => {
            if (roleGatedIds.includes(item.id)) {
                item.access = checkRole('admin');
            }
        });
    }, [navigationItems]);

  return (
    <div className={cn(
      "flex flex-col h-screen bg-black border-r border-gray-20 transition-all duration-300",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-20">
        {!isCollapsed && (
          <div className="flex items-center gap-3">
              <div className="w-12 h-14 mx-auto mb-6 rounded-lg flex items-center justify-center">
                  <div className="relative w-[45.38px] h-[49px] bg-[url(/vector.png)] bg-[100%_100%]" />
              </div>
              <div>
              <h1 className="text-lg text-w font-bold text-gray-500">ESGC</h1>
              <p className="text-xs text-gray-50">Game Staking</p>
            </div>
          </div>
        )}
        
        {isCollapsed && (
          <div className="w-8 h-10 bg-gradient-to-b from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center mx-auto">
            <div className="w-6 h-8 bg-white rounded-sm opacity-90"></div>
          </div>
        )}

        {onToggle && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="h-8 w-8 p-0 hover:bg-gray-5"
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4 text-gray-60" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-gray-60" />
            )}
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigationItems.map((item) => {
          const isActive = isActiveRoute(item.path);
          
          return (
            <div key={item.id}>
              <Button
                variant="ghost"
                onClick={() => handleNavigation(determinePath(item.id, item.path))}
                className={cn(
                  `${item.access? '' : 'hidden'} w-full justify-start h-12 px-3 rounded-xl transition-all duration-200`,
                  isCollapsed ? "px-0 justify-center" : "justify-start",
                  isActive 
                    ? "bg-primary-500 text-white hover:bg-primary-600" 
                    : "text-gray-60 hover:bg-gray-5 hover:text-gray-80"
                )}
              >
                <item.icon className={cn(
                  "w-5 h-5 flex-shrink-0",
                  isCollapsed ? "" : "mr-3"
                )} />
                {!isCollapsed && (
                  <>
                    <span className="font-medium text-sm flex-1 text-left">{item.title}</span>
                  </>
                )}
              </Button>
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-20">
        {/* User Profile Section */}
        {!isCollapsed && (
          <div className="flex items-center gap-3 mb-4 p-3 bg-gray-900 rounded-xl">
            {/*<div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0">*/}
            {/*  <span className="text-white font-bold text-sm">JS</span>*/}
            {/*</div>*/}
              <div className={`w-16 h-16 ${bgClass} rounded-full flex items-center justify-center`}>
                  {(user?.profile?.profilePicture) ? (
                      <span><img src={user?.profile?.profilePicture} alt="Profile Picture" className="w-full h-full rounded-full"/></span>) :
                      (
                          <span className={`text-xs font-semibold ${textClass}`}>{initials}</span>
                      )
                  }
              </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.profile?.firstName || ""} {user?.profile?.lastName || ""}</p>
              <p className="text-xs text-white truncate">{user?.profile?.settings?.role}</p>
            </div>
          </div>
        )}
        
        {isCollapsed && (
          <div className="flex justify-center mb-4">
            <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">JS</span>
            </div>
          </div>
        )}

        <Button
          variant="ghost"
          onClick={handleLogout}
          className={cn(
            "w-full justify-start h-12 px-3 rounded-xl text-white hover:bg-red-50 hover:text-red-600 transition-all duration-200",
            isCollapsed ? "px-0 justify-center" : "justify-start"
          )}
        >
          <LogOut className={cn(
            "w-5 h-5 flex-shrink-0",
            isCollapsed ? "" : "mr-3"
          )} />
          {!isCollapsed && (
            <span className="font-medium text-sm">Logout</span>
          )}
        </Button>
      </div>
    </div>
  );
};
