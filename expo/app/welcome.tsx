import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  FlatList,
  ViewToken,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/colors';
import { Package, MapPin, DollarSign, Bike } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');

interface OnboardingSlide {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
}

export default function WelcomeScreen() {
  const { t } = useTranslation();

  const slides: OnboardingSlide[] = [
    {
      id: '1',
      title: t('welcome.slide1_title'),
      subtitle: t('welcome.slide1_sub'),
      icon: <Bike size={80} color={Colors.surface} strokeWidth={1.5} />,
    },
    {
      id: '2',
      title: t('welcome.slide2_title'),
      subtitle: t('welcome.slide2_sub'),
      icon: <Package size={80} color={Colors.surface} strokeWidth={1.5} />,
    },
    {
      id: '3',
      title: t('welcome.slide3_title'),
      subtitle: t('welcome.slide3_sub'),
      icon: <MapPin size={80} color={Colors.surface} strokeWidth={1.5} />,
    },
    {
      id: '4',
      title: t('welcome.slide4_title'),
      subtitle: t('welcome.slide4_sub'),
      icon: <DollarSign size={80} color={Colors.surface} strokeWidth={1.5} />,
    },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setCurrentIndex(viewableItems[0].index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      router.replace('/login');
    }
  };

  const handleSkip = () => {
    router.replace('/login');
  };

  const renderSlide = ({ item }: { item: OnboardingSlide }) => (
    <View style={styles.slide}>
      <View style={styles.iconContainer}>{item.icon}</View>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.subtitle}>{item.subtitle}</Text>
    </View>
  );

  return (
    <LinearGradient
      colors={[Colors.gradient.start, Colors.gradient.end]}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={handleSkip} style={styles.skipButton} testID="welcome-skip">
          <Text style={styles.skipText}>{t('welcome.skip')}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        bounces={false}
      />

      <View style={styles.footer}>
        <View style={styles.pagination}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                currentIndex === index
                  ? styles.paginationDotActive
                  : styles.paginationDotInactive,
              ]}
            />
          ))}
        </View>

        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNext}
          activeOpacity={0.9}
          testID="welcome-next"
        >
          <Text style={styles.nextButtonText}>
            {currentIndex === slides.length - 1 ? t('welcome.start') : t('welcome.next')}
          </Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    alignItems: 'flex-end',
  },
  skipButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.surface,
  },
  slide: {
    width,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.surface,
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.surface,
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.9,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 48,
    gap: 16,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  paginationDot: {
    height: 8,
    borderRadius: 4,
  },
  paginationDotActive: {
    width: 32,
    backgroundColor: Colors.surface,
  },
  paginationDotInactive: {
    width: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  nextButton: {
    backgroundColor: Colors.surface,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  nextButtonText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
});
