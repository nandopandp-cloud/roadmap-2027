import { handleEdit } from "@/lib/http/handle";
import { listGithubBranches } from "@/lib/services/github-service";

/**
 * Branches de um repositório do GitHub (?repositorio=<link>), usadas no formulário da aba
 * Repositório. Só para quem edita: evita gastar o limite de consultas da API do GitHub.
 */
export function GET(request: Request) {
  return handleEdit(async () => listGithubBranches(new URL(request.url).searchParams.get("repositorio") ?? ""));
}
