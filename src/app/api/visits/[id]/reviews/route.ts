import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const visitId = parseInt(id)
    if (isNaN(visitId)) {
      return NextResponse.json({ error: 'معرف الزيارة غير صالح' }, { status: 400 })
    }

    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح لك بالوصول' }, { status: 401 })
    }

    // Confidentiality: Only doctor or admin can see all committee recommendations
    if (session.role !== 'doctor' && session.role !== 'admin') {
      return NextResponse.json({ error: 'هذه البيانات حصرية للطبيب المعتمد ومدير النظام فقط' }, { status: 403 })
    }

    const reviews = await prisma.committeeReview.findMany({
      where: { visitId },
      include: {
        user: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      reviews: reviews.map((r) => ({
        id: r.id,
        userId: r.userId,
        decision: r.decision,
        notes: r.notes,
        createdAt: r.createdAt.toISOString(),
        user: {
          name: r.user.name,
        },
      })),
      count: reviews.length,
      timestamp: Date.now(),
    })
  } catch (error) {
    console.error('Failed to fetch live committee reviews:', error)
    return NextResponse.json({ error: 'حدث خطأ أثناء تحميل آراء وتوصيات اللجنة' }, { status: 500 })
  }
}
