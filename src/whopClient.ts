import axios from 'axios';
import config from './config';
import { WhopServerSdk } from "@whop/api";
import mongoose from 'mongoose';
import ProductModel from './models/Product';
import MembershipModel from './models/Membership';

export const whopSdk = WhopServerSdk({
  appId: config.whopAppId,
  appApiKey: config.whopApiKey,
  onBehalfOfUserId: config.whopAgentUserId,
  companyId: config.whopCompanyId,
});

export interface Product {
  id: string;
  name: string;
  description?: string;
  price?: number;
  status?: string;
  [key: string]: any;
}

export interface Membership {
  id: string;
  user: string;
  product: string;
  email?: string;
  status: string;
  valid: boolean;
  [key: string]: any;
}

export interface Attachment {
  directUploadId?: string;
  id?: string;
}

export interface MessagePayload {
  toUserIdOrUsername: string;
  message: string;
  attachments?: Attachment[];
}

export interface ApiResponse<T> {
  data: T;
  error: string | null;
}

export interface MessageResponse {
  success: boolean;
  data: any;
  error: string | null;
  notificationType?: string;
  timestamp?: string;
}

export class WhopClient {
  private v2ProductsToken: string;
  private apiKey: string;
  private baseURL: string;

  constructor(apiKey: string = config.whopApiKey) {
    this.v2ProductsToken = config.v2ProductsToken;
    this.apiKey = apiKey;
    this.baseURL = config.baseUrl;
  }

  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.v2ProductsToken}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };
  }

  async getProducts(): Promise<ApiResponse<Product[]>> {
    try {
      // Read from MongoDB
      if (mongoose.connection.readyState !== 1) {
        return { data: [], error: 'Database not connected' };
      }
      const docs = await ProductModel.find({}).lean();
      const products: Product[] = docs.map((p: any) => ({
        id: p.productId,
        name: p.title,
        title: p.title,
        visibility: p.visibility,
        activeUsersCount: p.activeUsers,
      }));
      return { data: products, error: null };
    } catch (error: any) {
      console.error('[WhopClient] Error fetching products:', error.message);
      return { data: [], error: error.message };
    }
  }

  async getMemberships(): Promise<ApiResponse<Membership[]>> {
    try {
      // Read from MongoDB
      if (mongoose.connection.readyState !== 1) {
        return { data: [], error: 'Database not connected' };
      }
      const docs = await MembershipModel.find({}).lean();
      const memberships: Membership[] = docs.map((m: any) => ({
        id: m.membershipId,
        user: m.userId,
        product: m.productId,
        email: m.email,
        status: 'completed',
        valid: true,
      }));
      return { data: memberships, error: null };
    } catch (error: any) {
      console.error('[WhopClient] Error fetching memberships:', error.message);
      return { data: [], error: error.message };
    }
  }

  async sendDirectMessage(
    toUserIdOrUsername: string,
    message: string,
    attachments: Attachment[] = []
  ): Promise<MessageResponse> {
    try {
      // Validate input
      if (!toUserIdOrUsername || toUserIdOrUsername.trim() === '') {
        const errorMsg = 'User ID or username is required';
        console.error('[WhopClient] Validation error:', errorMsg);
        return {
          success: false,
          data: null,
          error: errorMsg
        };
      }

      if (!message || message.trim() === '') {
        const errorMsg = 'Message content is required';
        console.error('[WhopClient] Validation error:', errorMsg);
        return {
          success: false,
          data: null,
          error: errorMsg
        };
      }

      const result = await whopSdk.messages.sendDirectMessageToUser({
        toUserIdOrUsername,
        message,
        attachments
      });

      console.log(`[WhopClient] ✅ DM sent successfully to: ${toUserIdOrUsername}`);
      return { success: true, data: result, error: null };
    } catch (error: any) {
      console.error('[WhopClient] Error sending DM:', error.message);
      return { success: false, data: null, error: error.message };
    }
  }
}

export default WhopClient;
