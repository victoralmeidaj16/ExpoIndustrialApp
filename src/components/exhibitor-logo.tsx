/**
 * Logo do expositor com fallback.
 *
 * Prioriza a imagem hospedada no Firebase Storage (`logoUrl`); se ainda não
 * houver upload — ou se a imagem falhar ao carregar — cai para a sigla textual
 * (`logo`). Assim a mesma fonte de dados serve a lista e o perfil sem duplicar
 * a lógica de fallback em cada tela.
 */
import { useState } from 'react';
import { Image, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { Radius } from '@/constants/theme';

export function ExhibitorLogo({
  logoUrl,
  logo,
  style,
  textSize = 12,
}: {
  logoUrl?: string;
  logo?: string;
  style?: StyleProp<ViewStyle>;
  textSize?: number;
}) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(logoUrl) && !failed;

  return (
    <View style={[styles.box, style]}>
      {showImage ? (
        <Image
          source={{ uri: logoUrl }}
          style={styles.image}
          resizeMode="contain"
          onError={() => setFailed(true)}
        />
      ) : (
        <Text style={[styles.text, { fontSize: textSize }]} numberOfLines={2}>
          {logo}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.sm,
    paddingHorizontal: 6,
    overflow: 'hidden',
  },
  image: { width: '100%', height: '100%' },
  text: { color: '#0A1021', fontWeight: '800', textAlign: 'center' },
});
