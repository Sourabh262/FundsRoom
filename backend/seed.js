const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('password', 10);
  
  const roles = [
    { username: 'admin', role: 'Admin' },
    { username: 'sales', role: 'Sales' },
    { username: 'warehouse', role: 'Warehouse' },
    { username: 'accounts', role: 'Accounts' }
  ];

  for (const role of roles) {
    await prisma.user.upsert({
      where: { username: role.username },
      update: { password, role: role.role },
      create: {
        username: role.username,
        password,
        role: role.role
      }
    });
  }
  
  console.log('Seed completed successfully.');
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
