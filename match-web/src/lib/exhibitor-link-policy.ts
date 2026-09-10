export type ExhibitorLinkPolicyInput = {
  uid: string;
  email: string;
  emailVerified: boolean;
  targetExhibitorId: string;
  targetOwnerUid?: unknown;
  claimEmail?: unknown;
  contactEmail?: unknown;
  existingOwnedExhibitorId?: string;
};

export type ExhibitorLinkDecision =
  | { alreadyLinked: true }
  | { alreadyLinked: false; normalizedEmail: string; initialStatus: 'draft' };

export class ExhibitorLinkPolicyError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'ExhibitorLinkPolicyError';
  }
}

export function normalizeEmail(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

export function getBoothClaimEmail(data: { claimEmail?: unknown; contactEmail?: unknown }): string {
  return normalizeEmail(data.claimEmail) || normalizeEmail(data.contactEmail);
}

export function isEmailAuthorizedForBooth(
  email: string,
  data: { claimEmail?: unknown; contactEmail?: unknown },
): boolean {
  const normalizedEmail = normalizeEmail(email);
  return Boolean(normalizedEmail) && getBoothClaimEmail(data) === normalizedEmail;
}

/**
 * Autoriza o vínculo somente para a conta verificada e previamente cadastrada
 * pelo organizador. A função é pura para que a política possa ser testada sem
 * Firebase e reutilizada dentro da transação do Admin SDK.
 */
export function evaluateExhibitorLink(input: ExhibitorLinkPolicyInput): ExhibitorLinkDecision {
  const targetOwnerUid = typeof input.targetOwnerUid === 'string' ? input.targetOwnerUid : '';

  if (targetOwnerUid && targetOwnerUid !== input.uid) {
    throw new ExhibitorLinkPolicyError(
      'Este estande já está vinculado a outra conta. Fale com o organizador.',
      409,
    );
  }

  if (
    input.existingOwnedExhibitorId &&
    input.existingOwnedExhibitorId !== input.targetExhibitorId
  ) {
    throw new ExhibitorLinkPolicyError(
      'Esta conta já está vinculada a outro estande. Fale com o organizador.',
      409,
    );
  }

  if (targetOwnerUid === input.uid) {
    return { alreadyLinked: true };
  }

  const normalizedEmail = normalizeEmail(input.email);
  if (!normalizedEmail || !input.emailVerified) {
    throw new ExhibitorLinkPolicyError(
      'Confirme seu e-mail corporativo antes de vincular o estande.',
      403,
    );
  }

  const claimEmail = getBoothClaimEmail(input);
  if (!claimEmail) {
    throw new ExhibitorLinkPolicyError(
      'Este estande ainda não possui um e-mail autorizado. Fale com o organizador.',
      403,
    );
  }

  if (claimEmail !== normalizedEmail) {
    throw new ExhibitorLinkPolicyError(
      'Seu e-mail não está autorizado para vincular este estande.',
      403,
    );
  }

  return { alreadyLinked: false, normalizedEmail, initialStatus: 'draft' };
}
