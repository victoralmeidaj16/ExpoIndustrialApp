import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Brand, Radius, Spacing } from '@/constants/theme';

export default function TermsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={Brand.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Termos de Uso</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={true}>
        <Text style={styles.lastUpdated}>Última atualização: 30 de Junho de 2026</Text>

        <Text style={styles.paragraph}>
          Bem-vindo ao **Expo Industrial Sul**. Ao baixar, acessar ou utilizar nosso aplicativo,
          você concorda em estar vinculado a estes Termos de Uso. Caso não concorde com qualquer
          uma das condições descritas abaixo, solicitamos que não utilize a ferramenta.
        </Text>

        <Text style={styles.sectionTitle}>1. Aceite dos Termos e Legitimidade</Text>
        <Text style={styles.paragraph}>
          Ao prosseguir, você declara que:
          {'\n'}• Os dados fornecidos no Passo 1 do onboarding (Nome, WhatsApp, E-mail e Empresa) são verdadeiros e de sua autoria.
          {'\n'}• O aplicativo deve ser utilizado unicamente para fins profissionais e de relacionamento relacionados ao ecossistema industrial da feira.
        </Text>

        <Text style={styles.sectionTitle}>2. Código de Conduta de Matchmaking</Text>
        <Text style={styles.paragraph}>
          Nosso objetivo é fomentar conexões qualificadas. Portanto:
          {'\n'}• É proibido o envio de SPAM, mensagens ofensivas, conteúdo impróprio ou publicidades não autorizadas para as suas conexões estabelecidas.
          {'\n'}• Caso identifiquemos comportamento inadequado ou tentativas de captar contatos de forma abusiva, a organização do evento reserva-se o direito de suspender ou banir sua conta do aplicativo imediatamente sem aviso prévio.
        </Text>

        <Text style={styles.sectionTitle}>3. Uso dos Estandes e Leitores de QR Code</Text>
        <Text style={styles.paragraph}>
          • O compartilhamento de contatos com expositores ocorre de forma voluntária ao apresentar seu QR Code para leitura no estande físico deles.
          • A partir desse momento, a empresa expositora passa a ter acesso aos seus dados básicos profissionais preenchidos para fins de propostas comerciais pós-evento.
        </Text>

        <Text style={styles.sectionTitle}>4. Isenção de Responsabilidade</Text>
        <Text style={styles.paragraph}>
          A organização do evento empenha seus melhores esforços no funcionamento do aplicativo, mas:
          {'\n'}• Não garante que o serviço será 100% ininterrupto ou livre de erros durante os dias do evento devido a instabilidades de conexões locais de rede.
          {'\n'}• Não se responsabiliza por eventuais perdas ou negociações malsucedidas entre visitantes e expositores iniciadas através da ferramenta.
        </Text>

        <Text style={styles.sectionTitle}>5. Modificações nos Termos</Text>
        <Text style={styles.paragraph}>
          Reservamo-nos o direito de modificar estes Termos de Uso a qualquer momento. Quaisquer alterações serão atualizadas nesta tela e o uso contínuo do aplicativo após as alterações constituirá o seu aceite tácito.
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
