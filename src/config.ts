import dotenv from 'dotenv';

dotenv.config();

export interface Config {
  whopAppId: string;
  whopAgentUserId: string;
  whopCompanyId: string;
  whopApiKey: string;
  v2ProductsToken: string;
  port: number;
  nodeEnv: string;
  baseUrl: string;
  membershipsUrl: string;
  messagesUrl: string;
}

const config: Config = {
  // Whop API Configuration
  whopAppId: process.env.WHOP_APP_ID || 'app_LRTKwtJp66rRZ7',
  whopAgentUserId: process.env.WHOP_AGENT_USER_ID || 'user_iUr0YCJOHkmrU',
  whopCompanyId: process.env.WHOP_COMPANY_ID || 'biz_1ZH7VJrbsBzY1D',
  whopApiKey: process.env.WHOP_API_KEY || 'qIudbGoxB8VAxUGN1Oc1dCN5qvEywZF7QvifdmHyoss',
  v2ProductsToken: process.env.V2_PRODUCTS_TOKEN || 'FEKXFF02WWQMWp6k6M5Ilqh7Sf0Blt6Q4aj6tmH1QM',
  
  // Server Configuration
  port: parseInt(process.env.PORT || '8828', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // API URLs
  baseUrl: 'https://api.whop.com',
  membershipsUrl: '/api/v2/memberships',
  messagesUrl: '/api/v2/messages'
};

export default config;
