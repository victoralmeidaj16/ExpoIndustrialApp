import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
  Dimensions,
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Brand, Radius, Spacing } from '@/constants/theme';
import { useExhibitor } from '@/features/exhibitors/use-exhibitors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function CompanyProfile2Screen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { exhibitor, loading } = useExhibitor(id || 'demo-exhibitor'); // Usa hook real ou Siemens como demo
  const [favorite, setFavorite] = useState(false);

  // Fallback de dados premium baseados na imagem e nas exigências de design
  const data = {
    companyName: exhibitor?.company || 'EXPOINDUSTRIAL SUL',
    description: exhibitor?.about || 'Company is leading the industrial transition processes as AI generated company summaries, products, service solutions and omni-channel support options for industry more.',
    stand: exhibitor?.stand || 'BOOTH B12 · HALL B',
    badges: ['Industry 4.0', 'IoT Solutions', 'Smart Manufacturing'],
    products: [
      { name: 'Smart Sensors', image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=300' },
      { name: 'Predictive AI Platform', image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=300' },
    ],
    technologies: ['Machine Learning', 'Edge Computing', 'Digital Twin', 'Cybersecurity'],
    certifications: ['Integrotesa', 'ISO 9001', 'Green Industry Premium'],
    phone: '(855) 559 5596',
    email: 'contact@expoindustrialsul.com.br',
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: 0, paddingBottom: 150 },
        ]}
        showsVerticalScrollIndicator={false}>
        
        {/* Cover Image & Header Container */}
        <ImageBackground
          source={{ uri: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800' }}
          style={[styles.coverBackground, { height: 260 }]}
          resizeMode="cover">
          <LinearGradient
            colors={['rgba(0,0,0,0.4)', 'transparent']}
            style={StyleSheet.absoluteFill}
          />
          {/* Top buttons overlay inside cover */}
          <View style={[styles.headerOverlayRow, { marginTop: insets.top + 10 }]}>
            <Pressable style={styles.circleBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={20} color="#0C2345" />
            </Pressable>
            <Pressable style={styles.circleBtn} onPress={() => setFavorite(!favorite)}>
              <Ionicons name={favorite ? 'heart' : 'heart-outline'} size={20} color={favorite ? '#ef4444' : '#0C2345'} />
            </Pressable>
          </View>
        </ImageBackground>

        {/* Company Identity Floating Panel */}
        <View style={styles.identityCard}>
          <View style={styles.logoFrame}>
            <Ionicons name="settings" size={32} color="#C9A24C" />
          </View>
          <Text style={styles.companyTitle}>{data.companyName}</Text>
          <Text style={styles.companySubTitle}>COMPANY PROFILE</Text>
        </View>

        {/* 1. INDUSTRY BADGES */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Industry Badges</Text>
          <View style={styles.badgeRow}>
            {data.badges.map((badge, idx) => (
              <View
                key={idx}
                style={[
                  styles.badge,
                  idx === 2 ? styles.badgeGold : styles.badgeNavy,
                ]}>
                <Text
                  style={[
                    styles.badgeText,
                    idx === 2 ? styles.badgeTextGold : styles.badgeTextNavy,
                  ]}>
                  {badge}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* 2. COMPANY SUMMARY */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Company Summary</Text>
          <Text style={styles.bodyText}>{data.description}</Text>
        </View>

        {/* 3. FEATURED PRODUCTS */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitleNoMargin}>Featured Products</Text>
            <Pressable style={styles.seeMoreBtn}>
              <Text style={styles.seeMoreText}>See all</Text>
              <Ionicons name="chevron-forward" size={14} color="#94a3b8" />
            </Pressable>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.productsRow}>
            {data.products.map((prod, idx) => (
              <View key={idx} style={styles.productCard}>
                <Image source={{ uri: prod.image }} style={styles.productImg} />
                <View style={styles.productInfo}>
                  <Text style={styles.productTitle}>{prod.name}</Text>
                  <Text style={styles.productSub}>High quality images</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* 4. CERTIFICATIONS & CONTACTS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Certifications & Contacts</Text>
          <View style={styles.whiteListCard}>
            <View style={styles.listItem}>
              <Ionicons name="ribbon-outline" size={18} color="#0C2345" />
              <Text style={styles.listItemText}>
                {data.certifications.join(', ')}
              </Text>
            </View>
            <View style={styles.listItem}>
              <Ionicons name="call-outline" size={18} color="#0C2345" />
              <Text style={styles.listItemText}>{data.phone}</Text>
            </View>
            <View style={styles.listItem}>
              <Ionicons name="mail-outline" size={18} color="#0C2345" />
              <Text style={styles.listItemText}>{data.email}</Text>
            </View>
            <View style={styles.listItem}>
              <Ionicons name="location-outline" size={18} color="#0C2345" />
              <Text style={styles.listItemText}>{data.stand}</Text>
            </View>
          </View>
        </View>

        {/* 5. ACTION CTAS */}
        <View style={styles.ctaRow}>
          <Pressable style={[styles.ctaBtn, styles.ctaBtnNavy]}>
            <Text style={styles.ctaTextWhite}>Download Brochure</Text>
          </Pressable>
          <Pressable style={[styles.ctaBtn, styles.ctaBtnGold]}>
            <Text style={styles.ctaTextNavy}>Schedule Meeting</Text>
          </Pressable>
        </View>

      </ScrollView>

      {/* Floating Bottom Tab Bar */}
      <View style={[styles.floatingTabBar, { bottom: Math.max(insets.bottom, 16) }]}>
        <Pressable style={styles.tabItem} onPress={() => router.push('/home-v2')}>
          <Ionicons name="home" size={22} color="#0C2345" />
          <Text style={[styles.tabLabel, styles.tabLabelActive]}>Home</Text>
        </Pressable>
        <Pressable style={styles.tabItem} onPress={() => router.push('/map')}>
          <Ionicons name="map-outline" size={22} color="#94a3b8" />
          <Text style={styles.tabLabel}>Map</Text>
        </Pressable>
        <Pressable style={styles.tabItem} onPress={() => router.push('/agenda')}>
          <Ionicons name="calendar-outline" size={22} color="#94a3b8" />
          <Text style={styles.tabLabel}>Agenda</Text>
        </Pressable>
        <Pressable style={styles.tabItem} onPress={() => router.push('/connections')}>
          <Ionicons name="people-outline" size={22} color="#94a3b8" />
          <Text style={styles.tabLabel}>Connect</Text>
        </Pressable>
        <Pressable style={styles.tabItem} onPress={() => router.push('/profile')}>
          <Ionicons name="person-outline" size={22} color="#94a3b8" />
          <Text style={styles.tabLabel}>Profile</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: Radius.pill,
    marginTop: 20,
    marginLeft: 20,
    gap: 6,
    borderWidth: 1.5,
    borderColor: '#dbe2ec',
    zIndex: 100,
  },
  backText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0C2345',
  },
  coverBackground: {
    width: '100%',
  },
  headerOverlayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  circleBtn: {
    width: 38,
    height: 38,
    borderRadius: 99,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#071A33',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  identityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#eef1f6',
    marginHorizontal: 20,
    marginTop: -40,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#071A33',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 15,
    elevation: 4,
  },
  logoFrame: {
    width: 64,
    height: 64,
    borderRadius: 14,
    backgroundColor: 'rgba(201, 162, 76, 0.05)',
    borderWidth: 1.5,
    borderColor: '#ecdcb4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  companyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#071A33',
    letterSpacing: 0.5,
  },
  companySubTitle: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#94a3b8',
    letterSpacing: 1.5,
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#071A33',
    marginBottom: 12,
  },
  sectionTitleNoMargin: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#071A33',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  seeMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeMoreText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
  bodyText: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.pill,
  },
  badgeNavy: {
    backgroundColor: '#0C2345',
  },
  badgeGold: {
    backgroundColor: '#ecdcb4',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  badgeTextNavy: {
    color: '#FFFFFF',
  },
  badgeTextGold: {
    color: '#8a6d15',
  },
  productsRow: {
    gap: 12,
  },
  productCard: {
    width: 154,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#eef1f6',
    overflow: 'hidden',
    shadowColor: '#071A33',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  productImg: {
    width: '100%',
    height: 96,
  },
  productInfo: {
    padding: 10,
  },
  productTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#071A33',
  },
  productSub: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
  },
  whiteListCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#eef1f6',
    padding: 14,
    gap: 12,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  listItemText: {
    fontSize: 12.5,
    color: '#64748b',
    fontWeight: '500',
  },
  ctaRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    marginTop: 25,
  },
  ctaBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#071A33',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  ctaBtnNavy: {
    backgroundColor: '#0C2345',
  },
  ctaBtnGold: {
    backgroundColor: '#d8c286',
  },
  ctaTextWhite: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  ctaTextNavy: {
    color: '#0C2345',
    fontSize: 12.5,
    fontWeight: '700',
  },
  headerOverlayRowBack: {
    position: 'absolute',
    left: 20,
    top: 20,
    zIndex: 1000,
  },
  floatingTabBar: {
    position: 'absolute',
    left: 20,
    right: 20,
    height: 64,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#eef1f6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    shadowColor: '#071A33',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  tabLabel: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '600',
  },
  tabLabelActive: {
    color: '#0C2345',
  },
});
