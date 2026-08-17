import { Tabs } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LaunchSheet } from '@/components/app/launch-sheet';
import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Dimensions, Radius, Spacing } from '@/constants/theme';
import { TAB_DESTINATIONS } from '@/constants/tab-destinations';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useI18n } from '@/hooks/use-i18n';
import { LaunchSheetProvider, useLaunchSheet } from '@/providers/launch-sheet-context';

const LARGE_TEXT_SCALE = 1.5;
const EXPANDED_BREAKPOINT = 840;
const RAIL_BASE_WIDTH = 112;
const RAIL_MAX_WIDTH = 160;
const FAB_CLEARANCE = Dimensions.fabSize + Spacing.lg;

function QuickAddButton({ bottom, right }: { bottom: number; right?: number }) {
  const { isOpen, openSheet } = useLaunchSheet();
  const { colors } = useAppTheme();
  const { strings } = useI18n();
  const [focused, setFocused] = useState(false);

  return (
    <Pressable
      accessibilityLabel={strings.tabs.quickAdd}
      accessibilityRole="button"
      accessibilityState={{ expanded: isOpen }}
      hitSlop={Spacing.xs}
      onBlur={() => setFocused(false)}
      onFocus={() => setFocused(true)}
      onPress={() => openSheet('gasto')}
      style={({ pressed }) => [
        styles.fabTarget,
        right === undefined ? styles.fabCentered : null,
        { bottom, right },
        pressed && styles.pressed,
      ]}>
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={[
          styles.fab,
          {
            backgroundColor: colors.actionPrimary,
            borderColor: focused ? colors.onPrimaryAction : colors.actionPrimary,
            shadowColor: colors.shadow,
          },
        ]}>
        <IconSymbol name="plus" size={Dimensions.iconSize} color={colors.onPrimaryAction} />
      </View>
    </Pressable>
  );
}

function TabsInner() {
  const insets = useSafeAreaInsets();
  const { fontScale, width } = useWindowDimensions();
  const { colors } = useAppTheme();
  const { strings } = useI18n();
  const largeText = fontScale >= LARGE_TEXT_SCALE;
  const expanded = width >= EXPANDED_BREAKPOINT;
  const railWidth = Math.min(
    RAIL_MAX_WIDTH,
    Math.round(RAIL_BASE_WIDTH + Math.max(0, fontScale - 1) * 48)
  );
  const tabContentHeight = largeText ? 84 : 78;
  const tabBarHeight = tabContentHeight + Math.max(insets.bottom, Spacing.sm);
  const quickAddBottom = expanded
    ? Math.max(insets.bottom, Spacing.xl)
    : tabBarHeight + Spacing.md;
  const quickAddRight = expanded ? Math.max(insets.right, Spacing.xl) : undefined;

  return (
    <>
      <Tabs
        initialRouteName="resumo"
        screenOptions={{
          sceneStyle: {
            paddingBottom: expanded ? FAB_CLEARANCE + Spacing.md : FAB_CLEARANCE,
            backgroundColor: colors.background,
          },
          tabBarActiveTintColor: colors.actionPrimary,
          tabBarInactiveTintColor: colors.textSecondaryV2,
          tabBarPosition: expanded ? 'left' : 'bottom',
          tabBarVariant: expanded ? 'material' : 'uikit',
          tabBarLabelPosition: 'below-icon',
          headerShown: false,
          tabBarAllowFontScaling: true,
          tabBarButton: HapticTab,
          tabBarHideOnKeyboard: true,
          tabBarStyle: {
            backgroundColor: colors.surfaceV2,
            borderTopColor: expanded ? 'transparent' : colors.borderSubtle,
            borderTopWidth: expanded ? 0 : 1,
            borderRightColor: expanded ? colors.borderSubtle : 'transparent',
            borderRightWidth: expanded ? 1 : 0,
            width: expanded ? railWidth : undefined,
            height: expanded ? undefined : tabBarHeight,
            paddingTop: expanded ? Math.max(insets.top, Spacing.lg) : Spacing.sm,
            paddingBottom: Math.max(insets.bottom, Spacing.sm),
            paddingHorizontal: expanded
              ? Spacing.sm
              : Platform.select({ ios: Spacing.sm, default: Spacing.xs }),
          },
          tabBarItemStyle: {
            minHeight: expanded ? 64 : Dimensions.minTouchTarget,
            maxHeight: expanded ? 80 : undefined,
            width: expanded ? railWidth - Spacing.lg : undefined,
            flexGrow: expanded ? 0 : undefined,
            flexBasis: expanded ? 'auto' : undefined,
            borderRadius: Radius.control,
          },
          tabBarIconStyle: {
            minHeight: Dimensions.iconSize,
          },
        }}>
        {TAB_DESTINATIONS.map((destination) => {
          const title = strings.tabs[destination.translationKey];

          return (
            <Tabs.Screen
              key={destination.name}
              name={destination.name}
              options={{
                title,
                tabBarAccessibilityLabel: title,
                tabBarIcon: ({ color }) => (
                  <IconSymbol size={Dimensions.iconSize} name={destination.icon} color={color} />
                ),
                tabBarLabel: ({ color, focused }) => {
                  if (!expanded && largeText && !focused) return null;

                  return (
                    <Text
                      numberOfLines={2}
                      style={[styles.tabLabel, { color }]}
                      textBreakStrategy="balanced">
                      {title}
                    </Text>
                  );
                },
              }}
            />
          );
        })}

        <Tabs.Screen name="index" options={{ href: null }} />
        <Tabs.Screen name="inicio" options={{ href: null }} />
        <Tabs.Screen name="extrato" options={{ href: null }} />
        <Tabs.Screen name="lancar" options={{ href: null }} />
        <Tabs.Screen name="explore" options={{ href: null }} />
      </Tabs>

      <QuickAddButton bottom={quickAddBottom} right={quickAddRight} />
      <LaunchSheet />
    </>
  );
}

export default function TabLayout() {
  return (
    <LaunchSheetProvider>
      <TabsInner />
    </LaunchSheetProvider>
  );
}

const styles = StyleSheet.create({
  tabLabel: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  fabTarget: {
    position: 'absolute',
    zIndex: 10,
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabCentered: {
    alignSelf: 'center',
  },
  fab: {
    width: Dimensions.fabSize,
    height: Dimensions.fabSize,
    borderRadius: Radius.full,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.22,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  pressed: {
    opacity: 0.82,
  },
});
