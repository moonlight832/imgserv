import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { SearchResults } from "./SearchResults";

interface MessagePaneProps {
  channelId: Id<"channels"> | null;
  searchQuery: string;
}

export function MessagePane({ channelId, searchQuery }: MessagePaneProps) {
  const channel = useQuery(api.channels.getChannel, 
    channelId ? { channelId } : "skip"
  );
  
  const messages = useQuery(api.messages.list,
    channelId ? { channelId } : "skip"
  ) || [];

  const searchResults = useQuery(api.messages.search, 
    searchQuery.trim() ? { query: searchQuery } : "skip"
  ) || [];

  const sendMessage = useMutation(api.messages.send);
  const generateUploadUrl = useMutation(api.messages.generateUploadUrl);

  const [messageText, setMessageText] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Check if user is near bottom of messages
  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShouldAutoScroll(isNearBottom);
  };

  // Auto-scroll when new messages arrive (only if user is near bottom)
  useEffect(() => {
    if (shouldAutoScroll) {
      scrollToBottom();
    }
  }, [messages, shouldAutoScroll]);

  // Always scroll to bottom when channel changes
  useEffect(() => {
    setShouldAutoScroll(true);
    scrollToBottom();
  }, [channelId]);

  const handleSendMessage = async () => {
    if (!channelId || !messageText.trim()) return;

    await sendMessage({
      channelId,
      content: messageText,
      type: "text",
    });

    setMessageText("");
    // Ensure we scroll to bottom after sending a message
    setShouldAutoScroll(true);
  };

  const handleImageUpload = async (file: File) => {
    if (!channelId) return;

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

      await sendMessage({
        channelId,
        content: file.name,
        type: "image",
        imageId: storageId,
      });

      // Ensure we scroll to bottom after sending an image
      setShouldAutoScroll(true);
    } catch (error) {
      console.error("Failed to upload image:", error);
    } finally {
      setIsUploading(false);
    }
  };

  if (!channelId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Welcome to SkyeChat
          </h3>
          <p className="text-gray-600">
            Select a channel to start messaging or create a new one
          </p>
        </div>
      </div>
    );
  }

  if (searchQuery.trim()) {
    return (
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b border-gray-200 bg-white">
          <h2 className="text-lg font-semibold text-gray-900">
            Search Results for "{searchQuery}"
          </h2>
        </div>
        <SearchResults results={searchResults} />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="p-4 border-b border-gray-200 bg-white">
        <h2 className="text-lg font-semibold text-gray-900">
          #{channel?.name}
        </h2>
        <p className="text-sm text-gray-600">
          Channel code: {channel?.code}
        </p>
      </div>

      <div 
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto"
      >
        <MessageList messages={messages} />
        <div ref={messagesEndRef} />
      </div>

      {/* Show scroll to bottom button when not auto-scrolling */}
      {!shouldAutoScroll && (
        <div className="absolute bottom-20 right-8">
          <button
            onClick={() => {
              setShouldAutoScroll(true);
              scrollToBottom();
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 shadow-lg transition-colors"
            title="Scroll to bottom"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>
        </div>
      )}

      <MessageInput
        value={messageText}
        onChange={setMessageText}
        onSend={handleSendMessage}
        onImageUpload={handleImageUpload}
        isUploading={isUploading}
      />
    </div>
  );
}
