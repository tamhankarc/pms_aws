import { PageHeader } from "@/components/ui/page-header";
import { NewProjectForm } from "@/components/forms/new-project-form";
import { db } from "@/lib/db";
import {
  getAwsApiBaseUrl,
  getClientsFromAws,
  getCountriesFromAws,
  getEmployeeGroupsFromAws,
  getMoviesFromAws,
} from "@/lib/aws-api";

export default async function NewProjectPage() {
  const useAwsApi = Boolean(getAwsApiBaseUrl());

  const [clients, movies, countries, employeeGroups] = useAwsApi
    ? await Promise.all([
        getClientsFromAws({ status: "active" }).then((result) => result.items),
        getMoviesFromAws({ status: "active" }).then((result) => result.items),
        getCountriesFromAws({ status: "active" }).then((result) => result.items),
        getEmployeeGroupsFromAws({ status: "active" }).then((result) => result.items),
      ])
    : await Promise.all([
        db.client.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
        db.movie.findMany({
          where: { isActive: true },
          select: { id: true, title: true, clientId: true },
          orderBy: { title: "asc" },
        }),
        db.country.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
        db.employeeGroup.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
      ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create project"
        description="Movie selection is optional and only shown when the selected client has movies."
      />
      <NewProjectForm clients={clients} movies={movies} countries={countries} employeeGroups={employeeGroups} />
    </div>
  );
}
