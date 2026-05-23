import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.findUnique({ where: { email: 'admin@naturesbestfarm.com' } });
  console.log(admin ? JSON.stringify({ id: admin.id, email: admin.email, role: admin.role }, null, 2) : 'NO_ADMIN');
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
