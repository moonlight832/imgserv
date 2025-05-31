import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const createDemoAccount = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if demo account already exists
    const existingUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), "demo@demo.demo"))
      .first();

    if (existingUser) {
      return { message: "Demo account already exists", userId: existingUser._id };
    }

    // Create demo user account
    const userId = await ctx.db.insert("users", {
      email: "demo@demo.demo",
      name: "Demo User",
      emailVerificationTime: Date.now(),
    });

    // Create demo user profile
    const connectionCode = "DEMO01";
    await ctx.db.insert("userProfiles", {
      userId,
      displayName: "Demo User",
      connectionCode,
    });

    // Create a demo invite code
    await ctx.db.insert("inviteCodes", {
      code: "WELCOME",
      createdBy: userId,
      isActive: true,
    });

    // Create a demo channel
    const channelId = await ctx.db.insert("channels", {
      name: "general",
      code: "DEMO",
      createdBy: userId,
      isPublic: true,
    });

    // Add demo user to the channel
    await ctx.db.insert("channelMembers", {
      channelId,
      userId,
      joinedAt: Date.now(),
    });

    // Add a welcome message
    await ctx.db.insert("messages", {
      channelId,
      authorId: userId,
      content: "Welcome to SkyeChat! This is a demo channel. Feel free to explore and test the features.",
      type: "text",
    });

    return { message: "Demo account created successfully", userId };
  },
});
