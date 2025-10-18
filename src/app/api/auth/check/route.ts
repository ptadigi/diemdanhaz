import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('admin_session')?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { authenticated: false, error: 'No session found' },
        { status: 401 }
      );
    }

    // 简单验证会话令牌（生产环境应验证JWT）
    try {
      const decoded = Buffer.from(sessionToken, 'base64').toString('utf-8');
      const [username] = decoded.split(':');
      
      if (username === 'hoclaixeaz') {
        return NextResponse.json({
          authenticated: true,
          username: username
        });
      } else {
        return NextResponse.json(
          { authenticated: false, error: 'Invalid session' },
          { status: 401 }
        );
      }
    } catch {
      return NextResponse.json(
        { authenticated: false, error: 'Invalid session format' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json(
      { authenticated: false, error: 'Server error' },
      { status: 500 }
    );
  }
}