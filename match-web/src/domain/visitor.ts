import {
  type FirestoreDataConverter,
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
};

export const VISITORS_COLLECTION = 'visitors';

export const visitorConverter: FirestoreDataConverter<VisitorProfile> = {
  toFirestore(profile: VisitorProfile) {
    const { uid: _omit, ...data } = profile;
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
      phone: data.phone ?? '',
      email: data.email ?? '',
      linkedin: data.linkedin ?? '',
      website: data.website ?? '',
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
    };
  },
};
