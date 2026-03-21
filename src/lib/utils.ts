import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const maskCPF = (value: string) => {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})/, "$1-$2")
    .replace(/(-\d{2})\d+?$/, "$1");
};

export const maskPhone = (value: string) => {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2")
    .replace(/(-\d{4})\d+?$/, "$1");
};

/**
 * Converte uma data/ISO para o formato 'YYYY-MM-DDTHH:mm' respeitando o fuso horário local.
 * Essencial para o input type="datetime-local"
 */
export const formatToLocalISO = (dateInput?: string | Date) => {
  const date = dateInput ? new Date(dateInput) : new Date();
  const offset = date.getTimezoneOffset() * 60000;
  const localDate = new Date(date.getTime() - offset);
  return localDate.toISOString().slice(0, 16);
};

/**
 * Converte a string do input local para uma string ISO UTC pronta para o banco.
 */
export const formatToUTCISO = (localString: string) => {
  return new Date(localString).toISOString();
};

// Mantido por compatibilidade se algum componente usar, mas prefira os acima
export const getLocalDateTime = () => formatToLocalISO();