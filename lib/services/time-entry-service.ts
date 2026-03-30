import type { SessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import type { CreateTimeEntryInput, UpdateTimeEntryInput } from "@/lib/contracts/time-entries";
import { assertMinutesPositive } from "@/lib/domain/rules";
import { assertProjectAllowsNewEntries } from "@/lib/guards/project";
import { canFullyModerateProject, isRoleScopedManager } from "@/lib/permissions";
import { NotFoundError, ValidationError, AuthorizationError } from "@/lib/domain/errors";

async function userCanLogAgainstProject(user: SessionUser, projectId: string) {
  const count = await db.project.count({
    where: {
      id: projectId,
      isActive: true,
      ...(isRoleScopedManager(user)
        ? {}
        : {
            employeeGroups: {
              some: {
                employeeGroup: {
                  users: {
                    some: { userId: user.id },
                  },
                },
              },
            },
          }),
    },
  });
  return count > 0;
}

export async function createTimeEntry(actor: SessionUser, input: CreateTimeEntryInput) {
  await assertProjectAllowsNewEntries(input.projectId);
  assertMinutesPositive(input.minutesSpent);

  if (!["EMPLOYEE", "TEAM_LEAD"].includes(actor.userType) && !isRoleScopedManager(actor)) {
    throw new AuthorizationError("You are not allowed to submit time entries.");
  }

  const canUseProject = await userCanLogAgainstProject(actor, input.projectId);
  if (!canUseProject) {
    throw new AuthorizationError("You can only add time entries to your assigned projects.");
  }

  const taskName = input.taskName?.trim();
  if (!taskName) {
    throw new ValidationError("Task name is required.");
  }

  return db.timeEntry.create({
    data: {
      employeeId: actor.id,
      projectId: input.projectId,
      countryId: input.countryId || null,
      workDate: new Date(input.workDate),
      taskName,
      minutesSpent: input.minutesSpent,
      isBillable: input.isBillable,
      notes: input.notes || null,
      status: "SUBMITTED",
    },
  });
}

export async function updateTimeEntry(actor: SessionUser, input: UpdateTimeEntryInput) {
  const entry = await db.timeEntry.findUnique({
    where: { id: input.entryId },
  });

  if (!entry) throw new NotFoundError("Time entry not found");

  const assignment = await db.employeeTeamLead.findFirst({
    where: {
      teamLeadId: actor.id,
      employeeId: entry.employeeId,
    },
  });

  const canEdit = canFullyModerateProject(actor) || (actor.userType === "TEAM_LEAD" && Boolean(assignment));

  if (!canEdit) {
    throw new AuthorizationError("You do not have edit access for this time entry.");
  }

  return db.timeEntry.update({
    where: { id: entry.id },
    data: {
      countryId: input.countryId || null,
      workDate: new Date(input.workDate),
      taskName: input.taskName,
      minutesSpent: input.minutesSpent,
      isBillable: input.isBillable,
      notes: input.notes || null,
    },
  });
}
