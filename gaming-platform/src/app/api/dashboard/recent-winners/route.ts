import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Fetch the most recent 20 completed matches with winners
    const recentWinners = await prisma.match.findMany({
      where: {
        status: 'completed',
        result: {
          isNot: null,
          winnerId: {
            not: null
          }
        }
      },
      include: {
        result: true,
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                image: true
              }
            }
          }
        }
      },
      orderBy: {
        completedAt: 'desc'
      },
      take: 20
    });

    // Transform data to include winner info
    const winners = recentWinners
      .filter(match => match.result?.winnerId)
      .map(match => {
        const winner = match.participants.find(p => p.user.id === match.result?.winnerId);
        if (!winner) return null;

        return {
          id: `${match.id}-${winner.user.id}`,
          username: winner.user.username,
          displayName: winner.user.displayName || winner.user.username,
          image: winner.user.image,
          amount: match.result?.payoutAmount || 0,
          matchName: match.name,
          gameName: match.gameName,
          wonAt: match.result?.completedAt || match.result?.createdAt || new Date()
        };
      })
      .filter(w => w !== null);

    return NextResponse.json({ winners });
  } catch (error) {
    console.error('Error fetching recent winners:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent winners' },
      { status: 500 }
    );
  }
}

