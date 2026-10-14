/** Categorias iniciales de materiales (seccion 9 de la especificacion). */
export const CATEGORIES = [
  { id: 'construccion', label: 'Materiales de construcción' },
  { id: 'acero', label: 'Acero' },
  { id: 'plomeria', label: 'Plomería' },
  { id: 'electricos', label: 'Eléctricos' },
  { id: 'herramientas', label: 'Herramientas' },
  { id: 'pinturas', label: 'Pinturas e impermeabilizantes' },
  { id: 'otros', label: 'Tornillería y otros' },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]['id'];
