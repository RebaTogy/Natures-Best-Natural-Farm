import { PrismaClient } from "@prisma/client";
import { randomBytes, scryptSync } from "crypto";

const prisma = new PrismaClient();

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

async function main() {
  const existingAdmin = await prisma.user.findUnique({
    where: { email: "admin@naturesbestfarm.com" },
  });

  if (existingAdmin) {
    console.log("Admin user already exists:", {
      id: existingAdmin.id,
      email: existingAdmin.email,
      role: existingAdmin.role,
    });
    return;
  }

  const admin = await prisma.user.create({
    data: {
      name: "Farm Administrator",
      email: "admin@naturesbestfarm.com",
      passwordHash: hashPassword("Admin@12345"),
      role: "ADMIN",
    },
  });

  console.log("Admin user created:", {
    id: admin.id,
    email: admin.email,
    role: admin.role,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
