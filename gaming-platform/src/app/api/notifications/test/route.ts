import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { 
  createMatchInviteNotification, 
  createFriendRequestNotification, 
  createMatchResultNotification, 
  createPaymentNotification, 
  createSystemNotification 
} from "@/lib/notifications";

// POST /api/notifications/test - Create test notifications
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const notifications = [];

    // Create sample notifications
    notifications.push(
      await createMatchInviteNotification(
        userId,
        "Epic COD Battle",
        "GamerPro123",
        "match-123"
      )
    );

    notifications.push(
      await createFriendRequestNotification(
        userId,
        "CoolPlayer456",
        "user-456"
      )
    );

    notifications.push(
      await createMatchResultNotification(
        userId,
        "Fortnite Showdown",
        "win",
        25.50
      )
    );

    notifications.push(
      await createPaymentNotification(
        userId,
        "deposit",
        100.00,
        "completed"
      )
    );

    notifications.push(
      await createSystemNotification(
        userId,
        "Welcome to GameChallenger!",
        "Your account has been successfully created. Start challenging other players!"
      )
    );

    return NextResponse.json({ 
      message: "Test notifications created successfully",
      count: notifications.length,
      notifications 
    });
  } catch (error) {
    console.error("Create test notifications error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 