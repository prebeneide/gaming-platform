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
  // User Management
  USER_REGISTERED: "user_registered",
  USER_LOGIN: "user_login",
  USER_LOGOUT: "user_logout",
  PROFILE_UPDATED: "profile_updated",
  PASSWORD_CHANGED: "password_changed",
  EMAIL_CHANGED: "email_changed",
  USERNAME_CHANGED: "username_changed",
  AVATAR_UPDATED: "avatar_updated",
  PREFERENCES_UPDATED: "preferences_updated",
  
  // Match Activities
  MATCH_CREATED: "match_created",
  MATCH_JOINED: "match_joined",
  MATCH_LEFT: "match_left",
  MATCH_COMPLETED: "match_completed",
  MATCH_CANCELLED: "match_cancelled",
  MATCH_TIMEOUT: "match_timeout",
  MATCH_RESULT_REPORTED: "match_result_reported",
  MATCH_RESULT_DISPUTED: "match_result_disputed",
  MATCH_READY_STATUS_CHANGED: "match_ready_status_changed",
  
  // Rating System
  RATING_UPDATED: "rating_updated",
  RATING_CALCULATED: "rating_calculated",
  
  // Social Features
  FRIEND_REQUEST_SENT: "friend_request_sent",
  FRIEND_REQUEST_ACCEPTED: "friend_request_accepted",
  FRIEND_REQUEST_DECLINED: "friend_request_declined",
  FRIEND_REMOVED: "friend_removed",
  FOLLOW_USER: "follow_user",
  UNFOLLOW_USER: "unfollow_user",
  
  // Messaging
  MESSAGE_SENT: "message_sent",
  MESSAGE_READ: "message_read",
  GLOBAL_CHAT_MESSAGE: "global_chat_message",
  MATCH_CHAT_MESSAGE: "match_chat_message",
  PRIVATE_MESSAGE_SENT: "private_message_sent",
  
  // Wallet & Transactions
  TRANSACTION_CREATED: "transaction_created",
  TRANSACTION_COMPLETED: "transaction_completed",
  DEPOSIT_INITIATED: "deposit_initiated",
  DEPOSIT_COMPLETED: "deposit_completed",
  WITHDRAWAL_INITIATED: "withdrawal_initiated",
  WITHDRAWAL_COMPLETED: "withdrawal_completed",
  PAYOUT_RECEIVED: "payout_received",
  BUY_IN_PAID: "buy_in_paid",
  
  // Notifications
  NOTIFICATION_RECEIVED: "notification_received",
  NOTIFICATION_READ: "notification_read",
  NOTIFICATION_DISMISSED: "notification_dismissed",
  
  // Admin Actions
  ADMIN_USER_BANNED: "admin_user_banned",
  ADMIN_USER_UNBANNED: "admin_user_unbanned",
  ADMIN_USER_ROLE_CHANGED: "admin_user_role_changed",
  ADMIN_MATCH_MODERATED: "admin_match_moderated",
  ADMIN_TRANSACTION_MODERATED: "admin_transaction_moderated",
  
  // System Events
  HEARTBEAT: "heartbeat",
  SESSION_STARTED: "session_started",
  SESSION_ENDED: "session_ended",
  PAGE_VISITED: "page_visited",
  API_CALL_MADE: "api_call_made",
} as const;
