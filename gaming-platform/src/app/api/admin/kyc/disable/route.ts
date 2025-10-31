import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import * as fs from 'fs';
import * as path from 'path';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const projectRoot = process.cwd();
    const envPath = path.join(projectRoot, '.env.local');
    
    if (!fs.existsSync(envPath)) {
      return NextResponse.json({ 
        error: '.env.local file does not exist',
      }, { status: 404 });
    }

    let content = fs.readFileSync(envPath, 'utf-8');
    const lines = content.split('\n');
    
    let modified = false;
    const newLines = lines.map(line => {
      const trimmed = line.trim();
      // Check if this is FEATURE_KYC line
      if (trimmed.toUpperCase().startsWith('FEATURE_KYC=')) {
        // If not already commented or false, comment it out or set to false
        if (!trimmed.startsWith('#') && trimmed.toUpperCase() !== 'FEATURE_KYC=FALSE') {
          // Try to set to false first (cleaner)
          const newLine = line.replace(/FEATURE_KYC\s*=\s*.*/i, 'FEATURE_KYC=false');
          modified = true;
          return newLine;
        }
      }
      return line;
    });

    if (!modified) {
      // Check if FEATURE_KYC is already false or commented
      const hasFeatureKyc = lines.some(l => {
        const trimmed = l.trim().toUpperCase();
        return trimmed.startsWith('FEATURE_KYC=') || trimmed.startsWith('#FEATURE_KYC=');
      });
      
      if (!hasFeatureKyc) {
        // Add it as false if it doesn't exist
        if (content && !content.endsWith('\n')) {
          content += '\n';
        }
        content += '# KYC feature flag (disabled)\nFEATURE_KYC=false\n';
        modified = true;
      } else {
        // Already disabled
        return NextResponse.json({ 
          success: true, 
          message: 'KYC is already disabled',
          alreadyDisabled: true,
        });
      }
    } else {
      content = newLines.join('\n');
    }

    if (modified) {
      fs.writeFileSync(envPath, content, 'utf-8');
      return NextResponse.json({
        success: true,
        message: 'KYC has been disabled. Please restart your server for changes to take effect.',
        path: envPath,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'No changes needed',
    });
  } catch (error: any) {
    console.error('Error disabling KYC:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update .env.local file' },
      { status: 500 }
    );
  }
}

