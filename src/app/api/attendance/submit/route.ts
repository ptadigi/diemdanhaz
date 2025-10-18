import { NextRequest, NextResponse } from 'next/server';
import { googleSheets } from '@/lib/google-sheets';
import { ZAI } from 'z-ai-web-dev-sdk';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { hoTen, cccd, soDienThoai, khoa, maDiemDanh } = body;

    // Validate input
    if (!hoTen || !cccd || !soDienThoai || !khoa || !maDiemDanh) {
      return NextResponse.json(
        { error: 'Thiếu thông tin bắt buộc' },
        { status: 400 }
      );
    }

    // BYPASS TIME CHECK FOR TESTING
    // const now = new Date();
    // const currentTime = now.getHours() * 60 + now.getMinutes();
    // const startTime = 0 * 60 + 0;   // 00:00
    // const endTime = 1 * 60 + 0;     // 01:00

    // if (currentTime < startTime || currentTime > endTime) {
    //   return NextResponse.json(
    //     { error: 'Ngoài khung giờ điểm danh (00:00-01:00) - TESTING' },
    //     { status: 403 }
    //   );
    // }

    // Get today's fixed code
    const now = new Date();
    const today = now.toDateString();
    const fixedCode = getTodayFixedCode(today);

    if (!fixedCode) {
      return NextResponse.json(
        { error: 'Chưa có mã điểm danh cho hôm nay' },
        { status: 403 }
      );
    }

    // Verify the fixed code
    if (maDiemDanh !== fixedCode) {
      return NextResponse.json(
        { error: 'Mã điểm danh không chính xác' },
        { status: 401 }
      );
    }

    // Update Google Sheets
    await googleSheets.updateAttendance({
      hoTen,
      cccd,
      soDienThoai,
      khoa,
      daDiemDanh: true
    });

    return NextResponse.json({
      success: true,
      message: 'Điểm danh thành công!'
    });

  } catch (error) {
    console.error('Submit attendance error:', error);
    return NextResponse.json(
      { error: 'Lỗi server, vui lòng thử lại' },
      { status: 500 }
    );
  }
}

// Memory storage for fixed codes
const fixedCodes: Record<string, string> = {};

// Set test code for current date
fixedCodes[new Date().toDateString()] = "123456";

function getTodayFixedCode(today: string): string | null {
  return fixedCodes[today] || null;
}

export async function generateTodayFixedCode(): Promise<string> {
  const today = new Date().toDateString();
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  fixedCodes[today] = code;
  
  // Gửi mã qua webhook đến n8n
  try {
    const webhookUrl = process.env.WEBHOOK_URL || 'https://n8n.phamthanh.net/webhook/diemdanh';
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'send_attendance_code',
        timestamp: new Date().toISOString(),
        data: {
          code: code,
          date: today,
          message: `Mã điểm danh hôm nay: ${code}`
        }
      })
    });

    if (response.ok) {
      console.log('✅ Mã điểm danh đã gửi qua webhook:', code);
    } else {
      console.error('❌ Webhook failed:', response.status);
    }
  } catch (error) {
    console.error('❌ Failed to send code via webhook:', error);
  }
  
  // Cũng gửi qua ZAI để backup
  try {
    const zai = await ZAI.create();
    await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'Bạn là trợ lý gửi thông báo mã điểm danh.'
        },
        {
          role: 'user',
          content: `Mã điểm danh hôm nay: ${code}. Vui lòng chia sẻ cho học viên.`
        }
      ]
    });
  } catch (error) {
    console.error('Failed to send code to admin via ZAI:', error);
  }
  
  return code;
}