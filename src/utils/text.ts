/** Utilidades de texto para la busqueda (sin dependencias de Firebase). */

/** "Válvula de PASO 1/2" -> "valvula de paso 1 2" */
export function normalizeText(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quita tildes
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** "Tubo PVC 2 pulgadas" -> "tubo-pvc-2-pulgadas" (id estable del catalogo) */
export function slugify(s: string): string {
  return normalizeText(s).replace(/\s/g, '-');
}

/**
 * Palabras clave de busqueda: prefijos de cada palabra (min. 2 letras).
 * "Cemento Argos" -> ["ce","cem","ceme","cemen","cement","cemento","ar","arg",...]
 * Asi Firestore (que no tiene "LIKE") puede buscar mientras el usuario escribe.
 */
export function buildKeywords(...texts: string[]): string[] {
  const set = new Set<string>();
  for (const text of texts) {
    for (const word of normalizeText(text).split(' ')) {
      if (!word) continue;
      if (word.length < 2) {
        set.add(word);
        continue;
      }
      for (let i = 2; i <= word.length; i++) set.add(word.slice(0, i));
    }
  }
  return Array.from(set);
}

/** Palabras que escribio el usuario, normalizadas. */
export function tokenizeQuery(text: string): string[] {
  return normalizeText(text).split(' ').filter(Boolean);
}
