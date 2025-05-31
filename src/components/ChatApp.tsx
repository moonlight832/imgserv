import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Sidebar } from "./Sidebar";
import { MessagePane } from "./MessagePane";
import { Header } from "./Header";
import { ProfileModal } from "./ProfileModal";
import { CreateChannelModal } from "./CreateChannelModal";
import { JoinChannelModal } from "./JoinChannelModal";
import { Id } from "../../convex/_generated/dataModel";

export function ChatApp() {
  const [selectedChannelId, setSelectedChannelId] = useState<Id<"channels"> | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [showJoinChannel, setShowJoinChannel] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const channels = useQuery(api.channels.list) || [];
  const profile = useQuery(api.users.getProfile);
  const createProfile = useMutation(api.users.createProfile);
  const useInviteCode = useMutation(api.users.useInviteCode);

  // Create profile if it doesn't exist
  useEffect(() => {
    if (profile === null) {
      createProfile();
    }
  }, [profile, createProfile]);

  // Handle invite code from localStorage (set during signup)
  useEffect(() => {
    const handleInviteCode = async () => {
      try {
        const pendingInviteCode = localStorage.getItem('pendingInviteCode');
        if (pendingInviteCode && profile) {
          localStorage.removeItem('pendingInviteCode');
          await useInviteCode({ code: pendingInviteCode });
        }
      } catch (error) {
        console.error("Failed to use invite code:", error);
      }
    };

    if (profile) {
      handleInviteCode();
    }
  }, [profile, useInviteCode]);

  // Auto-select first channel if none selected
  if (!selectedChannelId && channels.length > 0 && channels[0]) {
    setSelectedChannelId(channels[0]._id);
  }

  return (
    <div className="h-screen flex flex-col bg-white">
      <Header 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onShowProfile={() => setShowProfile(true)}
      />
      
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          channels={channels.filter((channel): channel is NonNullable<typeof channel> => channel !== null)}
          selectedChannelId={selectedChannelId}
          onSelectChannel={setSelectedChannelId}
          onCreateChannel={() => setShowCreateChannel(true)}
          onJoinChannel={() => setShowJoinChannel(true)}
        />
        
        <MessagePane
          channelId={selectedChannelId}
          searchQuery={searchQuery}
        />
      </div>

      {showProfile && (
        <ProfileModal onClose={() => setShowProfile(false)} />
      )}

      {showCreateChannel && (
        <CreateChannelModal onClose={() => setShowCreateChannel(false)} />
      )}

      {showJoinChannel && (
        <JoinChannelModal onClose={() => setShowJoinChannel(false)} />
      )}
    </div>
  );
}
