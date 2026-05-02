import { Tabs } from 'expo-router';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/haptic-tab';
import { LaunchSheet } from '@/components/app/launch-sheet';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Radius, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useI18n } from '@/hooks/use-i18n';
import { LaunchSheetProvider, useLaunchSheet } from '@/providers/launch-sheet-context';

function FabButton() {
  const { openSheet } = useLaunchSheet();
  const { colors } = useAppTheme();

  return (
    <Pressable
      onPress={() => openSheet('gasto')}
      style={({ pressed }) => [styles.fabWrap, pressed && styles.pressed]}>
      <View style={[styles.fab, { backgroundColor: colors.primary }]}>
        <IconSymbol name="plus" size={26} color="#FFFFFF" />
      </View>
    </Pressable>
  );
}

function TabsInner() {
  const insets = useSafeAreaInsets();
  const { colors, legacyColors } = useAppTheme();
  const { strings } = useI18n();
  const tabBarHeight = 62 + Math.max(insets.bottom, 8);

  return (
    <>
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
            paddingHorizontal: Platform.select({ ios: Spacing.sm, default: Spacing.xs }),
          },
          tabBarItemStyle: {
            borderRadius: Radius.lg,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
          },
        }}>
        <Tabs.Screen
          name="inicio"
          options={{
            title: strings.tabs.home,
            tabBarIcon: ({ color }) => <IconSymbol size={25} name="house.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="extrato"
          options={{
            title: strings.tabs.extract,
            tabBarIcon: ({ color }) => <IconSymbol size={25} name="list.bullet.rectangle.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="lancar"
          options={{
            title: '',
            tabBarButton: () => <FabButton />,
            tabBarIcon: () => null,
          }}
        />
        <Tabs.Screen
          name="planejamento"
          options={{
            title: strings.tabs.planning,
            tabBarIcon: ({ color }) => <IconSymbol size={25} name="calendar.circle.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="insights"
          options={{
            title: strings.tabs.insights,
            tabBarIcon: ({ color }) => <IconSymbol size={25} name="chart.bar.fill" color={color} />,
          }}
        />
        <Tabs.Screen name="index" options={{ href: null }} />
        <Tabs.Screen name="explore" options={{ href: null }} />
      </Tabs>
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
  fabWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.82,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    shadowColor: '#000000',
    shadowOpacity: 0.22,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
});
