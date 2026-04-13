export interface University {
  _id: string;
  name: string;
  acronym: string;
  address: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Course {
  _id: string;
  name: string;
  universityId: string | { _id: string; name: string; acronym: string };
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Bus {
  _id: string;
  identifier: string;
  capacity: number;
  universityIds: Array<{ _id: string; name: string; acronym: string }>;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BusStudent {
  _id: string;
  name: string;
  email: string;
  shift?: string;
  institution?: string;
  degree?: string;
  bus?: string;
}