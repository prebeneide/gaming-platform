import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";
import { createFriendRequestNotification } from "@/lib/notifications";

const prisma = new PrismaClient();

// Sende venneforespørsel
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { username } = await req.json();
    if (!username) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 });
    }

    // Finn brukeren som skal sendes forespørsel til
    const toUser = await prisma.user.findUnique({
      where: { username },
    });

    if (!toUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Sjekk om det allerede finnes en forespørsel
    const existingRequest = await prisma.friendRequest.findFirst({
      where: {
        OR: [
          { fromId: session.user.id, toId: toUser.id },
          { fromId: toUser.id, toId: session.user.id },
        ],
      },
    });

    if (existingRequest) {
      return NextResponse.json(
        { error: "Friend request already exists" },
        { status: 400 }
      );
    }

    // Opprett ny forespørsel
    const friendRequest = await prisma.friendRequest.create({
      data: {
        fromId: session.user.id,
        toId: toUser.id,
        status: "pending",
      },
    });

    // Opprett notification for mottakeren (ikke kritisk hvis det feiler)
    try {
      const requesterName = (session.user as any)?.displayName || session.user.username;
      const requesterImage = session.user.image;
      
      await createFriendRequestNotification(
        toUser.id,
        requesterName,
        session.user.id,
        friendRequest.id,
        requesterImage
      );
    } catch (notificationError) {
      console.error("Notification failed, but friend request was created:", notificationError);
    }

    return NextResponse.json({ success: true, friendRequest });
  } catch (error) {
    console.error("Error sending friend request:", error);
    return NextResponse.json(
      { error: "Failed to send friend request" },
      { status: 500 }
    );
  }
}

// Akseptere/avslå venneforespørsel
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { requestId, action } = await req.json();
    if (!requestId || !action) {
      return NextResponse.json(
        { error: "Request ID and action are required" },
        { status: 400 }
      );
    }

    // Finn forespørselen
    const friendRequest = await prisma.friendRequest.findUnique({
      where: { id: requestId },
    });

    if (!friendRequest) {
      return NextResponse.json(
        { error: "Friend request not found" },
        { status: 404 }
      );
    }

    // Sjekk at brukeren er mottaker av forespørselen
    if (friendRequest.toId !== session.user.id) {
      return NextResponse.json(
        { error: "Not authorized to handle this request" },
        { status: 403 }
      );
    }

    // Oppdater status
    const updatedRequest = await prisma.friendRequest.update({
      where: { id: requestId },
      data: { status: action === "accept" ? "accepted" : "rejected" },
    });

    // Slett notificationen for denne friend request
    await prisma.notification.deleteMany({
      where: {
        type: 'friend_request',
        data: {
          path: ['requestId'],
          equals: requestId
        }
      }
    });

    return NextResponse.json(updatedRequest);
  } catch (error) {
    console.error("Error handling friend request:", error);
    return NextResponse.json(
      { error: "Failed to handle friend request" },
      { status: 500 }
    );
  }
}

// Hente venneforespørsler
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const friendRequests = await prisma.friendRequest.findMany({
      where: {
        OR: [
          { toId: session.user.id, status: "pending" }, // Innkommende
          { fromId: session.user.id, status: "pending" }, // Utgående
        ],
      },
      include: {
        from: {
          select: {
            id: true,
            username: true,
            displayName: true,
            image: true,
          },
        },
        to: {
          select: {
            id: true,
            username: true,
            displayName: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(friendRequests);
  } catch (error) {
    console.error("Error fetching friend requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch friend requests" },
      { status: 500 }
    );
  }
} 