import { TAB_DESTINATIONS } from '@/constants/tab-destinations';
import { translations } from '@/locales/translations';

describe('v2 tab destinations', () => {
  it('exposes the five canonical destinations in product order', () => {
    expect(TAB_DESTINATIONS.map((destination) => destination.name)).toEqual([
      'resumo',
      'movimentos',
      'planejamento',
      'carteiras',
      'insights',
    ]);
  });

  it('keeps Quick Add outside the destination list', () => {
    expect(TAB_DESTINATIONS).toHaveLength(5);
    expect(TAB_DESTINATIONS.some((destination) => destination.name === ('lancar' as never))).toBe(
      false
    );
  });

  it.each(Object.entries(translations))(
    'has complete navigation labels for locale %s',
    (_locale, strings) => {
      const labels = TAB_DESTINATIONS.map(
        (destination) => strings.tabs[destination.translationKey]
      );

      expect(labels.every((label) => label.trim().length > 0)).toBe(true);
      expect(strings.tabs.quickAdd.trim().length).toBeGreaterThan(0);
    }
  );
});
