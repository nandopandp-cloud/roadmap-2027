import { handleEdit } from "@/lib/http/handle";
import { deletePerson, updatePerson } from "@/lib/services/org-service";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Ctx) {
  const { id } = await params;
  return handleEdit(async (viewer) => updatePerson(viewer, id, await request.json()));
}

export async function DELETE(_request: Request, { params }: Ctx) {
  const { id } = await params;
  return handleEdit((viewer) => deletePerson(viewer, id));
}
