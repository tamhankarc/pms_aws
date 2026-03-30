import type { SessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  assertEmployeeHasAtLeastOneSupervisor,
  assertUniqueIds,
} from "@/lib/domain/rules";
import { AuthorizationError, NotFoundError, ValidationError } from "@/lib/domain/errors";
import { canAssignTeamLeads } from "@/lib/permissions";
import type { FunctionalRole, TeamLeadAssignmentInput } from "@/lib/contracts/users";
import type { EmployeeSupervisorInput, ReplaceEmployeeSupervisorsInput } from "@/lib/contracts/team-leads";

function requireSupervisorAssignmentAccess(currentUser: SessionUser) {
  if (!canAssignTeamLeads(currentUser)) {
    throw new AuthorizationError("You are not allowed to manage supervisor assignments.");
  }
}

async function validateSupervisorIds(supervisorIds: string[], employeeFunctionalRole: FunctionalRole | null) {
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

  if (supervisors.length !== supervisorIds.length) {
    return false;
  }

  return supervisors.every((person) => {
    if (person.userType === "TEAM_LEAD") return true;
    if (person.userType === "MANAGER" && person.functionalRole === employeeFunctionalRole) {
      return true;
    }
    return false;
  });
}

async function getEmployeeOrThrow(employeeId: string) {
  const employee = await db.user.findUnique({
    where: { id: employeeId },
    select: {
      id: true,
      userType: true,
      functionalRole: true,
    },
  });

  if (!employee || employee.userType !== "EMPLOYEE") {
    throw new ValidationError("Selected user is not an employee.");
  }

  return employee;
}

export async function assignTeamLead(actor: SessionUser, input: TeamLeadAssignmentInput) {
  requireSupervisorAssignmentAccess(actor);

  const employee = await getEmployeeOrThrow(input.employeeId);

  const supervisor = await db.user.findUnique({
    where: { id: input.teamLeadId },
    select: { id: true, userType: true, functionalRole: true },
  });

  const validSupervisor =
    supervisor &&
    (supervisor.userType === "TEAM_LEAD" ||
      (supervisor.userType === "MANAGER" && supervisor.functionalRole === employee.functionalRole));

  if (!validSupervisor) {
    throw new ValidationError(
      "Selected supervisor must be a Team Lead or a Manager with the same functional role as the employee.",
    );
  }

  return db.employeeTeamLead.upsert({
    where: {
      employeeId_teamLeadId: {
        employeeId: input.employeeId,
        teamLeadId: input.teamLeadId,
      },
    },
    create: {
      employeeId: input.employeeId,
      teamLeadId: input.teamLeadId,
      assignedById: actor.id,
    },
    update: {
      assignedById: actor.id,
    },
  });
}

export async function replaceEmployeeSupervisors(actor: SessionUser, input: ReplaceEmployeeSupervisorsInput) {
  requireSupervisorAssignmentAccess(actor);

  const cleanedSupervisorIds = input.supervisorIds.filter(Boolean);
  assertEmployeeHasAtLeastOneSupervisor(cleanedSupervisorIds);
  assertUniqueIds(cleanedSupervisorIds, "supervisor");

  const employee = await getEmployeeOrThrow(input.employeeId);

  const valid = await validateSupervisorIds(cleanedSupervisorIds, employee.functionalRole as FunctionalRole | null);
  if (!valid) {
    throw new ValidationError("Supervisors must be Team Leads or Managers with the same functional role as the employee.");
  }

  await db.$transaction(async (tx) => {
    await tx.employeeTeamLead.deleteMany({ where: { employeeId: input.employeeId } });

    await tx.employeeTeamLead.createMany({
      data: cleanedSupervisorIds.map((teamLeadId) => ({
        employeeId: input.employeeId,
        teamLeadId,
        assignedById: actor.id,
      })),
      skipDuplicates: true,
    });
  });
}

export async function addEmployeeSupervisor(actor: SessionUser, input: EmployeeSupervisorInput) {
  requireSupervisorAssignmentAccess(actor);

  const employee = await getEmployeeOrThrow(input.employeeId);

  const valid = await validateSupervisorIds([input.supervisorId], employee.functionalRole as FunctionalRole | null);
  if (!valid) {
    throw new ValidationError(
      "Selected supervisor must be a Team Lead or a Manager with the same functional role as the employee.",
    );
  }

  return db.employeeTeamLead.upsert({
    where: {
      employeeId_teamLeadId: {
        employeeId: input.employeeId,
        teamLeadId: input.supervisorId,
      },
    },
    create: {
      employeeId: input.employeeId,
      teamLeadId: input.supervisorId,
      assignedById: actor.id,
    },
    update: {
      assignedById: actor.id,
    },
  });
}

export async function removeEmployeeSupervisor(actor: SessionUser, input: EmployeeSupervisorInput) {
  requireSupervisorAssignmentAccess(actor);

  const employee = await getEmployeeOrThrow(input.employeeId);
  if (!employee) throw new NotFoundError("Selected user is not an employee.");

  const remainingAssignments = await db.employeeTeamLead.findMany({
    where: { employeeId: input.employeeId },
    select: { teamLeadId: true },
  });

  const remainingSupervisorIds = remainingAssignments.map((row) => row.teamLeadId).filter((id) => id !== input.supervisorId);
  assertEmployeeHasAtLeastOneSupervisor(remainingSupervisorIds);

  await db.employeeTeamLead.delete({
    where: {
      employeeId_teamLeadId: {
        employeeId: input.employeeId,
        teamLeadId: input.supervisorId,
      },
    },
  });
}
