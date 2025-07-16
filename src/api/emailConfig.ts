import { apiClient } from './apiConfig';

export interface EmailConfig {
  email_host: string;
  email_port: number;
  email_use_tls: boolean;
  email_host_user: string;
  email_host_password_set: boolean;
}

export interface EmailConfigUpdate {
  email_host?: string;
  email_port?: number;
  email_use_tls?: boolean;
  email_host_user?: string;
  email_host_password?: string;
}

export interface EmailConfigResponse {
  status: string;
  message: string;
  updated_fields?: string[];
}

export interface TestEmailResponse {
  status: string;
  message: string;
}

export const emailConfigAPI = {
  // Get current email configuration
  getConfig: async (): Promise<EmailConfig> => {
    const response = await apiClient.get('/api/email-config/');
    return response.data;
  },

  // Update email configuration
  updateConfig: async (config: EmailConfigUpdate): Promise<EmailConfigResponse> => {
    const response = await apiClient.post('/api/email-config/update/', config);
    return response.data;
  },

  // Test email configuration
  testConfig: async (): Promise<TestEmailResponse> => {
    const response = await apiClient.post('/api/email-config/test/');
    return response.data;
  },
};