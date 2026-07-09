import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React from 'react';
import {
  ImageBackground,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  Alert,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Light, Radius, Spacing } from '@/constants/theme';

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();

  async function handleOpenSympla() {
    try {
      const WebBrowser = await import('expo-web-browser');
      await WebBrowser.openBrowserAsync('https://www.sympla.com.br/expoindustrial-sul-2026__3486582', {
        toolbarColor: '#0A192F',
        enableBarCollapsing: true,
        showTitle: true,
      });
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível abrir o link de inscrição.');
    }
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      <ImageBackground
        source={require('../../assets/images/onboarding-bg.png')}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      >
        {/* Scrim Gradient - Claras / Branco para alto contraste */}
        <LinearGradient
          colors={[
            'rgba(255, 255, 255, 0)',
            'rgba(255, 255, 255, 0.45)',
            'rgba(255, 255, 255, 0.90)',
            '#ffffff',
          ]}
          locations={[0, 0.35, 0.65, 0.95]}
          style={StyleSheet.absoluteFill}
        />

        {/* Content Section Anchored at the Bottom */}
        <View style={[styles.bottomContent, { paddingBottom: Math.max(insets.bottom, Spacing.four) }]}>
          
          {/* Eyebrow / Event Name */}
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Ionicons name="sparkles" size={12} color={Light.goldTextStrong} />
              <Text style={styles.badgeText}>EDIÇÃO OFICIAL 2026</Text>
            </View>
          </View>

          {/* Logo */}
          <Image
            source={require('../../assets/images/logo-expoindustrial.png')}
            style={styles.logo}
            resizeMode="contain"
          />

          {/* Description */}
          <Text style={styles.description}>
            A maior feira de inovação, automação e rodada de negócios industriais do sul. Aceda ao seu crachá, matches de IA e agenda completa.
          </Text>

          {/* Actions - High Contrast CTAs */}
          <View style={styles.actionContainer}>
            {/* Primary Action */}
            <Pressable
              style={styles.primaryCta}
              onPress={() => router.push('/profile')}
            >
              <Text style={styles.primaryCtaText}>Acessar Credencial</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </Pressable>

            {/* Secondary Action */}
            <Pressable
              style={styles.secondaryCta}
              onPress={handleOpenSympla}
            >
              <Ionicons name="ticket-outline" size={18} color={Light.navy} style={{ marginRight: 4 }} />
              <Text style={styles.secondaryCtaText}>Garantir Ingresso Grátis (Sympla)</Text>
            </Pressable>
          </View>

          {/* Realização Footer */}
          <Text style={styles.footerText}>
            16 A 19 DE NOVEMBRO · EXPOCENTRO · JOINVILLE/SC
          </Text>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  bottomContent: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: Spacing.five,
    gap: Spacing.four,
  },
  badgeRow: {
    flexDirection: 'row',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7EED3',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    gap: 4,
  },
  badgeText: {
    color: Light.goldTextStrong,
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  logo: {
    width: '80%',
    height: 52,
    alignSelf: 'flex-start',
    marginBottom: -4,
  },
  description: {
    color: Light.textNavy,
    fontSize: 15.5,
    lineHeight: 22,
    opacity: 0.85,
  },
  actionContainer: {
    gap: Spacing.three,
    marginTop: Spacing.one,
  },
  primaryCta: {
    backgroundColor: Light.navy,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: Radius.pill,
    gap: Spacing.two,
    shadowColor: Light.navyDeep,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryCtaText: {
    color: '#ffffff',
    fontSize: 16.5,
    fontWeight: '800',
  },
  secondaryCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: Radius.pill,
    borderWidth: 1.5,
    borderColor: Light.navy,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  secondaryCtaText: {
    color: Light.navy,
    fontSize: 15,
    fontWeight: '700',
  },
  footerText: {
    textAlign: 'center',
    color: Light.textMuted,
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginTop: Spacing.two,
  },
});
