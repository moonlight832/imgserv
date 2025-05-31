import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { ChannelContextMenu } from "./ChannelContextMenu";
import { EditChannelModal } from "./EditChannelModal";
import { ChannelMembersModal } from "./ChannelMembersModal";

interface Channel {
  _id: Id<"channels">;
  name: string;
  code: string;
  createdBy: Id<"users">;
  isPublic: boolean;
  _creationTime: number;
  hasUnread: boolean;
}

interface SidebarProps {
  channels: Channel[];
  selectedChannelId: Id<"channels"> | null;
  onSelectChannel: (channelId: Id<"channels">) => void;
  onCreateChannel: () => void;
  onJoinChannel: () => void;
}

export function Sidebar({
  channels,
  selectedChannelId,
  onSelectChannel,
  onCreateChannel,
  onJoinChannel,
}: SidebarProps) {
  const profile = useQuery(api.users.getProfile);
  const deleteChannel = useMutation(api.channels.deleteChannel);
  const markAsRead = useMutation(api.channels.markAsRead);
  
  const [deletingChannelId, setDeletingChannelId] = useState<Id<"channels"> | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    channelId: Id<"channels">;
    channelName: string;
    isCreator: boolean;
    position: { x: number; y: number };
  } | null>(null);
  const [editingChannel, setEditingChannel] = useState<{
    channelId: Id<"channels">;
    name: string;
  } | null>(null);
  const [viewingMembers, setViewingMembers] = useState<{
    channelId: Id<"channels">;
    name: string;
  } | null>(null);

  const handleChannelSelect = async (channelId: Id<"channels">) => {
    onSelectChannel(channelId);
    // Mark channel as read when selected
    try {
      await markAsRead({ channelId });
    } catch (error) {
      console.error("Failed to mark channel as read:", error);
    }
  };

  const handleContextMenu = (
    e: React.MouseEvent,
    channel: Channel
  ) => {
    e.preventDefault();
    e.stopPropagation();
    
    setContextMenu({
      channelId: channel._id,
      channelName: channel.name,
      isCreator: profile?.userId === channel.createdBy,
      position: { x: e.clientX, y: e.clientY },
    });
  };

  const handleDeleteChannel = async (channelId: Id<"channels">, channelName: string) => {
    if (!confirm(`Are you sure you want to delete the channel "${channelName}"? This action cannot be undone and will delete all messages in the channel.`)) {
      return;
    }

    setDeletingChannelId(channelId);
    try {
      await deleteChannel({ channelId });
      // If the deleted channel was selected, clear selection
      if (selectedChannelId === channelId) {
        const remainingChannels = channels.filter(c => c._id !== channelId);
        if (remainingChannels.length > 0) {
          onSelectChannel(remainingChannels[0]._id);
        }
      }
    } catch (error) {
      console.error("Failed to delete channel:", error);
      alert("Failed to delete channel. Please try again.");
    } finally {
      setDeletingChannelId(null);
    }
  };

  return (
    <div className="w-64 bg-gray-900 text-white flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold mb-4">Channels</h2>
        <div className="space-y-2">
          <button
            onClick={onCreateChannel}
            className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
          >
            + Create Channel
          </button>
          <button
            onClick={onJoinChannel}
            className="w-full px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors"
          >
            Join Channel
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          {channels.map((channel) => (
            <div
              key={channel._id}
              className={`group relative rounded-lg mb-1 transition-colors ${
                selectedChannelId === channel._id
                  ? "bg-blue-600"
                  : "hover:bg-gray-700"
              }`}
              onContextMenu={(e) => handleContextMenu(e, channel)}
            >
              <button
                onClick={() => handleChannelSelect(channel._id)}
                className="w-full text-left px-3 py-2 text-gray-300"
              >
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">#</span>
                  <span className="truncate flex-1">{channel.name}</span>
                  {channel.hasUnread && selectedChannelId !== channel._id && (
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  )}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  Code: {channel.code}
                </div>
              </button>
            </div>
          ))}
        </div>
      </div>

      {contextMenu && (
        <ChannelContextMenu
          channelId={contextMenu.channelId}
          channelName={contextMenu.channelName}
          isCreator={contextMenu.isCreator}
          position={contextMenu.position}
          onClose={() => setContextMenu(null)}
          onEdit={() => setEditingChannel({
            channelId: contextMenu.channelId,
            name: contextMenu.channelName,
          })}
          onViewMembers={() => setViewingMembers({
            channelId: contextMenu.channelId,
            name: contextMenu.channelName,
          })}
          onDelete={() => handleDeleteChannel(contextMenu.channelId, contextMenu.channelName)}
        />
      )}

      {editingChannel && (
        <EditChannelModal
          channelId={editingChannel.channelId}
          currentName={editingChannel.name}
          onClose={() => setEditingChannel(null)}
        />
      )}

      {viewingMembers && (
        <ChannelMembersModal
          channelId={viewingMembers.channelId}
          channelName={viewingMembers.name}
          onClose={() => setViewingMembers(null)}
        />
      )}
    </div>
  );
}
