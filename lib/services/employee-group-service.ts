import { db } from "@/lib/db";
import type { EmployeeGroupInput, ToggleEmployeeGroupStatusInput } from "@/lib/contracts/employee-groups";
import { NotFoundError, ValidationError } from "@/lib/domain/errors";

async function validateAssignableUsers(userIds: string[]) {
  if (userIds.length === 0) return true;
  const count = await db.user.count({
    where: {
      id: { in: userIds },
      userType: { in: ["EMPLOYEE", "TEAM_LEAD"] },
    },
  });
  return count === userIds.length;
}

export async function createEmployeeGroup(input: EmployeeGroupInput) {
  const validUsers = await validateAssignableUsers(input.userIds);
  if (!validUsers) {
    throw new ValidationError("Only Employees and Team Leads can be assigned to a group.");
  }

  return db.$transaction(async (tx) => {
    const group = await tx.employeeGroup.create({
      data: {
        name: input.name,
        description: input.description || null,
        isActive: Boolean(input.isActive),
      },
    });

    if (input.userIds.length > 0) {
      await tx.userEmployeeGroup.createMany({
        data: input.userIds.map((userId) => ({
          userId,
          employeeGroupId: group.id,
        })),
        skipDuplicates: true,
      });
    }

    return group;
  });
}

export async function updateEmployeeGroup(input: EmployeeGroupInput) {
  if (!input.id) throw new NotFoundError("Employee group is required.");

  const validUsers = await validateAssignableUsers(input.userIds);
  if (!validUsers) {
    throw new ValidationError("Only Employees and Team Leads can be assigned to a group.");
  }

  return db.$transaction(async (tx) => {
    await tx.employeeGroup.update({
      where: { id: input.id! },
      data: {
        name: input.name,
        description: input.description || null,
        isActive: Boolean(input.isActive),
      },
    });

    await tx.userEmployeeGroup.deleteMany({
      where: { employeeGroupId: input.id! },
    });

    if (input.userIds.length > 0) {
      await tx.userEmployeeGroup.createMany({
        data: input.userIds.map((userId) => ({
          userId,
          employeeGroupId: input.id!,
        })),
        skipDuplicates: true,
      });
    }
  });
}

export async function toggleEmployeeGroupStatus(input: ToggleEmployeeGroupStatusInput) {
  const group = await db.employeeGroup.findUnique({ where: { id: input.groupId } });
  if (!group) throw new NotFoundError("Employee group not found.");

  return db.employeeGroup.update({
    where: { id: input.groupId },
    data: { isActive: !group.isActive },
  });
}
