
import React, { useState } from 'react';
import { UserCircle, Shield, MapPin, CreditCard, FileText, Settings } from 'lucide-react';

interface ProfileLayoutProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  userRole?: string;
  children: React.ReactNode;
}

const ProfileLayout: React.FC<ProfileLayoutProps> = ({
  activeTab,
  onTabChange,
  userRole = 'customer',
  children,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Sidebar */}
      <div className="lg:col-span-3">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100">
          <nav className="p-2">
            <ul className="space-y-1">
              <NavItem 
                label="Profile"
                icon={<UserCircle />}
                isActive={activeTab === 'profile'}
                onClick={() => onTabChange('profile')}
              />
              <NavItem 
                label="Addresses"
                icon={<MapPin />}
                isActive={activeTab === 'addresses'}
                onClick={() => onTabChange('addresses')}
              />
              <NavItem 
                label="Order History"
                icon={<FileText />}
                isActive={activeTab === 'orders'}
                onClick={() => onTabChange('orders')}
              />
              <NavItem 
                label="Payment Methods"
                icon={<CreditCard />}
                isActive={activeTab === 'payment'}
                onClick={() => onTabChange('payment')}
              />
              <NavItem 
                label="Account Settings"
                icon={<Settings />}
                isActive={activeTab === 'settings'}
                onClick={() => onTabChange('settings')}
              />
              
              {/* Conditional tab for sellers */}
              {userRole === 'seller' && (
                <NavItem 
                  label="Seller Verification"
                  icon={<Shield />}
                  isActive={activeTab === 'verification'}
                  onClick={() => onTabChange('verification')}
                />
              )}
            </ul>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:col-span-9">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

interface NavItemProps {
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({
  label,
  icon,
  isActive,
  onClick,
}) => {
  return (
    <li>
      <button
        onClick={onClick}
        className={`w-full flex items-center py-3 px-4 rounded-md transition-colors ${
          isActive 
            ? "bg-primary text-white font-medium" 
            : "hover:bg-gray-100 text-gray-700"
        }`}
      >
        <span className={`mr-3 ${isActive ? 'text-white' : 'text-primary/70'}`}>
          {icon}
        </span>
        {label}
      </button>
    </li>
  );
};

export default ProfileLayout;
