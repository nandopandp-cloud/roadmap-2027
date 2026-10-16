import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: { root: __dirname },
  // Os arquivos de iniciativas (PRDs, decisões, protótipos) são lidos em tempo de execução
  // pelas rotas de API; garantimos que sejam incluídos no bundle do servidor.
  outputFileTracingIncludes: {
    "/api/documents": ["./initiatives/**/*"],
    "/api/artifacts/status": ["./initiatives/**/*"],
    "/api/initiatives/[id]/documents": ["./initiatives/**/*"],
    "/prototipos/[...path]": ["./initiatives/**/*"],
    "/*": ["./public/illustrations/**/*"],
  },
};

export default nextConfig;
