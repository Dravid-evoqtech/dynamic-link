import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

app.set('trust proxy', 1);

app.use(
  cors({
    origin: [
      process.env.CORS_ORIGIN,
      process.env.CORS_ORIGIN_ADMIN,
      'http://localhost:8081',
      'http://localhost:3000',
    ],
    credentials: true,
    maxAge: parseInt(process.env.CORS_MAX_AGE, 10),
  })
);
app.use(cookieParser());

app.use(express.json({ limit: '99mb' }));
app.use(express.urlencoded({ extended: true, limit: '99mb' }));
app.use(express.static('public'));
app.use(bodyParser.json({ limit: '99mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '99mb' }));
app.use(bodyParser.text({ limit: '99mb' }));
app.use(bodyParser.raw({ limit: '99mb' }));
app.use(bodyParser.json({ type: 'application/vnd.api+json', limit: '99mb' }));
app.use(bodyParser.json({ type: 'application/json', limit: '99mb' }));
app.use(bodyParser.text({ type: 'text/plain', limit: '99mb' }));

app.use(morgan('dev'));
app.set('view engine', 'ejs');
// app.set('views', './views');
app.set("views", path.join(__dirname, "views"));
import userRouter from './routes/user.routes.js';
import userDataRouter from './routes/userData.route.js';
import opportunityRouter from './routes/opportunity.routes.js';
import applicationRouter from './routes/application.route.js';
import notificationRouter from './routes/notification.routes.js';
import logindataRouter from './routes/logindata.routes.js';
import referralRouter from './routes/referral.routes.js';
import appDetectionRouter from './routes/appDetection.routes.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { updateLastActive } from './middlewares/updateActivity.middleware.js';
import adminRouter from './routes/admin/adminAuth.routes.js';
import adminUserRouter from './routes/admin/adminUser.routes.js';
import adminOpportunityRouter from './routes/admin/adminOpportunity.routes.js';
import adminDashboardRouter from './routes/admin/adminDashboard.routes.js';
import adminSettingsRouter from './routes/admin/adminSettings.route.js';


// http://localhost:5000/api/v1/users/routes
app.use('/api/v1/users', userRouter);
app.use('/api/v1/auth', adminRouter);
app.use('/api/v1/admin/users', adminUserRouter);
app.use('/api/v1/admin/opportunities', adminOpportunityRouter);
app.use('/api/v1/admin/dashboard', adminDashboardRouter);
app.use('/api/v1/admin/settings', adminSettingsRouter);

// http://localhost:5000/api/v1/user-data/routes
app.use('/api/v1/user-data', userDataRouter);

// http://localhost:5000/api/v1/opportunity/routes
app.use('/api/v1/opportunity', opportunityRouter);

// http://localhost:5000/api/v1/application/routes
app.use('/api/v1/application', applicationRouter);

// http://localhost:5000/api/v1/notify/routes
app.use('/api/v1/notify', notificationRouter);

// http://localhost:5000/referral/routes
app.use('/referral', referralRouter);

// http://localhost:5000/app-detection/routes
app.use('/app-detection', appDetectionRouter);

//----------------for testing only -----------------------
// http://localhost:5000/api/v1/logindata/routes
app.use('/api/v1/logindata', logindataRouter);



// Route to serve the install page
// app.get('/install', (req, res) => {
//   res.render('install', {
//     appStoreUrl: process.env.APP_STORE_URL,
//     playStoreUrl: process.env.PLAY_STORE_URL,
//   });
// });
app.get("/install", async (req, res) => {
  console.log("Install route hit with query:", req.query);
  
  const { token } = req.query;
  const userAgent = req.get('user-agent') || '';
  
  // Detect platform and get optimized configuration
  const ua = userAgent.toLowerCase();
  const isMobile = /android|iphone|ipad|ipod/i.test(ua);
  const isInAppBrowser = /whatsapp|telegram|facebook|instagram|twitter|linkedin/i.test(ua);
  const platform = ua.includes('android') ? 'android' : 
                   ua.includes('iphone') || ua.includes('ipad') ? 'ios' : 'desktop';
  
  // Optimize timeout based on platform and browser
  let detectionTimeout;
  if (isInAppBrowser) {
    detectionTimeout = 4000; // Longer timeout for in-app browsers
  } else if (platform === 'ios') {
    detectionTimeout = 3000; // Increased from 2000
  } else if (platform === 'android') {
    detectionTimeout = 4000; // Increased from 3000
  } else {
    detectionTimeout = 2500;
  }
  
  console.log(`Platform: ${platform}, InApp: ${isInAppBrowser}, Timeout: ${detectionTimeout}ms`);
  
  res.render("install-optimized", {
    token,
    platform,
    isMobile,
    isInAppBrowser,
    appStoreUrl: process.env.APP_STORE_URL,
    playStoreUrl: process.env.PLAY_STORE_URL,
    deepLinkScheme: 'FutureFind://SignUp',
    detectionTimeout,
    enableSmartDetection: isMobile, // Enable smart detection only for mobile devices
    trackingId: Math.random().toString(36).substring(2, 15)
  });
});

app.get('/', (req, res) => res.send('Backend of FutureFind by FutureFinders'));
// Serve static landing files and .well-known
app.use(
  express.static(path.join(__dirname, 'public'), {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('apple-app-site-association')) {
        res.setHeader('Content-Type', 'application/json');
      }
    },
  })
);

// Serve .well-known files for Android & iOS verification
app.get('/.well-known/assetlinks.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send([
    {
      relation: ['delegate_permission/common.handle_all_urls'],
      target: {
        namespace: process.env.ANDROID_PACKAGE,
        package_name: process.env.ANDROID_PACKAGE,
        sha256_cert_fingerprints: [process.env.ANDROID_SHA256],
      },
    },
  ]);
});

app.get(
  ['/.well-known/apple-app-site-association', '/apple-app-site-association'],
  (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send({
      applinks: {
        apps: [],
        details: [
          {
            appID: process.env.IOS_APP_ID,
            paths: ['/referral/*', '/signup/*', '/install*'],
          },
        ],
      },
    });
  }
);

app.use(updateLastActive);

app.use(errorHandler);


export { app };
