import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {
    channelId: v.id("channels"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    // Check if user is a member of the channel
    const membership = await ctx.db
      .query("channelMembers")
      .withIndex("by_channel_user", (q) => 
        q.eq("channelId", args.channelId).eq("userId", userId)
      )
      .unique();

    if (!membership) return [];

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_channel", (q) => q.eq("channelId", args.channelId))
      .order("asc")
      .collect();

    return await Promise.all(
      messages.map(async (message) => {
        const author = await ctx.db.get(message.authorId);
        const profile = await ctx.db
          .query("userProfiles")
          .withIndex("by_user", (q) => q.eq("userId", message.authorId))
          .unique();

        let imageUrl = null;
        if (message.imageId) {
          imageUrl = await ctx.storage.getUrl(message.imageId);
        }

        let avatarUrl = null;
        if (profile?.avatarId) {
          avatarUrl = await ctx.storage.getUrl(profile.avatarId);
        }

        return {
          ...message,
          author: {
            name: profile?.displayName || author?.name || "Unknown User",
            email: author?.email,
            avatarUrl,
          },
          imageUrl,
        };
      })
    );
  },
});

export const send = mutation({
  args: {
    channelId: v.id("channels"),
    content: v.string(),
    type: v.union(v.literal("text"), v.literal("image")),
    imageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if user is a member of the channel
    const membership = await ctx.db
      .query("channelMembers")
      .withIndex("by_channel_user", (q) => 
        q.eq("channelId", args.channelId).eq("userId", userId)
      )
      .unique();

    if (!membership) throw new Error("Not a member of this channel");

    return await ctx.db.insert("messages", {
      channelId: args.channelId,
      authorId: userId,
      content: args.content,
      type: args.type,
      imageId: args.imageId,
    });
  },
});

export const search = query({
  args: {
    query: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    if (args.query.trim().length === 0) return [];

    // Get all channels user is a member of
    const memberships = await ctx.db
      .query("channelMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const channelIds = memberships.map(m => m.channelId);

    // Search messages across all user's channels
    const allResults = await Promise.all(
      channelIds.map(async (channelId) => {
        const results = await ctx.db
          .query("messages")
          .withSearchIndex("search_content", (q) =>
            q.search("content", args.query).eq("channelId", channelId)
          )
          .take(10);

        return await Promise.all(
          results.map(async (message) => {
            const author = await ctx.db.get(message.authorId);
            const profile = await ctx.db
              .query("userProfiles")
              .withIndex("by_user", (q) => q.eq("userId", message.authorId))
              .unique();
            const channel = await ctx.db.get(message.channelId);

            return {
              ...message,
              author: {
                name: profile?.displayName || author?.name || "Unknown User",
              },
              channelName: channel?.name || "Unknown Channel",
            };
          })
        );
      })
    );

    return allResults.flat().slice(0, 20);
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    return await ctx.storage.generateUploadUrl();
  },
});
