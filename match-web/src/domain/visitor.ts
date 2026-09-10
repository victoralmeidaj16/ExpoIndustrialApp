import {
  type FirestoreDataConverter,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';

export type VisitorProfile = {
  uid: string;
  name: string;
  role: string;
  company: string;
  area: string;
  budget: string;
  bottlenecks: string[];
  phone?: string;
  email?: string;
  linkedin?: string;
  website?: string;
  roleType?: string;
  sector?: string[];
  marketRole?: string;
  objectives?: string[];
  interests?: string[];
  lookingFor?: string;
  offering?: string;
  photoUrl?: string;
  discoverable?: boolean;
  shareContact?: boolean;
  onboardingCompleted?: boolean;
  onboardingSkipped?: boolean;
  /** Expo push tokens dos devices deste usuário (um por aparelho). Presença = optou por receber. */
  pushTokens?: string[];
};

export const VISITORS_COLLECTION = 'visitors';
export const VISITOR_PRIVATE_PROFILES_COLLECTION = 'visitorPrivateProfiles';

export type VisitorPrivateProfile = {
  uid: string;
  phone: string;
  email: string;
  linkedin: string;
  website: string;
  pushTokens: string[];
};

export const visitorConverter: FirestoreDataConverter<VisitorProfile> = {
  toFirestore(profile: VisitorProfile) {
    const data: DocumentData = { ...profile };
    delete data.uid;
    return data;
  },
  fromFirestore(snapshot: QueryDocumentSnapshot): VisitorProfile {
    const data = snapshot.data();
    return {
      uid: snapshot.id,
      name: data.name ?? '',
      role: data.role ?? '',
      company: data.company ?? '',
      area: data.area ?? '',
      budget: data.budget ?? '',
      bottlenecks: Array.isArray(data.bottlenecks) ? data.bottlenecks : [],
      phone: '',
      email: '',
      linkedin: '',
      website: '',
      roleType: data.roleType ?? '',
      sector: Array.isArray(data.sector) ? data.sector : [],
      marketRole: data.marketRole ?? '',
      objectives: Array.isArray(data.objectives) ? data.objectives : [],
      interests: Array.isArray(data.interests) ? data.interests : [],
      lookingFor: data.lookingFor ?? '',
      offering: data.offering ?? '',
      photoUrl: data.photoUrl ?? '',
      discoverable: data.discoverable ?? false,
      shareContact: data.shareContact ?? false,
      onboardingCompleted: data.onboardingCompleted ?? false,
      onboardingSkipped: data.onboardingSkipped ?? false,
      pushTokens: [],
    };
  },
};

export const visitorPrivateConverter: FirestoreDataConverter<VisitorPrivateProfile> = {
  toFirestore(profile: VisitorPrivateProfile) {
    const data: DocumentData = { ...profile };
    delete data.uid;
    return data;
  },
  fromFirestore(snapshot: QueryDocumentSnapshot): VisitorPrivateProfile {
    const data = snapshot.data();
    return {
      uid: snapshot.id,
      phone: data.phone ?? '',
      email: data.email ?? '',
      linkedin: data.linkedin ?? '',
      website: data.website ?? '',
      pushTokens: Array.isArray(data.pushTokens) ? data.pushTokens : [],
    };
  },
};

export function mergeVisitorProfile(
  profile: VisitorProfile,
  privateProfile?: VisitorPrivateProfile,
): VisitorProfile {
  if (!privateProfile) return profile;
  return {
    ...profile,
    phone: privateProfile.phone,
    email: privateProfile.email,
    linkedin: privateProfile.linkedin,
    website: privateProfile.website,
    pushTokens: privateProfile.pushTokens,
  };
}
