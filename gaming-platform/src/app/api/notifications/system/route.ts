import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { createSystemNotification } from "@/lib/notifications";

// POST /api/notifications/system - Create system notification for all users or specific users
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, message, userIds, data } = await request.json();

    if (!title || !message) {
      return NextResponse.json({ error: "Title and message are required" }, { status: 400 });
    }

    // For now, only allow creating notifications for specific users
    // In the future, this could be expanded to send to all users
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: "User IDs array is required" }, { status: 400 });
    }

    const notifications = [];

    for (const userId of userIds) {
      try {
        const notification = await createSystemNotification(
          userId,
          title,
          message,
          data
        );
        notifications.push(notification);
      } catch (error) {
        console.error(`Error creating system notification for user ${userId}:`, error);
      }
    }

    return NextResponse.json({ 
      message: "System notifications created successfully",
      count: notifications.length,
      notifications 
    });
  } catch (error) {
    console.error("Create system notifications error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 