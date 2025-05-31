import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    // Get channels where user is a member
    const memberships = await ctx.db
      .query("channelMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const channelsWithUnread = await Promise.all(
      memberships.map(async (membership) => {
        const channel = await ctx.db.get(membership.channelId);
        if (!channel) return null;

        // Get latest message in channel
        const latestMessage = await ctx.db
          .query("messages")
          .withIndex("by_channel", (q) => q.eq("channelId", membership.channelId))
          .order("desc")
          .first();

        const hasUnread = latestMessage && 
          (!membership.lastReadAt || latestMessage._creationTime > membership.lastReadAt);

        return {
          ...channel,
          hasUnread: hasUnread || false,
        };
      })
    );

    return channelsWithUnread.filter(Boolean);
  },
});

export const getChannel = query({
  args: {
    channelId: v.id("channels"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const channel = await ctx.db.get(args.channelId);
    if (!channel) return null;

    // Check if user is a member
    const membership = await ctx.db
      .query("channelMembers")
      .withIndex("by_channel_user", (q) => 
        q.eq("channelId", args.channelId).eq("userId", userId)
      )
      .unique();

    return membership ? channel : null;
  },
});

export const getMembers = query({
  args: {
    channelId: v.id("channels"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    // Check if user is a member
    const membership = await ctx.db
      .query("channelMembers")
      .withIndex("by_channel_user", (q) => 
        q.eq("channelId", args.channelId).eq("userId", userId)
      )
      .unique();

    if (!membership) return [];

    const memberships = await ctx.db
      .query("channelMembers")
      .withIndex("by_channel", (q) => q.eq("channelId", args.channelId))
      .collect();

    return await Promise.all(
      memberships.map(async (membership) => {
        const user = await ctx.db.get(membership.userId);
        const profile = await ctx.db
          .query("userProfiles")
          .withIndex("by_user", (q) => q.eq("userId", membership.userId))
          .unique();

        let avatarUrl = null;
        if (profile?.avatarId) {
          avatarUrl = await ctx.storage.getUrl(profile.avatarId);
        }

        return {
          userId: membership.userId,
          displayName: profile?.displayName || user?.name || "Unknown User",
          email: user?.email,
          avatarUrl,
          joinedAt: membership.joinedAt,
        };
      })
    );
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    isPublic: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const code = Math.random().toString(36).substring(2, 8).toUpperCase();

    const channelId = await ctx.db.insert("channels", {
      name: args.name,
      code,
      createdBy: userId,
      isPublic: args.isPublic,
    });

    // Add creator as member
    await ctx.db.insert("channelMembers", {
      channelId,
      userId,
      joinedAt: Date.now(),
      lastReadAt: Date.now(),
    });

    return channelId;
  },
});

export const updateName = mutation({
  args: {
    channelId: v.id("channels"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const channel = await ctx.db.get(args.channelId);
    if (!channel) {
      throw new Error("Channel not found");
    }

    if (channel.createdBy !== userId) {
      throw new Error("Only the channel creator can edit this channel");
    }

    await ctx.db.patch(args.channelId, {
      name: args.name.trim(),
    });

    return { success: true };
  },
});

export const join = mutation({
  args: {
    code: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const channel = await ctx.db
      .query("channels")
      .withIndex("by_code", (q) => q.eq("code", args.code.toUpperCase()))
      .unique();

    if (!channel) {
      throw new Error("Channel not found");
    }

    // Check if already a member
    const existingMembership = await ctx.db
      .query("channelMembers")
      .withIndex("by_channel_user", (q) => 
        q.eq("channelId", channel._id).eq("userId", userId)
      )
      .unique();

    if (existingMembership) {
      throw new Error("Already a member of this channel");
    }

    await ctx.db.insert("channelMembers", {
      channelId: channel._id,
      userId,
      joinedAt: Date.now(),
      lastReadAt: Date.now(),
    });

    return channel._id;
  },
});

export const markAsRead = mutation({
  args: {
    channelId: v.id("channels"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const membership = await ctx.db
      .query("channelMembers")
      .withIndex("by_channel_user", (q) => 
        q.eq("channelId", args.channelId).eq("userId", userId)
      )
      .unique();

    if (membership) {
      await ctx.db.patch(membership._id, {
        lastReadAt: Date.now(),
      });
    }
  },
});

export const deleteChannel = mutation({
  args: {
    channelId: v.id("channels"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const channel = await ctx.db.get(args.channelId);
    if (!channel) {
      throw new Error("Channel not found");
    }

    if (channel.createdBy !== userId) {
      throw new Error("Only the channel creator can delete this channel");
    }

    // Delete all messages in the channel
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_channel", (q) => q.eq("channelId", args.channelId))
      .collect();

    for (const message of messages) {
      await ctx.db.delete(message._id);
    }

    // Delete all channel memberships
    const memberships = await ctx.db
      .query("channelMembers")
      .withIndex("by_channel", (q) => q.eq("channelId", args.channelId))
      .collect();

    for (const membership of memberships) {
      await ctx.db.delete(membership._id);
    }

    // Delete the channel
    await ctx.db.delete(args.channelId);

    return { success: true };
  },
});
