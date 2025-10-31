import { BlueprintComponent } from "@/components/sectionComponents/blueprints";

interface BlueprintPageProps {
  params: Promise<{
    projectId: string;
  }>;
}

export default async function BlueprintPage({ params }: BlueprintPageProps) {
  const { projectId } = await params;
  return <BlueprintComponent projectId={projectId} />;
}
