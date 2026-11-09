import React from 'react';
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
import { PlayerProvider } from './src/context/PlayerContext';
import YouTubeEngine from './src/components/YouTubeEngine';
import MiniPlayer from './src/components/MiniPlayer';
import DesktopLayout from './src/components/DesktopLayout';
import NowPlayingModal from './src/screens/NowPlayingModal';

import HomeScreen from './src/screens/HomeScreen';
import SearchScreen from './src/screens/SearchScreen';
import LibraryScreen from './src/screens/LibraryScreen';

const Tab = createBottomTabNavigator();

// Clean, Professional Dark Mobile Navigation Bar (Spotify Style)
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

          let iconName = 'home';
          let label = 'Home';
          if (route.name === 'Home') {
            iconName = isFocused ? 'home' : 'home-outline';
            label = 'Home';
          } else if (route.name === 'Search') {
            iconName = isFocused ? 'search' : 'search-outline';
            label = 'Search';
          } else if (route.name === 'Library') {
            iconName = isFocused ? 'library' : 'library-outline';
            label = 'Your Library';
          }

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={styles.tabButton}
              activeOpacity={0.75}
            >
              <Ionicons
                name={iconName}
                size={22}
                color={isFocused ? colors.textPrimary : colors.textMuted}
              />
              <Text
                style={[
                  styles.tabLabel,
                  { color: isFocused ? colors.textPrimary : colors.textMuted },
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

  if (isDesktop) {
    return (
      <View style={styles.root}>
        <DesktopLayout />
        <YouTubeEngine />
        <NowPlayingModal />
        <StatusBar style="light" backgroundColor={colors.background} />
      </View>
    );
  }

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

      {/* Invisible Background YouTube Audio Bridge */}
      <YouTubeEngine />

      {/* Full-Screen Now Playing Modal */}
      <NowPlayingModal />

      <StatusBar style="light" backgroundColor={colors.background} />
    </View>
  );
}

export default function App() {
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
    backgroundColor: '#121212',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  tabsRow: {
    flexDirection: 'row',
    height: 52,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 3,
    letterSpacing: 0.2,
  },
});
