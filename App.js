import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { colors } from './src/theme/colors';
import { PlayerProvider, usePlayer } from './src/context/PlayerContext';
import YouTubeEngine from './src/components/YouTubeEngine';
import MiniPlayer from './src/components/MiniPlayer';
import DesktopLayout from './src/components/DesktopLayout';
import SplashScreen from './src/components/SplashScreen';
import NowPlayingModal from './src/screens/NowPlayingModal';
import AIAssistantModal, { AIAssistantFAB } from './src/components/AIAssistantModal';

import HomeScreen from './src/screens/HomeScreen';
import SearchScreen from './src/screens/SearchScreen';
import LibraryScreen from './src/screens/LibraryScreen';

const Tab = createBottomTabNavigator();

// Dim Soft Green Mobile Bottom Navigation Bar
function HarmoniqBottomBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bottomBarContainer, { paddingBottom: Math.max(insets.bottom, 6) }]}>
      {/* Persistent Floating MiniPlayer */}
      <MiniPlayer />

      {/* Tabs Row */}
      <View style={styles.tabsRow}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          let iconName = 'planet';
          let label = 'Discover';
          if (route.name === 'Home') {
            iconName = isFocused ? 'planet' : 'planet-outline';
            label = 'Discover';
          } else if (route.name === 'Search') {
            iconName = isFocused ? 'search' : 'search-outline';
            label = 'Search';
          } else if (route.name === 'Library') {
            iconName = isFocused ? 'file-tray-full' : 'file-tray-full-outline';
            label = 'Vault';
          }

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={styles.tabButton}
              activeOpacity={0.7}
            >
              <View style={[styles.iconWrapper, isFocused && styles.activeIconWrapper]}>
                <Ionicons
                  name={iconName}
                  size={20}
                  color={isFocused ? colors.accentLight : colors.textMuted}
                />
              </View>
              <Text
                style={[
                  styles.tabLabel,
                  { color: isFocused ? colors.accentLight : colors.textMuted },
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function MainApp() {
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width > 900;
  const [aiModalVisible, setAiModalVisible] = useState(false);
  const { currentTrack } = usePlayer();

  if (isDesktop) {
    return (
      <View style={styles.root}>
        <DesktopLayout />
        <YouTubeEngine />
        <NowPlayingModal />

        {/* Floating AI Mood Assistant Button (Small circle at bottom right corner) */}
        <AIAssistantFAB
          onPress={() => setAiModalVisible(true)}
          bottomOffset={105}
        />
        <AIAssistantModal
          visible={aiModalVisible}
          onClose={() => setAiModalVisible(false)}
        />

        <StatusBar style="light" backgroundColor={colors.background} />
      </View>
    );
  }

  // On mobile: adjust FAB position if miniplayer is visible
  const fabBottomOffset = currentTrack ? 130 : 72;

  return (
    <View style={styles.root}>
      <NavigationContainer
        theme={{
          ...DarkTheme,
          colors: {
            ...DarkTheme.colors,
            background: colors.background,
            card: colors.surface,
            text: colors.textPrimary,
            border: colors.divider,
          },
        }}
      >
        <Tab.Navigator
          tabBar={(props) => <HarmoniqBottomBar {...props} />}
          screenOptions={{ headerShown: false }}
        >
          <Tab.Screen name="Home" component={HomeScreen} />
          <Tab.Screen name="Search" component={SearchScreen} />
          <Tab.Screen name="Library" component={LibraryScreen} />
        </Tab.Navigator>
      </NavigationContainer>

      {/* Floating AI Mood Assistant Button (Small circle at bottom right corner) */}
      <AIAssistantFAB
        onPress={() => setAiModalVisible(true)}
        bottomOffset={fabBottomOffset}
      />
      <AIAssistantModal
        visible={aiModalVisible}
        onClose={() => setAiModalVisible(false)}
      />

      {/* Invisible Background YouTube Audio Bridge */}
      <YouTubeEngine />

      {/* Full-Screen Now Playing Modal */}
      <NowPlayingModal />

      <StatusBar style="light" backgroundColor={colors.background} />
    </View>
  );
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <SafeAreaProvider>
      <PlayerProvider>
        <MainApp />
      </PlayerProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  bottomBarContainer: {
    backgroundColor: colors.playerBar,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  tabsRow: {
    flexDirection: 'row',
    height: 54,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  iconWrapper: {
    padding: 3,
    borderRadius: 12,
  },
  activeIconWrapper: {
    backgroundColor: colors.glowDeep,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
    letterSpacing: 0.3,
  },
});
