import type { Platform } from "@/lib/domain/types";

/**
 * Catálogo inicial de plataformas do ecossistema. É uma referência de partida:
 * nomes, descrições e responsáveis são editáveis na tela Contexto.
 */
export const seedPlatforms: Platform[] = [
  {
    id: "admins",
    name: "Admins",
    description: "Plataforma central de cadastro e gerenciamento de usuários, escolas, turmas e permissões.",
    owner: "",
    icon: "settings",
    accent: "blue",
  },
  {
    id: "exploradores",
    name: "Exploradores",
    description: "Experiência de aprendizagem do estudante, organizada em galáxias, planetas e narrativas.",
    owner: "",
    icon: "explorer",
    accent: "purple",
  },
  {
    id: "educadores",
    name: "Educadores",
    description: "Plataforma voltada aos educadores. Descrição a completar.",
    owner: "",
    icon: "teacher",
    accent: "teal",
  },
  {
    id: "familias",
    name: "Famílias",
    description: "Plataforma voltada às famílias e responsáveis. Descrição a completar.",
    owner: "",
    icon: "family",
    accent: "orange",
  },
  {
    id: "lms",
    name: "LMS",
    description: "Ambiente de gestão de aprendizagem. Descrição a completar.",
    owner: "",
    icon: "book",
    accent: "indigo",
  },
  {
    id: "geniex",
    name: "GenieX",
    description: "Descrição a completar.",
    owner: "",
    icon: "sparkles",
    accent: "pink",
  },
];
