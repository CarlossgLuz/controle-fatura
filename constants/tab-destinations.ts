export const TAB_DESTINATIONS = [
  { name: 'resumo', translationKey: 'summary', icon: 'house.fill' },
  { name: 'movimentos', translationKey: 'movements', icon: 'list.bullet.rectangle.fill' },
  { name: 'planejamento', translationKey: 'planning', icon: 'calendar.circle.fill' },
  { name: 'carteiras', translationKey: 'wallets', icon: 'creditcard.fill' },
  { name: 'insights', translationKey: 'insights', icon: 'chart.bar.fill' },
] as const;

export type TabDestination = (typeof TAB_DESTINATIONS)[number];
