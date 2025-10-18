import { NextRequest, NextResponse } from 'next/server';

// 管理员账户信息
const ADMIN_CREDENTIALS = {
  username: 'hoclaixeaz',
  password: 'Hoclaixeaz@2025!@#'
};

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    // 验证输入
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Vui lòng nhập tên đăng nhập và mật khẩu' },
        { status: 400 }
      );
    }

    // 验证管理员凭据
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
      // 创建会话令牌（简单实现，生产环境应使用JWT）
      const sessionToken = Buffer.from(`${username}:${Date.now()}`).toString('base64');
      
      // 设置HTTP-only cookie
      const response = NextResponse.json({
        success: true,
        message: 'Đăng nhập thành công',
        redirect: '/setgio'
      });

      response.cookies.set('admin_session', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 24小时
        path: '/'
      });

      return response;
    } else {
      return NextResponse.json(
        { error: 'Tên đăng nhập hoặc mật khẩu không đúng' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi máy chủ' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}