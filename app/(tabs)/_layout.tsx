import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Radius, Spacing } from '@/constants/theme';
import { useI18n } from '@/hooks/use-i18n';
import { useAppTheme } from '@/hooks/use-app-theme';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { colors, legacyColors } = useAppTheme();
  const { strings } = useI18n();
  const tabBarHeight = 62 + Math.max(insets.bottom, 8);

  return (
    <Tabs
      initialRouteName="inicio"
      screenOptions={{
        tabBarActiveTintColor: legacyColors.tint,
        tabBarInactiveTintColor: legacyColors.tabIconDefault,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: tabBarHeight,
          paddingTop: Spacing.xs,
          paddingBottom: Math.max(insets.bottom, Spacing.sm),
          paddingHorizontal: Platform.select({ ios: Spacing.lg, default: Spacing.md }),
        },
        tabBarItemStyle: {
          borderRadius: Radius.lg,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}>
      <Tabs.Screen
        name="inicio"
        options={{
          title: strings.tabs.home,
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="lancar"
        options={{
          title: strings.tabs.launch,
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="plus.circle.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="extrato"
        options={{
          title: 'Extrato',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="info.circle.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="planejamento"
        options={{
          title: strings.tabs.planning,
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="calendar.circle.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: strings.tabs.insights,
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="chart.bar.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
