import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Company
  const company = await prisma.company.upsert({
    where: { id: "default-company" },
    update: {},
    create: {
      id: "default-company",
      name: "บริษัท ตัวอย่าง จำกัด",
      address: "123 ถนนตัวอย่าง กรุงเทพฯ",
      phone: "02-000-0000",
    },
  });

  // Positions
  const positions = ["ผู้จัดการ", "พนักงานทั่วไป", "HR", "วิศวกร", "บัญชี"];
  for (const name of positions) {
    await prisma.position.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  // Statuses
  const statuses = ["ทดลองงาน", "พนักงานประจำ", "สัญญาจ้าง", "ลาออก"];
  for (const name of statuses) {
    await prisma.status.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  // OT Types
  const otTypes = [
    { name: "วันธรรมดา", multiplier: 1.5 },
    { name: "วันหยุดประจำสัปดาห์", multiplier: 2.0 },
    { name: "วันหยุดนักขัตฤกษ์", multiplier: 3.0 },
  ];
  for (const ot of otTypes) {
    await prisma.oTType.upsert({
      where: { name: ot.name },
      update: {},
      create: ot,
    });
  }

  // Type Work
  const typeWorks = ["Office", "Work From Home", "Site"];
  for (const name of typeWorks) {
    await prisma.typeWork.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  // Places
  const places = ["สำนักงานใหญ่", "สาขา 1", "สาขา 2"];
  for (const name of places) {
    await prisma.placeTimeSheet.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  // Super Admin
  const hrPosition = await prisma.position.findFirst({ where: { name: "HR" } });
  const activeStatus = await prisma.status.findFirst({ where: { name: "พนักงานประจำ" } });

  const hashedPassword = await bcrypt.hash("Admin@1234", 10);
  await prisma.user.upsert({
    where: { email: "admin@hr.com" },
    update: {},
    create: {
      employeeId: "EMP001",
      firstName: "Super",
      lastName: "Admin",
      email: "admin@hr.com",
      password: hashedPassword,
      role: Role.SUPER_ADMIN,
      companyId: company.id,
      positionId: hrPosition?.id,
      statusId: activeStatus?.id,
      startDate: new Date("2020-01-01"),
    },
  });

  console.log("✅ Seed completed!");
  console.log("📧 Admin email: admin@hr.com");
  console.log("🔑 Admin password: Admin@1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
