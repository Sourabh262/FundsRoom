const { PrismaClient } = require('@prisma/client');

async function test() {
  const prisma = new PrismaClient();
  console.log("Prisma client instantiated.");
  const users = await prisma.user.findMany();
  console.log("Users:", users);
  await prisma.$disconnect();
}
test().catch(console.error);
