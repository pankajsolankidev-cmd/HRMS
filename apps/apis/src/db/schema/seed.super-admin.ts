import bcrypt from "bcryptjs";
import { and, eq } from "drizzle-orm";
import { db } from "..";
import { users } from "./users.schema";
import { ROLES } from "./roles.enums";
import { roles } from "./roles.schema";
import { userRoles } from "./user-roles.schema";

const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL!;
const SUPER_ADMIN_USERNAME = process.env.SUPER_ADMIN_USERNAME!;
const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD!;

async function seedSuperAdmin() {
  console.log("👑 Seeding Super Admin...");

  if (!SUPER_ADMIN_EMAIL || !SUPER_ADMIN_PASSWORD || !SUPER_ADMIN_USERNAME) {
    throw new Error("Missing SUPER_ADMIN environment variables.");
  }

  await db.transaction(async (tx) => {
    let [user] = await tx
      .select()
      .from(users)
      .where(eq(users.email, SUPER_ADMIN_EMAIL));

    if (!user) {
      const hashedPassword = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 10);
      [user] = await tx
        .insert(users)
        .values({
          username: SUPER_ADMIN_USERNAME,
          email: SUPER_ADMIN_EMAIL,
          password: hashedPassword,
        })
        .returning();
      console.log("✅ Super admin user created:", user.email);
    }

    const [adminRole] = await tx
      .select()
      .from(roles)
      .where(eq(roles.name, ROLES.ADMIN));

    if (!adminRole) {
      throw new Error("❌ ADMIN role not found. Run roles seed first.");
    }

    const [existingLink] = await tx
      .select()
      .from(userRoles)
      .where(
        and(eq(userRoles.userId, user.id), eq(userRoles.roleId, adminRole.id)),
      );

    if (!existingLink) {
      await tx.insert(userRoles).values({
        userId: user.id,
        roleId: adminRole.id,
      });
      console.log("✅ ADMIN role assigned to super admin");
    }
  });

  console.log("👑 Super Admin seeding done!");
}

seedSuperAdmin()
  .then(() => {
    console.log("🌱 Super Admin seed completed");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Super Admin seed failed", err);
    process.exit(1);
  });
