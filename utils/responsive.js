import { Dimensions } from 'react-native';

const BASE_W = 390;
const { width: SCREEN_W } = Dimensions.get('window');

export const scale = (size) => Math.round(size * (SCREEN_W / BASE_W));
export const clamp = (size, min, max) => Math.min(Math.max(scale(size), min), max);