import { prisma } from "./prisma";

export interface ActivityLogData {
  userId?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
}

export async function logActivity(data: ActivityLogData): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        details: data.details,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      }
    });
  } catch (error) {
    console.error("Error logging activity:", error);
    // Don't throw error to avoid breaking the main flow
  }
}

// Common activity types
export const ActivityTypes = {
  USER_REGISTERED: "user_registered",
  USER_LOGIN: "user_login",
  USER_LOGOUT: "user_logout",
  PROFILE_UPDATED: "profile_updated",
  MATCH_CREATED: "match_created",
  MATCH_JOINED: "match_joined",
  MATCH_LEFT: "match_left",
  MATCH_COMPLETED: "match_completed",
  RATING_UPDATED: "rating_updated",
  FRIEND_REQUEST_SENT: "friend_request_sent",
  FRIEND_REQUEST_ACCEPTED: "friend_request_accepted",
  FRIEND_REQUEST_DECLINED: "friend_request_declined",
  FOLLOW_USER: "follow_user",
  UNFOLLOW_USER: "unfollow_user",
  MESSAGE_SENT: "message_sent",
  TRANSACTION_CREATED: "transaction_created",
  TRANSACTION_COMPLETED: "transaction_completed",
} as const;
