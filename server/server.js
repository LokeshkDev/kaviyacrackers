const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

function r2Env(name) {
    const v = process.env[name];
    if (v == null) return '';
    return String(v).trim().replace(/^["']|["']$/g, '');
}

function isR2UploadsEnabled() {
    return !!(
        r2Env('R2_ACCOUNT_ID') &&
        r2Env('R2_ACCESS_KEY_ID') &&
        r2Env('R2_SECRET_ACCESS_KEY') &&
        r2Env('R2_BUCKET_NAME') &&
        r2Env('R2_PUBLIC_BASE_URL')
    );
}

let r2S3Client = null;
function getR2S3Client() {
    if (!isR2UploadsEnabled()) return null;
    if (!r2S3Client) {
        const accountId = r2Env('R2_ACCOUNT_ID');
        r2S3Client = new S3Client({
            region: 'auto',
            endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
            credentials: {
                accessKeyId: r2Env('R2_ACCESS_KEY_ID'),
                secretAccessKey: r2Env('R2_SECRET_ACCESS_KEY')
            },
            // R2 does not implement default S3 flexible checksum headers (SDK ≥3.729); see Cloudflare R2 + aws-sdk-js-v3 notes
            requestChecksumCalculation: 'WHEN_REQUIRED'
        });
    }
    return r2S3Client;
}

function publicR2Url(key) {
    const base = r2Env('R2_PUBLIC_BASE_URL').replace(/\/$/, '');
    const k = String(key).replace(/^\//, '');
    return `${base}/${k}`;
}

async function uploadToR2(key, buffer, contentType) {
    const client = getR2S3Client();
    await client.send(new PutObjectCommand({
        Bucket: r2Env('R2_BUCKET_NAME'),
        Key: key,
        Body: buffer,
        ContentType: contentType || 'application/octet-stream'
    }));
}

const DEBUG_LOG_PATH = path.join(__dirname, 'debug-05429b.log');
function debugSessionAppend(payload) {
    try {
        fs.appendFileSync(DEBUG_LOG_PATH, JSON.stringify({ sessionId: '05429b', timestamp: Date.now(), ...payload }) + '\n');
    } catch (_) { /* ignore */ }
}

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log('Connected to MongoDB');
        const count = await Product.countDocuments();
        console.log(`Verified: Found ${count} products in DB.`);
        seedDatabase();
    })
    .catch(err => console.error('MongoDB connection error:', err));

// Schemas
const CategorySchema = new mongoose.Schema({
    name: String,
    image: String,
    link: String
});
const Category = mongoose.model('Category', CategorySchema);

const ProductSchema = new mongoose.Schema({
    id: { type: Number, unique: true },
    name: String,
    category: String,
    content: String,
    rate: Number,
    originalRate: Number,
    image: String,
    active: { type: Boolean, default: true }
});
const Product = mongoose.model('Product', ProductSchema);

const OrderSchema = new mongoose.Schema({
    customerName: String,
    customerPhone: String,
    customerEmail: String,
    customerAddress: String,
    items: Array,
    totalAmount: Number,
    date: { type: Date, default: Date.now },
    status: { type: String, default: 'Pending' }
});
const Order = mongoose.model('Order', OrderSchema);

async function sendOrderEmails(order) {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT || 587;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const sellerEmail = process.env.SELLER_EMAIL;

    // Check if configuration is missing
    if (!smtpHost || !smtpUser || !smtpPass) {
        console.warn('Mailer Warning: SMTP environment variables (SMTP_HOST, SMTP_USER, SMTP_PASS) are not configured. Skipping email sending.');
        return;
    }

    try {
        const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: Number(smtpPort),
            secure: Number(smtpPort) === 465, // true for port 465, false for other ports
            auth: {
                user: smtpUser,
                pass: smtpPass
            }
        });

        // Format items table for HTML
        const items = Array.isArray(order.items) ? order.items : [];
        const itemsHtml = items.map(item => `
            <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: left;">${item.name}</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">₹${item.rate}</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">₹${item.subtotal}</td>
            </tr>
        `).join('');

        const emailBodyHtml = `
            <div style="font-family: 'Outfit', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 12px; background-color: #fdfbf0;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h2 style="color: #eab308; margin-top: 10px; font-weight: bold; letter-spacing: 0.5px;">Kaviya Crackers</h2>
                    <p style="color: #6c757d; font-size: 0.9rem; margin-top: 2px;">Order Enquiry Confirmation</p>
                </div>
                
                <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.02); margin-bottom: 20px; border: 1px solid #eee;">
                    <h3 style="border-bottom: 2px solid #eab308; padding-bottom: 8px; margin-top: 0; color: #1a1a1a; font-size: 1.05rem;">Customer Details</h3>
                    <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
                        <tr>
                            <td style="padding: 4px 0; color: #6c757d; width: 120px;"><strong>Name:</strong></td>
                            <td style="padding: 4px 0; color: #333;">${order.customerName || 'N/A'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 4px 0; color: #6c757d;"><strong>Phone:</strong></td>
                            <td style="padding: 4px 0; color: #333;">${order.customerPhone || 'N/A'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 4px 0; color: #6c757d;"><strong>Email:</strong></td>
                            <td style="padding: 4px 0; color: #333;">${order.customerEmail || 'N/A'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 4px 0; color: #6c757d;"><strong>Address:</strong></td>
                            <td style="padding: 4px 0; color: #333;">${order.customerAddress || 'N/A'}</td>
                        </tr>
                    </table>
                </div>

                <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.02); margin-bottom: 20px; border: 1px solid #eee;">
                    <h3 style="border-bottom: 2px solid #eab308; padding-bottom: 8px; margin-top: 0; color: #1a1a1a; font-size: 1.05rem;">Items Summary</h3>
                    <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
                        <thead>
                            <tr style="background-color: #f8f9fa;">
                                <th style="padding: 8px; border-bottom: 2px solid #ddd; text-align: left; color: #6c757d; font-size: 0.8rem; text-transform: uppercase;">Product</th>
                                <th style="padding: 8px; border-bottom: 2px solid #ddd; text-align: center; color: #6c757d; font-size: 0.8rem; text-transform: uppercase;">Qty</th>
                                <th style="padding: 8px; border-bottom: 2px solid #ddd; text-align: right; color: #6c757d; font-size: 0.8rem; text-transform: uppercase;">Rate</th>
                                <th style="padding: 8px; border-bottom: 2px solid #ddd; text-align: right; color: #6c757d; font-size: 0.8rem; text-transform: uppercase;">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsHtml}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colspan="3" style="padding: 15px 8px 8px; font-weight: bold; text-align: right; font-size: 1.1rem; border-top: 2px solid #ddd;">Grand Total:</td>
                                <td style="padding: 15px 8px 8px; font-weight: bold; text-align: right; color: #eab308; font-size: 1.1rem; border-top: 2px solid #ddd;">₹${order.totalAmount}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                <div style="text-align: center; margin-top: 30px; font-size: 0.75rem; color: #9c9c9c; border-top: 1px solid #eaeaea; padding-top: 15px;">
                    <p style="margin: 0;">This is an automated enquiry email from Kaviya Crackers Store.</p>
                </div>
            </div>
        `;

        const itemsText = items.map(item => `- ${item.name} | Qty: ${item.quantity} | Rate: ₹${item.rate} | Total: ₹${item.subtotal}`).join('\n');
        const emailBodyText = `
Kaviya Crackers - Order Enquiry Confirmation
--------------------------------------------

Customer Details:
- Name: ${order.customerName || 'N/A'}
- Phone: ${order.customerPhone || 'N/A'}
- Email: ${order.customerEmail || 'N/A'}
- Address: ${order.customerAddress || 'N/A'}

Items Summary:
${itemsText}

Grand Total: ₹${order.totalAmount}

--------------------------------------------
Thank you for shopping with Kaviya Crackers! This is an automated enquiry email.
        `.trim();

        const commonHeaders = {
            'X-Mailer': 'Nodemailer',
            'Precedence': 'bulk',
            'X-Auto-Response-Suppress': 'OOF, AutoReply',
            'List-Unsubscribe': `<mailto:${smtpUser}?subject=unsubscribe>`
        };

        // Send to Seller
        if (sellerEmail) {
            await transporter.sendMail({
                from: `"Kaviya Crackers Store" <${smtpUser}>`,
                to: sellerEmail,
                subject: `🔔 New Order Enquiry from ${order.customerName}`,
                html: emailBodyHtml,
                text: emailBodyText,
                replyTo: order.customerEmail || smtpUser,
                headers: commonHeaders
            });
            console.log(`Email successfully sent to seller (${sellerEmail})`);
        }

        // Send to Customer
        if (order.customerEmail) {
            await transporter.sendMail({
                from: `"Kaviya Crackers Store" <${smtpUser}>`,
                to: order.customerEmail,
                subject: `🎆 Your Kaviya Crackers Enquiry Confirmation`,
                html: emailBodyHtml,
                text: emailBodyText,
                replyTo: sellerEmail || smtpUser,
                headers: commonHeaders
            });
            console.log(`Email successfully sent to customer (${order.customerEmail})`);
        }

    } catch (err) {
        console.error('Failed to send order emails:', err);
    }
}

