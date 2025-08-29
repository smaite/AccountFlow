import { Search, Bell, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ProfileDropdown from "./profile-dropdown";

interface HeaderProps {
  title: string;
  onUploadClick?: () => void;
}

export default function Header({ title, onUploadClick }: HeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search transactions..."
                className="pl-10 w-64"
              />
            </div>
            
            {/* Notifications */}
            <Button variant="ghost" size="sm" className="relative p-2">
              <Bell className="w-5 h-5 text-gray-400" />
              <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-400"></span>
            </Button>
            
            {/* AI Upload Button */}
            {onUploadClick && (
              <Button onClick={onUploadClick} className="flex items-center">
                <Upload className="w-4 h-4 mr-2" />
                Upload Document
              </Button>
            )}
            
            {/* Profile Dropdown */}
            <ProfileDropdown />
          </div>
        </div>
      </div>
    </header>
  );
}
