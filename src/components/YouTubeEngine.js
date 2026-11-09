import { Platform } from 'react-native';
import WebEngine from './YouTubeEngine.web';
import NativeEngine from './YouTubeEngine.native';

const YouTubeEngine = Platform.OS === 'web' ? WebEngine : NativeEngine;
export default YouTubeEngine;
