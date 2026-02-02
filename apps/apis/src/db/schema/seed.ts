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

  const rolePermissionMap: Record<string, string[]> = {
    [ROLES.EMPLOYEE]: [
      PERMISSIONS.LEAVE_CREATE,

      PERMISSIONS.EXPENSE_CREATE,
     
      PERMISSIONS.EXPENSE_SUBMIT,
    ],

    [ROLES.HR]: [
      PERMISSIONS.LEAVE_VIEW_ALL,
      PERMISSIONS.LEAVE_UPDATE_ALL,
      PERMISSIONS.LEAVE_DELETE_ALL,
      PERMISSIONS.LEAVE_APPROVE,

      PERMISSIONS.EXPENSE_VIEW_ALL,
      PERMISSIONS.EXPENSE_UPDATE_ALL,
      PERMISSIONS.EXPENSE_DELETE_ALL,
      PERMISSIONS.EXPENSE_APPROVE,
      PERMISSIONS.EXPENSE_VIEW_SUMMARY,

      PERMISSIONS.EMPLOYEE_VIEW,
      PERMISSIONS.EMPLOYEE_UPDATE,

      PERMISSIONS.LEAVE_CREATE,
     
    ],

    [ROLES.ADMIN]: Object.values(PERMISSIONS),
  };

  for (const roleName in rolePermissionMap) {
    const roleId = roleMap[roleName];

    const existingRolePerms = await db
      .select()
      .from(rolePermissions)
      .where(eq(rolePermissions.roleId, roleId));

    for (const permName of rolePermissionMap[roleName]) {
      const permissionId = permissionMap[permName];

      if (!existingRolePerms.find((rp) => rp.permissionId === permissionId)) {
        await db.insert(rolePermissions).values({
          roleId,
          permissionId,
        });

        console.log(`🔗 Mapped ${roleName} → ${permName}`);
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
