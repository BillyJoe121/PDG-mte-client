import type { Rol } from "../../context/AuthContext";

export const DEMO_USERS = [
  {
    id: "U1",
    nombre: "Hugo Arboleda",
    correo: "hugo.arboleda@icesi.edu.co",
    rol: "manager" as Rol,
    departamento: "Departamento de Computación y Sistemas inteligentes.",
    iniciales: "HA",
    descripcion: "Gestor estratégico",
    token: "mock-token-ha",
    color: "#5454E9",
  },
  {
    id: "U12",
    nombre: "Leonardo Bustamante",
    correo: "lbustamante@icesi.edu.co",
    rol: "contributor" as Rol,
    departamento: "DCSI",
    iniciales: "LB",
    descripcion: "Colaborador",
    token: "mock-token-lb",
    color: "#E9683B",
  },
  {
    id: "U10",
    nombre: "Profesor Demo",
    correo: "demo.profesor@icesi.edu.co",
    rol: "admin" as Rol,
    departamento: "Departamento de Computación y Sistemas inteligentes.",
    iniciales: "PD",
    descripcion: "Administrador",
    token: "mock-token-ad",
    color: "#000000",
  },
];

export type DemoUser = typeof DEMO_USERS[0];
