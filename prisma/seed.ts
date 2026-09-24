import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10)

  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      name: 'مدير النظام',
      role: 'admin',
    },
  })

  console.log('✅ Seed complete: admin user created (admin / admin123)')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
