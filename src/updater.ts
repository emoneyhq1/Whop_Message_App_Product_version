import WhopClient from './whopClient';
import connectToDatabase from './db';
import axios from 'axios';
import mongoose from 'mongoose';
import config from './config'
import ProductModel from './models/Product';
import MembershipModel from './models/Membership';
import SyncStateModel from './models/SyncState';

const INTERVAL_MS = parseInt(process.env.UPDATE_INTERVAL_MS || '60000', 10); // default 60s

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

export async function startUpdater() {
    try {
        await connectToDatabase();
        console.log('[Updater] Database connected successfully');
    } catch (error: any) {
        console.error('[Updater] Failed to connect to database:', error.message);
        throw error;
    }
    
    const client = new WhopClient();

    const getProducts = async () => {
        try {
            let currentPage = 1;
            let total_page = 1;
            let totalProcessed = 0;

            while (true) {
                if (currentPage > total_page) break;
                const response = await axios.get(`${config.baseUrl}/api/v2/products?page=${currentPage}&per=50`, {
                    headers: {
                        'Authorization': `Bearer ${config.v2ProductsToken}`,
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                });
                total_page = response.data.pagination?.total_page || response.data.total_page || 1;

                const products = response.data.data || [];
                
                // Process products immediately instead of accumulating in memory
                if (mongoose.connection.readyState === 1 && products.length > 0) {
                    const ops = products.map((p: any) => ({
                        updateOne: {
                            filter: { productId: p.id },
                            update: {
                                $set: {
                                    productId: p.id,
                                    visibility: p.visibility || p.status || p.marketplaceStatus,
                                    title: p.title || p.name,
                                    activeUsers: p.activeUsersCount || 0,
                                }
                            },
                            upsert: true
                        }
                    }));
                    await (ProductModel as any).bulkWrite(ops, { ordered: false });
                    totalProcessed += products.length;
                    console.log(`[WhopClient] processed ${products.length} products (page ${currentPage})`);
                }

                currentPage++;
                await new Promise(resolve => setTimeout(resolve, 200));
                
                // Force garbage collection every 10 pages
                if (currentPage % 10 === 0) {
                    if (global.gc) {
                        global.gc();
                    }
                }
            }
            console.log(`[WhopClient] fetched and processed products: ${totalProcessed}`);

            return { data: [], error: null };
        } catch (error: any) {
            console.error('[WhopClient] Error fetching products:', error.message);
            return { data: [], error: error.message };
        }
    }

    const getMemberships = async () => {
        try {
            let currentPage = 1;
            let total_page = 1;
            let totalProcessed = 0;

            let lastSyncState = await SyncStateModel.findOne({ key: 'memberships' });
            if (lastSyncState) currentPage = lastSyncState.lastPageProcessed + 1;
            console.log(`[WhopClient] starting from page ${currentPage}`);
            
            while (true) {
                if (currentPage > total_page && !lastSyncState) {
                    await SyncStateModel.updateOne({ key: 'memberships' }, { $set: { lastPageProcessed: 0 } });
                    console.log('reset lastPageProcessed');
                    break;
                }
                const response = await axios.get(`${config.baseUrl}${config.membershipsUrl}?page=${currentPage}&per=50`, {
                    headers: {
                        'Authorization': `Bearer ${config.v2ProductsToken}`,
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                });
                total_page = response.data.pagination?.total_page || response.data.total_page || 1;
                const memberships = response.data.data || [];
                
                // Process memberships immediately instead of accumulating in memory
                if (mongoose.connection.readyState === 1 && memberships.length > 0) {
                    const ops = memberships.map((m: any) => ({
                        updateOne: {
                            filter: { membershipId: m.id },
                            update: {
                                $set: {
                                    membershipId: m.id,
                                    userId: m.user,
                                    email: m.email || null,
                                    productId: m.product || undefined,
                                }
                            },
                            upsert: true
                        }
                    }));
                    await (MembershipModel as any).bulkWrite(ops, { ordered: false });
                    
                    let existingSyncState = await SyncStateModel.findOne({ key: 'memberships' });
                    if (existingSyncState) {
                        existingSyncState.lastPageProcessed = currentPage;
                        await existingSyncState.save();
                    } else {
                        await SyncStateModel.create({ key: 'memberships', lastPageProcessed: currentPage });
                    }
                    console.log(`[WhopClient] upserted ${ops.length} memberships (page ${currentPage})`);

                    // Increment activeUsers for products matching these memberships
                    const countByProduct: Record<string, number> = {};
                    for (const m of memberships) {
                        const productId = m.product;
                        if (!productId) continue;
                        countByProduct[productId] = (countByProduct[productId] || 0) + 1;
                    }
                    const incOps = Object.entries(countByProduct).map(([productId, count]) => ({
                        updateOne: {
                            filter: { productId },
                            update: { $inc: { activeUsers: count as number } },
                            upsert: false
                        }
                    }));
                    if (incOps.length > 0) {
                        await (ProductModel as any).bulkWrite(incOps, { ordered: false });
                    }
                    
                    totalProcessed += memberships.length;
                }

                currentPage++;
                await new Promise(resolve => setTimeout(resolve, 200));
                
                // Force garbage collection every 10 pages
                if (currentPage % 10 === 0) {
                    if (global.gc) {
                        global.gc();
                    }
                }
            }
            console.log(`[WhopClient] fetched and processed memberships: ${totalProcessed}`);

            return { data: [], error: null };
        } catch (error: any) {
            console.error('[WhopClient] Error fetching memberships:', error.message);
            return { data: [], error: error.message };
        }
    }

    const run = async () => {
        try {
            console.log('[Updater] Running data sync...');
            await getProducts();
            await getMemberships();
            console.log('[Updater] Sync complete');
        } catch (err: any) {
            console.error('[Updater] Sync failed:', err.message);
        }
    };

    // initial run
    await run();
    // periodic
    setInterval(run, INTERVAL_MS);
}

// If executed directly
if (require.main === module) {
    startUpdater();
}


