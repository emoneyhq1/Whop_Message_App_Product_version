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
    await connectToDatabase();
    const client = new WhopClient();

    const getProducts = async () => {
        try {
            const allProducts: Product[] = [];
            let currentPage = 1;
            let total_page = 1;

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
                allProducts.push(...products);

                currentPage++;
                await new Promise(resolve => setTimeout(resolve, 200))
            }
            console.log(`[WhopClient] fetched products: ${allProducts.length}`)

            // Upsert into MongoDB
            if (mongoose.connection.readyState === 1 && allProducts.length > 0) {
                const ops = allProducts.map((p: any) => ({
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
                console.log(`[WhopClient] upserted ${ops.length} products`);
            }

            return { data: allProducts, error: null };
        } catch (error: any) {
            console.error('[WhopClient] Error fetching products:', error.message);
            return { data: [], error: error.message };
        }
    }

    const getMemberships = async () => {
        try {
            const allMemberships: Membership[] = [];
            let currentPage = 1;
            let total_page = 1;

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
                allMemberships.push(...memberships);
                // Upsert only the current page's memberships to avoid duplicate work
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
                }

                currentPage++;
                await new Promise(resolve => setTimeout(resolve, 200))
            }
            console.log(`[WhopClient] fetched memberships: ${allMemberships.length}`)


            return { data: allMemberships, error: null };
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


