import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Brand, Radius, Spacing } from '@/constants/theme';

export default function PrivacyScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={Brand.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Política de Privacidade</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={true}>
        <Text style={styles.lastUpdated}>Última atualização: 30 de Junho de 2026</Text>

        <Text style={styles.paragraph}>
          A sua privacidade é de extrema importância para nós. Esta Política de Privacidade descreve
          como coletamos, usamos, armazenamos e protegemos as suas informações ao utilizar o
          aplicativo **Expo Industrial Sul**.
        </Text>

        <Text style={styles.sectionTitle}>1. Informações que Coletamos</Text>
        <Text style={styles.paragraph}>
          Ao se cadastrar e utilizar o aplicativo, coletamos os seguintes dados básicos:
          {'\n'}• Nome completo
          {'\n'}• Número de WhatsApp
          {'\n'}• Endereço de e-mail
          {'\n'}• Informações profissionais (cargo, empresa, atuação industrial, interesses e objetivos na feira)
        </Text>

        <Text style={styles.sectionTitle}>2. Como Utilizamos as Informações</Text>
        <Text style={styles.paragraph}>
          Os dados coletados são utilizados exclusivamente para:
          {'\n'}• Gerar o seu crachá digital de acesso aos estandes do evento.
          {'\n'}• Recomendar expositores e estandes alinhados com o seu perfil industrial.
          {'\n'}• Conectar você a outros profissionais qualificados da feira (caso você ative a opção de Matchmaking de Pessoas).
          {'\n'}• Enviar notificações importantes sobre o cronograma, palestras e alertas do evento.
        </Text>

        <Text style={styles.sectionTitle}>3. Compartilhamento e Privacidade</Text>
        <Text style={styles.paragraph}>
          Nossos pilares de segurança e privacidade garantem que:
          {'\n'}• Seus dados de contato (WhatsApp e E-mail) **nunca** serão compartilhados publicamente.
          {'\n'}• Seus dados de contato só serão liberados para outro profissional após uma solicitação de conexão ser aceita de forma bidirecional (ambos os lados aceitarem).
          {'\n'}• Ao escanear seu QR Code em um estande expositor participante, você concorda em compartilhar seus dados básicos de crachá profissional com o respectivo expositor.
        </Text>

        <Text style={styles.sectionTitle}>4. Controle do Usuário e Exclusão</Text>
        <Text style={styles.paragraph}>
          Você tem total controle sobre seus dados e pode:
          {'\n'}• Ativar ou desativar a sua visibilidade na rede de matchmaking a qualquer momento na aba Perfil.
          {'\n'}• Solicitar a exclusão permanente de todos os seus dados e registro da conta de nossos servidores através da opção **"Excluir Minha Conta"** nas configurações do seu Perfil.
        </Text>

        <Text style={styles.sectionTitle}>5. Contato</Text>
        <Text style={styles.paragraph}>
          Se tiver qualquer dúvida sobre esta Política de Privacidade, entre em contato com a organização do evento pelo e-mail: contato@expoindustrialsul.com.br.
        </Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Brand.bgPrimary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: Brand.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
    backgroundColor: Brand.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Brand.border,
  },
  headerTitle: {
    color: Brand.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  content: {
    padding: Spacing.four,
  },
  lastUpdated: {
    color: Brand.textMuted,
    fontSize: 12,
    marginBottom: Spacing.three,
  },
  sectionTitle: {
    color: Brand.gold,
    fontSize: 16,
    fontWeight: '800',
    marginTop: Spacing.four,
    marginBottom: Spacing.two,
  },
  paragraph: {
    color: Brand.textSecondary,
    fontSize: 14,
    lineHeight: 22,
  },
});
