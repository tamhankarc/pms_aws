import type { SessionUser } from "@/lib/auth";
import { hashPassword } from "@/lib/auth";
import { db } from "@/lib/db";
import type { FunctionalRole, TeamLeadAssignmentInput, UserInput } from "@/lib/contracts/users";
import {
  assertEmployeeHasAtLeastOneSupervisor,
  assertUniqueIds,
} from "@/lib/domain/rules";
import { AuthorizationError, NotFoundError, ValidationError } from "@/lib/domain/errors";
import { assignTeamLead } from "@/lib/services/team-lead-service";

function normalizeGroupIds(userType: UserInput["userType"], groupIds: string[]) {
  if (userType === "EMPLOYEE" || userType === "TEAM_LEAD") return groupIds;
  return [];
}

function validateUserTypeRoleCombination(userType: UserInput["userType"], functionalRole: FunctionalRole) {
  if (userType === "ACCOUNTS" && functionalRole !== "BILLING") {
    throw new ValidationError("Accounts users must use the Billing functional role.");
  }
  if (userType !== "ACCOUNTS" && functionalRole === "BILLING") {
    throw new ValidationError("The Billing functional role can only be used with the Accounts user type.");
  }
}

async function validateSupervisors(supervisorIds: string[], employeeFunctionalRole: FunctionalRole) {
  if (supervisorIds.length === 0) return false;

  const supervisors = await db.user.findMany({
    where: {
      id: { in: supervisorIds },
      isActive: true,
    },
    select: {
      id: true,
      userType: true,
      functionalRole: true,
    },
  });

  if (supervisors.length !== supervisorIds.length) return false;

  return supervisors.every((person) => {
    if (person.userType === "TEAM_LEAD") return true;
    if (person.userType === "MANAGER" && person.functionalRole === employeeFunctionalRole) return true;
    return false;
  });
}

function assertAdminOnlyUserTypeChange(actor: SessionUser, targetUserType: UserInput["userType"], message: string) {
  if (actor.userType !== "ADMIN" && (targetUserType === "MANAGER" || targetUserType === "ADMIN")) {
    throw new AuthorizationError(message);
  }
}

export async function createUser(actor: SessionUser, input: UserInput, supervisorIds: string[]) {
  assertAdminOnlyUserTypeChange(actor, input.userType, "Only Admin can create Manager or Admin users.");
  validateUserTypeRoleCombination(input.userType, input.functionalRole);

  if (input.userType === "EMPLOYEE") {
    assertEmployeeHasAtLeastOneSupervisor(supervisorIds);
    assertUniqueIds(supervisorIds, "supervisor");
    const valid = await validateSupervisors(supervisorIds, input.functionalRole);
    if (!valid) {
      throw new ValidationError("Supervisors must be Team Leads or Managers with the same functional role as the employee.");
    }
  }

  const groupIds = normalizeGroupIds(input.userType, input.groupIds);
  assertUniqueIds(groupIds, "employee group");

  if (!input.password) {
    throw new ValidationError("Password is required.");
  }

  const passwordHash = await hashPassword(input.password);

  await db.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        fullName: input.fullName,
        username: input.username.toLowerCase(),
        email: input.email.toLowerCase(),
        passwordHash,
        userType: input.userType,
        functionalRole: input.functionalRole,
        employeeCode: input.employeeCode?.trim() || null,
        designation: input.designation?.trim() || null,
        joiningDate: input.joiningDate ? new Date(input.joiningDate) : null,
        phoneNumber: input.phoneNumber?.trim() || null,
        isActive: Boolean(input.isActive),
      },
    });

    if (groupIds.length > 0) {
      await tx.userEmployeeGroup.createMany({
        data: groupIds.map((employeeGroupId) => ({
          userId: user.id,
          employeeGroupId,
        })),
        skipDuplicates: true,
      });
    }

    if (input.userType === "EMPLOYEE") {
      await tx.employeeTeamLead.createMany({
        data: supervisorIds.map((teamLeadId) => ({
          employeeId: user.id,
          teamLeadId,
          assignedById: actor.id,
        })),
        skipDuplicates: true,
      });
    }
  });
}

export async function updateUser(actor: SessionUser, input: UserInput, supervisorIds: string[]) {
  if (!input.id) throw new NotFoundError("User is required.");

  assertAdminOnlyUserTypeChange(actor, input.userType, "Only Admin can assign Manager or Admin user type.");
  validateUserTypeRoleCombination(input.userType, input.functionalRole);

  if (input.userType === "EMPLOYEE") {
    assertEmployeeHasAtLeastOneSupervisor(supervisorIds);
    assertUniqueIds(supervisorIds, "supervisor");
    const valid = await validateSupervisors(supervisorIds, input.functionalRole);
    if (!valid) {
      throw new ValidationError("Supervisors must be Team Leads or Managers with the same functional role as the employee.");
    }
  }

  const groupIds = normalizeGroupIds(input.userType, input.groupIds);
  assertUniqueIds(groupIds, "employee group");

  await db.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: input.id! },
      data: {
        fullName: input.fullName,
        username: input.username.toLowerCase(),
        email: input.email.toLowerCase(),
        userType: input.userType,
        functionalRole: input.functionalRole,
        employeeCode: input.employeeCode?.trim() || null,
        designation: input.designation?.trim() || null,
        joiningDate: input.joiningDate ? new Date(input.joiningDate) : null,
        phoneNumber: input.phoneNumber?.trim() || null,
        isActive: Boolean(input.isActive),
      },
    });

    await tx.userEmployeeGroup.deleteMany({ where: { userId: input.id! } });
    if (groupIds.length > 0) {
      await tx.userEmployeeGroup.createMany({
        data: groupIds.map((employeeGroupId) => ({
          userId: input.id!,
          employeeGroupId,
        })),
        skipDuplicates: true,
      });
    }

    await tx.employeeTeamLead.deleteMany({ where: { employeeId: input.id! } });
    if (input.userType === "EMPLOYEE" && supervisorIds.length > 0) {
      await tx.employeeTeamLead.createMany({
        data: supervisorIds.map((teamLeadId) => ({
          employeeId: input.id!,
          teamLeadId,
          assignedById: actor.id,
        })),
        skipDuplicates: true,
      });
    }
  });
}

export async function toggleUserStatus(userId: string) {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError("User not found.");

  return db.user.update({
    where: { id: userId },
    data: { isActive: !user.isActive },
  });
}

export async function assignUserTeamLead(actor: SessionUser, input: TeamLeadAssignmentInput) {
  return assignTeamLead(actor, input);
}
