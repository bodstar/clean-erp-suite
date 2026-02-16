export interface User {
  id: number;
  name: string;
  email: string;
}

export interface Team {
  id: number;
  name: string;
  role: string;
  permissions: string[];
}

export interface AuthResponse {
  token: string;
  user: User;
  teams: Team[];
  current_team_id: number;
}

export interface AuthState {
  user: User | null;
  teams: Team[];
  currentTeamId: number | null;
  permissions: string[];
  isAuthenticated: boolean;
  isLoading: boolean;
}
