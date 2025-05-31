import { useState, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

interface ProfileModalProps {
  onClose: () => void;
}

export function ProfileModal({ onClose }: ProfileModalProps) {
  const profile = useQuery(api.users.getProfile);
  const updateProfile = useMutation(api.users.updateProfile);
  const generateUploadUrl = useMutation(api.users.generateUploadUrl);
  const createInviteCode = useMutation(api.users.createInviteCode);
  const deactivateInviteCode = useMutation(api.users.deactivateInviteCode);
  const myInviteCodes = useQuery(api.users.getMyInviteCodes) || [];

  const [displayName, setDisplayName] = useState(profile?.displayName || "");
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreatingInvite, setIsCreatingInvite] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    if (!displayName.trim()) return;

    setIsSaving(true);
    try {
      await updateProfile({
        displayName: displayName.trim(),
        avatarId: profile?.avatarId,
      });
      onClose();
    } catch (error) {
      console.error("Failed to update profile:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const uploadUrl = await generateUploadUrl();
      
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!result.ok) throw new Error("Upload failed");

      const { storageId } = await result.json();

      await updateProfile({
        displayName: displayName.trim() || profile?.displayName || "User",
        avatarId: storageId,
      });
    } catch (error) {
      console.error("Failed to upload avatar:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      handleAvatarUpload(file);
    }
  };

  const handleCreateInvite = async () => {
    setIsCreatingInvite(true);
    try {
      await createInviteCode();
    } catch (error) {
      console.error("Failed to create invite code:", error);
    } finally {
      setIsCreatingInvite(false);
    }
  };

  const handleDeactivateInvite = async (codeId: string) => {
    try {
      await deactivateInviteCode({ codeId: codeId as any });
    } catch (error) {
      console.error("Failed to deactivate invite code:", error);
    }
  };

  const generateInviteLink = (code: string) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}?invite=${code}`;
  };

  const copyInviteLink = (code: string) => {
    const link = generateInviteLink(code);
    navigator.clipboard.writeText(link);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Edit Profile</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          <div className="text-center">
            <div className="relative inline-block">
              {profile?.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover mx-auto"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl font-semibold mx-auto">
                  {displayName[0]?.toUpperCase() || "U"}
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-2 hover:bg-blue-700 disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            {isUploading && (
              <p className="text-sm text-gray-500 mt-2">Uploading...</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your display name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Connection Code
            </label>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg font-mono text-sm">
                {profile?.connectionCode}
              </code>
              <button
                onClick={() => navigator.clipboard.writeText(profile?.connectionCode || "")}
                className="px-3 py-2 text-sm bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
              >
                Copy
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Share this code with others to connect
            </p>
          </div>

          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Invite Codes
              </label>
              <button
                onClick={handleCreateInvite}
                disabled={isCreatingInvite}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isCreatingInvite ? "Creating..." : "Create Invite"}
              </button>
            </div>
            
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {myInviteCodes.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-2">
                  No invite codes created yet
                </p>
              ) : (
                myInviteCodes.map((invite) => (
                  <div key={invite._id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                    <code className="flex-1 text-sm font-mono">
                      {invite.code}
                    </code>
                    <div className="flex gap-1">
                      <button
                        onClick={() => copyInviteLink(invite.code)}
                        className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                        title="Copy invite link"
                      >
                        Link
                      </button>
                      {invite.isActive && !invite.usedBy && (
                        <button
                          onClick={() => handleDeactivateInvite(invite._id)}
                          className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                          title="Deactivate"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {invite.usedBy ? "Used" : invite.isActive ? "Active" : "Inactive"}
                    </div>
                  </div>
                ))
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Share invite links to let others sign up. Click "Link" to copy the full invite URL.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!displayName.trim() || isSaving}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
