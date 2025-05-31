import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getProfile = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const user = await ctx.db.get(userId);
    if (!user) return null;

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    let avatarUrl = null;
    if (profile?.avatarId) {
      avatarUrl = await ctx.storage.getUrl(profile.avatarId);
    }

    return {
      ...profile,
      email: user.email,
      avatarUrl,
    };
  },
});

export const updateProfile = mutation({
  args: {
    displayName: v.string(),
    avatarId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    let profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!profile) {
      const connectionCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      await ctx.db.insert("userProfiles", {
        userId,
        displayName: args.displayName,
        avatarId: args.avatarId,
        connectionCode,
      });
    } else {
      await ctx.db.patch(profile._id, {
        displayName: args.displayName,
        avatarId: args.avatarId,
      });
    }
  },
});

export const createProfile = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    const existingProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (existingProfile) return existingProfile._id;

    const connectionCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    return await ctx.db.insert("userProfiles", {
      userId,
      displayName: user.name || user.email || "User",
      connectionCode,
    });
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

export const createInviteCode = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const code = Math.random().toString(36).substring(2, 10).toUpperCase();

    return await ctx.db.insert("inviteCodes", {
      code,
      createdBy: userId,
      isActive: true,
    });
  },
});

export const validateInviteCode = query({
  args: {
    code: v.string(),
  },
  handler: async (ctx, args) => {
    const inviteCode = await ctx.db
      .query("inviteCodes")
      .withIndex("by_code", (q) => q.eq("code", args.code.toUpperCase()))
      .unique();

    return inviteCode && inviteCode.isActive && !inviteCode.usedBy;
  },
});

export const useInviteCode = mutation({
  args: {
    code: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const inviteCode = await ctx.db
      .query("inviteCodes")
      .withIndex("by_code", (q) => q.eq("code", args.code.toUpperCase()))
      .unique();

    if (!inviteCode || !inviteCode.isActive || inviteCode.usedBy) {
      throw new Error("Invalid or expired invite code");
    }

    await ctx.db.patch(inviteCode._id, {
      usedBy: userId,
      usedAt: Date.now(),
      isActive: false,
    });

    return inviteCode._id;
  },
});

export const getMyInviteCodes = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("inviteCodes")
      .withIndex("by_created_by", (q) => q.eq("createdBy", userId))
      .order("desc")
      .collect();
  },
});

export const deactivateInviteCode = mutation({
  args: {
    codeId: v.id("inviteCodes"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const inviteCode = await ctx.db.get(args.codeId);
    if (!inviteCode || inviteCode.createdBy !== userId) {
      throw new Error("Invite code not found or not owned by user");
    }

    await ctx.db.patch(args.codeId, {
      isActive: false,
    });
  },
});
