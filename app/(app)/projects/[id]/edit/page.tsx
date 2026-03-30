import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { ProjectEditForm } from "@/components/forms/project-edit-form";
import { db } from "@/lib/db";
import {
  getAwsApiBaseUrl,
  getCountriesFromAws,
  getEmployeeGroupsFromAws,
  getProjectByIdFromAws,
} from "@/lib/aws-api";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const useAwsApi = Boolean(getAwsApiBaseUrl());

  const [project, countries, employeeGroups] = useAwsApi
    ? await Promise.all([
        getProjectByIdFromAws(id).then((result) => result.item),
        getCountriesFromAws({ status: "active" }).then((result) => result.items),
        getEmployeeGroupsFromAws({ status: "active" }).then((result) => result.items),
      ])
    : await Promise.all([
        db.project.findUnique({
          where: { id },
          include: { client: true, movie: true, countries: true, employeeGroups: true },
        }),
        db.country.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
        db.employeeGroup.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
      ]);

  if (!project) notFound();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Edit project"
        description="Client and Movie are locked after project creation."
        actions={<Link href={`/projects/${project.id}`} className="btn-secondary">Back to project</Link>}
      />

      <ProjectEditForm
        projectId={project.id}
        lockedClientName={project.client.name}
        lockedMovieTitle={project.movie?.title ?? null}
        countries={countries}
        employeeGroups={employeeGroups}
        initialValues={{
          name: project.name,
          billingModel: project.billingModel,
          fixedContractHours: project.fixedContractHours == null ? null : Number(project.fixedContractHours),
          fixedMonthlyHours: project.fixedMonthlyHours == null ? null : Number(project.fixedMonthlyHours),
          status: project.status,
          description: project.description,
          countryIds: project.countries.map((item: any) => item.countryId),
          employeeGroupIds: project.employeeGroups.map((item: any) => item.employeeGroupId),
        }}
      />
    </div>
  );
}
