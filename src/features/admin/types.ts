export interface DashboardStats {
  hospitalCount: number;
  departmentCount: number;
  doctorCount: number;
  registrationCount: number;
  todayRegistrationCount: number;
  pendingCount: number;
  userCount: number;
}

export interface AdminMenuItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

export interface OverviewData {
  stats: DashboardStats;
  recentRegistrations: {
    id: string;
    patientName: string;
    doctorName: string;
    hospitalName: string;
    date: string;
    status: string;
    createdAt: Date;
  }[];
}
