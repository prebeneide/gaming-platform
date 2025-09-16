import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { getDefaultPreferences } from '@/lib/formatting';

// GET user preferences
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || session.user.id;

    // Check if user is trying to access their own preferences or is admin
    if (userId !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const preferences = await prisma.userPreferences.findUnique({
      where: { userId },
    });

    if (!preferences) {
      // Create default preferences if they don't exist
      const defaultPrefs = getDefaultPreferences();
      const newPreferences = await prisma.userPreferences.create({
        data: {
          userId,
          ...defaultPrefs,
        },
      });
      return NextResponse.json({ preferences: newPreferences });
    }

    return NextResponse.json({ preferences });
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT update user preferences
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, preferences: newPreferences } = await request.json();

    // Check if user is trying to update their own preferences or is admin
    if (userId !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Validate preferences
    const validCurrencies = ['USD', 'EUR', 'GBP', 'NOK'];
    const validTimeFormats = ['12', '24'];
    const validDateFormats = ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'];

    if (newPreferences.currency && !validCurrencies.includes(newPreferences.currency)) {
      return NextResponse.json(
        { error: 'Invalid currency' },
        { status: 400 }
      );
    }

    if (newPreferences.timeFormat && !validTimeFormats.includes(newPreferences.timeFormat)) {
      return NextResponse.json(
        { error: 'Invalid time format' },
        { status: 400 }
      );
    }

    if (newPreferences.dateFormat && !validDateFormats.includes(newPreferences.dateFormat)) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      );
    }

    // Update or create preferences
    const preferences = await prisma.userPreferences.upsert({
      where: { userId },
      update: {
        ...newPreferences,
        updatedAt: new Date(),
      },
      create: {
        userId,
        ...getDefaultPreferences(),
        ...newPreferences,
      },
    });

    return NextResponse.json({ preferences });
  } catch (error) {
    console.error('Error updating user preferences:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
