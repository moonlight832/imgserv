import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { SignOutButton } from "../SignOutButton";

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onShowProfile: () => void;
}

export function Header({ searchQuery, onSearchChange, onShowProfile }: HeaderProps) {
  const profile = useQuery(api.users.getProfile);

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 shadow-sm">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold text-gray-900">SkyeChat</h1>
      </div>

      <div className="flex-1 max-w-md mx-8">
        <div className="relative">
          <input
            type="text"
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <svg
            className="absolute right-3 top-2.5 h-5 w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onShowProfile}
          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          {profile?.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt="Profile"
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
              {profile?.displayName?.[0]?.toUpperCase() || "U"}
            </div>
          )}
          <span className="text-sm font-medium text-gray-700">
            {profile?.displayName || "User"}
          </span>
        </button>
        <SignOutButton />
      </div>
    </header>
  );
}
