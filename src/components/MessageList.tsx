interface Message {
  _id: string;
  content: string;
  type: "text" | "image";
  imageUrl?: string | null;
  _creationTime: number;
  author: {
    name: string;
    avatarUrl?: string | null;
  };
}

interface MessageListProps {
  messages: Message[];
}

export function MessageList({ messages }: MessageListProps) {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message) => (
        <div key={message._id} className="flex gap-3">
          <div className="flex-shrink-0">
            {message.author.avatarUrl ? (
              <img
                src={message.author.avatarUrl}
                alt={message.author.name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                {message.author.name[0]?.toUpperCase() || "U"}
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="font-semibold text-gray-900">
                {message.author.name}
              </span>
              <span className="text-xs text-gray-500">
                {new Date(message._creationTime).toLocaleTimeString()}
              </span>
            </div>
            
            {message.type === "image" && message.imageUrl ? (
              <div className="space-y-2">
                <img
                  src={message.imageUrl}
                  alt={message.content}
                  className="max-w-md rounded-lg shadow-sm"
                />
                {message.content && (
                  <p className="text-gray-700">{message.content}</p>
                )}
              </div>
            ) : (
              <p className="text-gray-700 whitespace-pre-wrap">
                {message.content}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
