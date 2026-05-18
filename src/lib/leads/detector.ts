const COMMERCIAL_KEYWORDS = [
  'precio', 'precios', 'plan', 'planes', 'contratar', 'contratar', 'suscribir',
  'suscripción', 'demo', 'demostración', 'cotización', 'cotizar', 'comprar',
  'adquirir', 'implementar', 'presupuesto', 'costo', 'costos', 'tarifa',
  'tarifas', 'prueba', 'trial', 'quiero', 'necesito', 'interesado', 'interesa',
  'contactar', 'vendedor', 'comercial', 'hablar', 'reunión', 'agendar',
];

export function detectCommercialIntent(message: string): boolean {
  const lower = message.toLowerCase();
  return COMMERCIAL_KEYWORDS.some(keyword => lower.includes(keyword));
}
