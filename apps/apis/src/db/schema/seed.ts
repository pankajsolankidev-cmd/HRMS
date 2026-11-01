import { db } from "../index";

import { roles } from "./roles.schema";
import { permissions } from "./permissions.schema";
import { rolePermissions } from "./role-permissions.schema";

import { ROLES } from "./roles.enums";
import { PERMISSIONS } from "./permissions.enums";
import { eq } from "drizzle-orm";

async function seed() {
  console.log("🌱 Seeding roles & permissions...");

  for (const roleName of Object.values(ROLES)) {
    const existing = await db
      .select()
      .from(roles)
      .where(eq(roles.name, roleName));

    if (existing.length === 0) {
      await db.insert(roles).values({ name: roleName });
      console.log(`✅ Role inserted: ${roleName}`);
    }
  }

  for (const permissionName of Object.values(PERMISSIONS)) {
    const existing = await db
      .select()
      .from(permissions)
      .where(eq(permissions.name, permissionName));

    if (existing.length === 0) {
      await db.insert(permissions).values({ name: permissionName });
      console.log(`✅ Permission inserted: ${permissionName}`);
    }
  }

  const allRoles = await db.select().from(roles);
  const allPermissions = await db.select().from(permissions);

  const roleMap = Object.fromEntries(allRoles.map((r) => [r.name, r.id]));
  const permissionMap = Object.fromEntries(
    allPermissions.map((p) => [p.name, p.id]),
  );

  const ALL_PERMS = Object.values(PERMISSIONS);

  const rolePermissionMap: Record<string, string[]> = {
    [ROLES.EMPLOYEE]: [
      PERMISSIONS.LEAVE_CREATE,
      PERMISSIONS.EXPENSE_CREATE,
      PERMISSIONS.EXPENSE_SUBMIT,
      PERMISSIONS.DASHBOARD_VIEW_EMPLOYEE,
      PERMISSIONS.HOLIDAY_VIEW,
      PERMISSIONS.PROJECT_VIEW,
    ],

    [ROLES.HR]: ALL_PERMS,
    [ROLES.ADMIN]: ALL_PERMS,
  };

  for (const roleName in rolePermissionMap) {
    const roleId = roleMap[roleName];
    if (!roleId) continue;

    const targetPermNames = rolePermissionMap[roleName];
    const targetPermIds = targetPermNames.map((name) => permissionMap[name]);

    const existingRolePerms = await db
      .select()
      .from(rolePermissions)
      .where(eq(rolePermissions.roleId, roleId));

    const existingPermIds = new Set(
      existingRolePerms.map((rp) => rp.permissionId),
    );

    for (const permissionId of targetPermIds) {
      if (!existingPermIds.has(permissionId)) {
        await db.insert(rolePermissions).values({
          roleId,
          permissionId,
        });

        const pName = Object.keys(permissionMap).find(
          (key) => permissionMap[key] === permissionId,
        );
        console.log(`🔗 Mapped ${roleName} → ${pName}`);
      }
    }
  }

  console.log("🌱 Seeding completed successfully");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seeding failed", err);
  process.exit(1);
});
