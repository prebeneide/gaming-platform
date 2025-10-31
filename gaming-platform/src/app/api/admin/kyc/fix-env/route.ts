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
    
    // Check if file exists
    let content = '';
    if (fs.existsSync(envPath)) {
      content = fs.readFileSync(envPath, 'utf-8');
    }

    const lines = content.split('\n');
    const existingLines = lines.map(l => l.trim().toUpperCase());
    
    // Define required KYC variables
    const requiredVars = [
      { key: 'FEATURE_KYC', value: 'true', comment: '# KYC feature flag' },
      { key: 'KYC_PROVIDER', value: 'manual' },
      { key: 'KYC_STORAGE', value: 's3', comment: '# Lagring (anbefalt S3)' },
      { key: 'S3_BUCKET', value: process.env.S3_BUCKET || 'din-s3-bucket', comment: '# S3 Configuration' },
      { key: 'S3_REGION', value: process.env.S3_REGION || 'eu-north-1' },
      { key: 'S3_ACCESS_KEY_ID', value: process.env.S3_ACCESS_KEY_ID || 'DIN_AWS_ACCESS_KEY' },
      { key: 'S3_SECRET_ACCESS_KEY', value: process.env.S3_SECRET_ACCESS_KEY || 'DIN_AWS_SECRET' },
      { key: 'KYC_RETENTION_DAYS', value: process.env.KYC_RETENTION_DAYS || '30', comment: '# Retensjon (antall dager før bevis slettes)' },
    ];

    const added = [];
    const alreadyExists = [];
    
    // Check what's missing and add it
    let newContent = content;
    let needsS3Section = false;
    
    for (const reqVar of requiredVars) {
      const found = existingLines.some(line => 
        line.startsWith(reqVar.key.toUpperCase() + '=') || 
        line.startsWith('#' + reqVar.key.toUpperCase() + '=')
      );
      
      if (!found) {
        if (reqVar.key.startsWith('S3_')) {
          needsS3Section = true;
        }
        
        // Add comment if it exists and we're at the start of a section
        if (reqVar.comment && !newContent.includes(reqVar.comment)) {
          // Find good place to insert (after last KYC-related line or at end)
          const kycIndex = newContent.lastIndexOf('KYC');
          const s3Index = newContent.lastIndexOf('S3');
          const insertPos = Math.max(kycIndex, s3Index, -1);
          
          if (insertPos === -1 || newContent.slice(insertPos).split('\n').length > 3) {
            // Add comment on new line if we're starting a new section
            if (newContent && !newContent.endsWith('\n')) {
              newContent += '\n';
            }
            if (reqVar.comment && !newContent.includes(reqVar.comment)) {
              newContent += reqVar.comment + '\n';
            }
          }
        }
        
        // Add the variable
        if (newContent && !newContent.endsWith('\n') && !newContent.endsWith('\r\n')) {
          newContent += '\n';
        }
        newContent += `${reqVar.key}=${reqVar.value}\n`;
        added.push(reqVar.key);
      } else {
        alreadyExists.push(reqVar.key);
      }
    }

    if (added.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'All required KYC variables already exist',
        alreadyExists 
      });
    }

    // Write back to file
    fs.writeFileSync(envPath, newContent, 'utf-8');

    return NextResponse.json({
      success: true,
      message: `Added ${added.length} missing variable(s)`,
      added,
      alreadyExists,
      path: envPath,
    });
  } catch (error: any) {
    console.error('Error fixing .env.local:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update .env.local file' },
      { status: 500 }
    );
  }
}

