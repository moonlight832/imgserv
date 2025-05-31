import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";

export function SetupDemo() {
  const createDemoAccount = useMutation(api.setup.createDemoAccount);
  const [isCreating, setIsCreating] = useState(false);
  const [message, setMessage] = useState("");

  const handleSetup = async () => {
    setIsCreating(true);
    try {
      const result = await createDemoAccount();
      setMessage(result.message);
    } catch (error) {
      setMessage("Failed to create demo account");
      console.error(error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg border">
      <h3 className="text-sm font-medium mb-2">Setup Demo</h3>
      <button
        onClick={handleSetup}
        disabled={isCreating}
        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {isCreating ? "Creating..." : "Create Demo Account"}
      </button>
      {message && (
        <p className="text-xs text-gray-600 mt-2">{message}</p>
      )}
    </div>
  );
}
