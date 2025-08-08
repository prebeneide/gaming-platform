import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export interface CreateNotificationData {
  userId: string;
  type: 'match_invite' | 'friend_request' | 'match_result' | 'payment' | 'system';
  title: string;
  message: string;
  data?: Record<string, any>;
}

export async function createNotification(data: CreateNotificationData) {
  try {
    console.log('Creating notification with data:', data);
    
    const notification = await prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        data: data.data || {},
        isRead: false,
      },
    });
    
    console.log('Notification created successfully:', notification);
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

// Helper functions for common notification types
export async function createMatchInviteNotification(
  userId: string, 
  matchName: string, 
  inviterName: string,
  matchId: string
) {
  return createNotification({
    userId,
    type: 'match_invite',
    title: 'Match Invitation',
    message: `${inviterName} has invited you to join "${matchName}"`,
    data: { matchId, inviterName, matchName }
  });
}

export async function createFriendRequestNotification(
  userId: string,
  requesterName: string,
  requesterId: string,
  requestId: string,
  requesterImage?: string | null
) {
  return createNotification({
    userId,
    type: 'friend_request',
    title: 'Friend Request',
    message: `${requesterName} sent you a friend request`,
    data: { requesterId, requesterName, requestId, requesterImage }
  });
}

export async function createMatchResultNotification(
  userId: string,
  matchName: string,
  result: 'win' | 'loss' | 'draw',
  amount?: number
) {
  const resultText = result === 'win' ? 'won' : result === 'loss' ? 'lost' : 'drew';
  const amountText = amount ? ` and earned $${amount.toFixed(2)}` : '';
  
  return createNotification({
    userId,
    type: 'match_result',
    title: 'Match Result',
    message: `You ${resultText} the match "${matchName}"${amountText}`,
    data: { matchName, result, amount }
  });
}

export async function createPaymentNotification(
  userId: string,
  type: 'deposit' | 'withdrawal',
  amount: number,
  status: 'completed' | 'pending' | 'failed'
) {
  const action = type === 'deposit' ? 'deposited' : 'withdrew';
  const statusText = status === 'completed' ? 'successfully' : status === 'pending' ? 'is pending' : 'failed';
  
  return createNotification({
    userId,
    type: 'payment',
    title: 'Payment Update',
    message: `You ${action} $${amount.toFixed(2)} ${statusText}`,
    data: { type, amount, status }
  });
}

export async function createSystemNotification(
  userId: string,
  title: string,
  message: string,
  data?: Record<string, any>
) {
  return createNotification({
    userId,
    type: 'system',
    title,
    message,
    data
  });
} 