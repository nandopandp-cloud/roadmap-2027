/** Erro de regra de negócio, convertido em resposta HTTP pelas rotas de API. */
export class DomainError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly fields?: Record<string, string>,
  ) {
    super(message);
    this.name = "DomainError";
  }
}

export const notFound = (what: string) => new DomainError(404, `${what} não encontrado(a).`);