const SettingSchema = new mongoose.Schema({
    key: String,
    value: mongoose.Schema.Types.Mixed
});
const Setting = mongoose.model('Setting', SettingSchema);

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Multer Storage (disk for local; memory when R2 is configured)
for (const dir of ['./assets/img/categories', './assets/img/products']) {
    fs.mkdirSync(dir, { recursive: true });
}

const categoryStorage = multer.diskStorage({
    destination: './assets/img/categories',
    filename: (req, file, cb) => {
        cb(null, 'cat_' + Date.now() + path.extname(file.originalname));
    }
});
const productStorage = multer.diskStorage({
    destination: './assets/img/products',
    filename: (req, file, cb) => {
        cb(null, 'prod_' + Date.now() + path.extname(file.originalname));
    }
});
const uploadLimits = { fileSize: 15 * 1024 * 1024 };
const uploadCategoryDisk = multer({ storage: categoryStorage, limits: uploadLimits });
const uploadProductDisk = multer({ storage: productStorage, limits: uploadLimits });
const uploadCategoryMem = multer({ storage: multer.memoryStorage(), limits: uploadLimits });
const uploadProductMem = multer({ storage: multer.memoryStorage(), limits: uploadLimits });

// Seed Database with Initial Data
async function seedDatabase() {
    try {
        const prodCount = await Product.countDocuments();
        if (prodCount === 0) {
            console.log('Seeding products...');
            const dummyProducts = JSON.parse(fs.readFileSync('./assets/data/products.json', 'utf8'));
            await Product.insertMany(dummyProducts);
        }

        const catCount = await Category.countDocuments();
        if (catCount === 0) {
            console.log('Seeding categories...');
            const defaultCategories = [
                { name: "Sparklers", image: "assets/img/Kaviya_crackers_logo.jpeg", link: "shop.html" },
                { name: "Flower Pots", image: "assets/img/Kaviya_crackers_logo.jpeg", link: "shop.html" },
                { name: "Rockets", image: "assets/img/Kaviya_crackers_logo.jpeg", link: "shop.html" },
                { name: "Ground Chakkars", image: "assets/img/Kaviya_crackers_logo.jpeg", link: "shop.html" },
                { name: "Fancy Crackers", image: "assets/img/Kaviya_crackers_logo.jpeg", link: "shop.html" },
                { name: "Bombs", image: "assets/img/Kaviya_crackers_logo.jpeg", link: "shop.html" },
                { name: "Kids Crackers", image: "assets/img/Kaviya_crackers_logo.jpeg", link: "shop.html" },
                { name: "Gift Boxes", image: "assets/img/Kaviya_crackers_logo.jpeg", link: "shop.html" }
            ];
            await Category.insertMany(defaultCategories);
        }
    } catch (err) {
        console.error('Seeding error:', err);
    }
}

