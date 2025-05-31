interface SearchResult {
  _id: string;
  content: string;
  _creationTime: number;
  author: {
    name: string;
  };
  channelName: string;
}

interface SearchResultsProps {
  results: SearchResult[];
}

export function SearchResults({ results }: SearchResultsProps) {
  if (results.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-500">No messages found</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {results.map((result) => (
        <div key={result._id} className="p-4 bg-white rounded-lg border border-gray-200 hover:shadow-sm transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-semibold text-gray-900">
              {result.author.name}
            </span>
            <span className="text-sm text-gray-500">in #{result.channelName}</span>
            <span className="text-xs text-gray-400">
              {new Date(result._creationTime).toLocaleString()}
            </span>
          </div>
          <p className="text-gray-700">{result.content}</p>
        </div>
      ))}
    </div>
  );
}
