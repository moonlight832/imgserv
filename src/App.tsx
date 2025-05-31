import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { CustomSignInForm } from "./components/CustomSignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { ChatApp } from "./components/ChatApp";
import { SetupDemo } from "./components/SetupDemo";

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Authenticated>
        <ChatApp />
      </Authenticated>
      <Unauthenticated>
        <div className="min-h-screen flex flex-col">
          <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm h-16 flex justify-between items-center border-b shadow-sm px-4">
            <h2 className="text-xl font-semibold text-primary">SkyeChat</h2>
          </header>
          <main className="flex-1 flex items-center justify-center p-8">
            <div className="w-full max-w-md mx-auto">
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to SkyeChat</h1>
                <p className="text-xl text-gray-600">Sign in to start chatting</p>
              </div>
              <CustomSignInForm />
            </div>
          </main>

        </div>
      </Unauthenticated>
      <Toaster />
    </div>
  );
}