// API Routes
app.post('/api/login', (req, res) => {
    console.log('Login attempt:', req.body.username);
    const { username, password } = req.body;
    if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false, message: 'Invalid Credentials' });
    }
});

app.get('/api/data', async (req, res) => {
    try {
        const products = await Product.find();
        const categories = await Category.find();
        const orders = await Order.find().sort({ date: -1 });
        const settingsList = await Setting.find();
        const settings = {};
        settingsList.forEach(s => settings[s.key] = s.value);
        
        res.json({ products, categories, orders, settings });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/data', async (req, res) => {
    try {
        const { products, categories, orders, settings } = req.body;
        
        if (products) {
            await Product.deleteMany({});
            await Product.insertMany(products);
        }
        if (categories) {
            await Category.deleteMany({});
            await Category.insertMany(categories);
        }
        if (orders) {
            await Order.deleteMany({});
            await Order.insertMany(orders);
        }
        if (settings) {
            for (const key in settings) {
                await Setting.findOneAndUpdate({ key }, { value: settings[key] }, { upsert: true, new: true });
            }
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update specific order status
app.patch('/api/orders/:id', async (req, res) => {
    try {
        const { status } = req.body;
        await Order.findOneAndUpdate({ id: req.params.id }, { status });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create new order
app.post('/api/orders', async (req, res) => {
    try {
        const newOrder = new Order(req.body);
        await newOrder.save();

        // Fire-and-forget sending emails in background to prevent API blocking
        sendOrderEmails(newOrder).catch(e => console.error('Background sendOrderEmails error:', e));

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Fetch all settings
app.get('/api/settings', async (req, res) => {
    try {
        const settings = await Setting.find({});
        const settingsMap = {};
        settings.forEach(s => settingsMap[s.key] = s.value);
        res.json(settingsMap);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/debug-session-log', (req, res) => {
    try {
        const line = typeof req.body === 'object' && req.body !== null
            ? JSON.stringify(req.body)
            : '{}';
        fs.appendFileSync(DEBUG_LOG_PATH, line + '\n');
    } catch (_) { /* ignore */ }
    res.status(204).end();
});

app.post('/api/upload-category', (req, res, next) => {
    const useR2 = isR2UploadsEnabled();
    const uploadMw = useR2 ? uploadCategoryMem.single('image') : uploadCategoryDisk.single('image');
    uploadMw(req, res, (err) => {
        const hid = err ? 'H1' : (req.file ? 'H0' : 'H4');
        // #region agent log
        debugSessionAppend({ runId: 'post-fix2', hypothesisId: hid, location: 'server.js:upload-category', message: 'multer finished', data: { storage: useR2 ? 'r2' : 'disk', hasErr: !!err, errCode: err && err.code, errMessage: err && String(err.message), hasFile: !!req.file, filename: req.file && req.file.filename } });
        // #endregion
        if (err) return next(err);
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }
        if (useR2) {
            const ext = path.extname(req.file.originalname || '') || '.jpg';
            const key = `categories/cat_${Date.now()}${ext}`;
            uploadToR2(key, req.file.buffer, req.file.mimetype)
                .then(() => {
                    debugSessionAppend({ runId: 'post-fix2', location: 'server.js:upload-category', message: 'r2 ok', data: { key } });
                    res.json({ success: true, path: publicR2Url(key) });
                })
                .catch(next);
            return;
        }
        res.json({ success: true, path: 'assets/img/categories/' + req.file.filename });
    });
});

app.post('/api/upload-product', (req, res, next) => {
    const useR2 = isR2UploadsEnabled();
    const uploadMw = useR2 ? uploadProductMem.single('image') : uploadProductDisk.single('image');
    uploadMw(req, res, (err) => {
        const hid = err ? 'H1' : (req.file ? 'H0' : 'H4');
        // #region agent log
        debugSessionAppend({ runId: 'post-fix2', hypothesisId: hid, location: 'server.js:upload-product', message: 'multer finished', data: { storage: useR2 ? 'r2' : 'disk', hasErr: !!err, errCode: err && err.code, errMessage: err && String(err.message), hasFile: !!req.file, filename: req.file && req.file.filename } });
        // #endregion
        if (err) return next(err);
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }
        if (useR2) {
            const ext = path.extname(req.file.originalname || '') || '.jpg';
            const key = `products/prod_${Date.now()}${ext}`;
            uploadToR2(key, req.file.buffer, req.file.mimetype)
                .then(() => {
                    debugSessionAppend({ runId: 'post-fix2', location: 'server.js:upload-product', message: 'r2 ok', data: { key } });
                    res.json({ success: true, path: publicR2Url(key) });
                })
                .catch(next);
            return;
        }
        res.json({ success: true, path: 'assets/img/products/' + req.file.filename });
    });
});

app.use((err, req, res, next) => {
    if (req.url && String(req.url).includes('upload')) {
        // #region agent log
        debugSessionAppend({ runId: 'post-fix2', hypothesisId: 'H1', location: 'server.js:upload-error-mw', message: 'upload route error', data: { url: req.url, errName: err && err.name, errMessage: err && String(err.message) } });
        // #endregion
    }
    if (err instanceof multer.MulterError) {
        return res.status(400).json({ success: false, message: err.message });
    }
    if (req.url && String(req.url).includes('upload')) {
        return res.status(500).json({ success: false, message: err.message || 'Upload failed' });
    }
    next(err);
});

app.use(express.static('./'));

// Start Server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
    console.log(`Image uploads: ${isR2UploadsEnabled() ? 'Cloudflare R2' : 'local disk (assets/img/...)'}`);
    console.log('Debug: POST /api/debug-session-log → ./debug-05429b.log (restart server after editing server.js)');
});
