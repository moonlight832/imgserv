import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  channels: defineTable({
    name: v.string(),
    code: v.string(),
    createdBy: v.id("users"),
    isPublic: v.boolean(),
  })
    .index("by_code", ["code"])
    .index("by_created_by", ["createdBy"]),

  channelMembers: defineTable({
    channelId: v.id("channels"),
    userId: v.id("users"),
    joinedAt: v.number(),
    lastReadAt: v.optional(v.number()),
  })
    .index("by_channel", ["channelId"])
    .index("by_user", ["userId"])
    .index("by_channel_user", ["channelId", "userId"]),

  messages: defineTable({
    channelId: v.id("channels"),
    authorId: v.id("users"),
    content: v.string(),
    imageId: v.optional(v.id("_storage")),
    type: v.union(v.literal("text"), v.literal("image")),
  })
    .index("by_channel", ["channelId"])
    .searchIndex("search_content", {
      searchField: "content",
      filterFields: ["channelId"],
    }),

  userProfiles: defineTable({
    userId: v.id("users"),
    displayName: v.string(),
    avatarId: v.optional(v.id("_storage")),
    connectionCode: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_connection_code", ["connectionCode"]),

  inviteCodes: defineTable({
    code: v.string(),
    createdBy: v.id("users"),
    usedBy: v.optional(v.id("users")),
    usedAt: v.optional(v.number()),
    isActive: v.boolean(),
  })
    .index("by_code", ["code"])
    .index("by_created_by", ["createdBy"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
