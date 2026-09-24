import { prisma } from '../src/lib/db'
import bcrypt from 'bcryptjs'

async function main() {
  const args = process.argv.slice(2)
  if (args.length < 2) {
    console.error('Usage: npx tsx scripts/add-user.ts <username> <password> [name]')
    process.exit(1)
  }

  const [username, password, nameArg] = args
  const name = nameArg || username

  const hashedPassword = await bcrypt.hash(password, 10)

  const user = await prisma.user.upsert({
    where: { username },
    update: {
      password: hashedPassword,
      name,
      active: true,
    },
    create: {
      username,
      password: hashedPassword,
      name,
      role: 'user',
      active: true,
    },
  })

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: 'إضافة/تحديث مستخدم يدوياً',
      details: `تم إنشاء أو تحديث حساب المستخدم: ${username} (${name})`,
      entityType: 'user',
      entityId: user.id,
    },
  })

  console.log(`✅ Success: User [${username}] created/updated successfully with name [${name}].`)
}

main()
  .catch((err) => {
    console.error('❌ Error adding user:', err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
