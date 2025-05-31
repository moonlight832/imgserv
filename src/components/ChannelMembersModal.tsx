import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface ChannelMembersModalProps {
  channelId: Id<"channels">;
  channelName: string;
  onClose: () => void;
}

export function ChannelMembersModal({ channelId, channelName, onClose }: ChannelMembersModalProps) {
  const members = useQuery(api.channels.getMembers, { channelId }) || [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[80vh] overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Members of #{channelName}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-3 overflow-y-auto max-h-96">
          {members.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No members found</p>
          ) : (
            members.map((member) => (
              <div key={member.userId} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                {member.avatarUrl ? (
                  <img
                    src={member.avatarUrl}
                    alt={member.displayName}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                    {member.displayName[0]?.toUpperCase() || "U"}
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{member.displayName}</p>
                  {member.email && (
                    <p className="text-sm text-gray-500">{member.email}</p>
                  )}
                  <p className="text-xs text-gray-400">
                    Joined {new Date(member.joinedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-6">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
