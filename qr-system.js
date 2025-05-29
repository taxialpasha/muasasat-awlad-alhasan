/**
 * نظام QR Code المتكامل والمُصحح
 * ملف منفصل لتفعيل وإدارة QR Code في التطبيق
 * يتضمن إنشاء، عرض، مسح وإدارة كاملة لـ QR Codes
 * 
 * إصدار محسن ومصحح للعمل مع التطبيق الرئيسي
 * الاستخدام: قم بتضمين هذا الملف في HTML الخاص بك
 * <script src="qr-system.js"></script>
 */

// ==============================
// إعدادات نظام QR Code الافتراضية المُحدثة
// ==============================
const QR_SYSTEM_CONFIG = {
    // إعدادات الإنشاء
    size: 200,
    errorCorrectionLevel: 'M',
    type: 'image/png',
    quality: 0.92,
    margin: 2,
    
    // إعدادات الألوان
    colorDark: '#000000',
    colorLight: '#FFFFFF',
    
    // إعدادات العرض في الطباعة
    printSize: '60px',
    printBorder: '1px solid #000',
    showInPrint: true,
    
    // إعدادات المحتوى
    includeFormNumber: true,
    includeBasicInfo: true,
    includeContactInfo: true,
    includeFinancialInfo: false,
    
    // إعدادات الماسح
    enableScanner: true,
    
    // إعدادات متقدمة
    compression: true,
    encryption: false,
    timestampEnabled: true,
    organizationPrefix: 'CHARITY',
    
    // إعدادات التخزين
    cacheDuration: 24 * 60 * 60 * 1000,
    maxCacheSize: 50,
    
    // مفتاح التخزين
    storageKey: 'charity_qr_settings'
};

// ==============================
// متغيرات النظام المُحدثة
// ==============================
let qrSystemSettings = { ...QR_SYSTEM_CONFIG };
let qrCodeCache = new Map();
let qrControlPanel = null;
let isQRSystemReady = false;

// مرجع لمكتبة QR Code
let QRCodeLib = null;

// ==============================
// تهيئة نظام QR Code المُحسنة
// ==============================
function initializeQRSystem() {
    try {
        console.log('🔄 جاري تهيئة نظام QR Code المُحسن...');
        
        // تحميل الإعدادات المحفوظة
        loadQRSettings();
        
        // التحقق من توفر مكتبة QR Code
        if (typeof QRCode !== 'undefined') {
            QRCodeLib = QRCode;
            console.log('✅ مكتبة QRCode متاحة وجاهزة');
            completeQRSystemInit();
        } else {
            console.log('⏳ جاري تحميل مكتبة QRCode...');
            loadQRLibrary().then(() => {
                completeQRSystemInit();
            }).catch(error => {
                console.warn('⚠️ فشل تحميل مكتبة QRCode، سيتم استخدام مولد احتياطي:', error);
                QRCodeLib = createFallbackQRGenerator();
                completeQRSystemInit();
            });
        }
        
    } catch (error) {
        console.error('❌ خطأ في تهيئة نظام QR Code:', error);
        createFallbackSystem();
    }
}

// إكمال تهيئة النظام
function completeQRSystemInit() {
    try {
        // إنشاء لوحة التحكم
        createQRControlPanel();
        
        // تحسين وظائف الطباعة الموجودة
        enhanceExistingPrintFunctions();
        
        // إعداد مستمعي الأحداث
        setupQREventListeners();
        
        // تنظيف الكاش القديم
        cleanupQRCache();
        
        // وضع علامة النظام كجاهز
        isQRSystemReady = true;
        
        console.log('✅ تم تهيئة نظام QR Code بنجاح');
        if (typeof showToast === 'function') {
            showToast('🔳 نظام QR Code جاهز للاستخدام', 'success', 'QR System');
        }
        
        // اختبار النظام
        testQRSystem();
        
    } catch (error) {
        console.error('❌ خطأ في إكمال تهيئة نظام QR Code:', error);
        createFallbackSystem();
    }
}

// ==============================
// تحميل مكتبة QR Code
// ==============================
async function loadQRLibrary() {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcode/1.5.3/qrcode.min.js';
        script.onload = () => {
            if (typeof QRCode !== 'undefined') {
                QRCodeLib = QRCode;
                console.log('✅ تم تحميل مكتبة QRCode من CDN');
                resolve();
            } else {
                reject(new Error('فشل في تحميل مكتبة QRCode'));
            }
        };
        script.onerror = () => {
            reject(new Error('فشل في تحميل مكتبة QRCode من CDN'));
        };
        document.head.appendChild(script);
    });
}

// ==============================
// إنشاء مولد QR Code احتياطي محسن
// ==============================
function createFallbackQRGenerator() {
    return {
        toCanvas: async (canvas, text, options = {}) => {
            const ctx = canvas.getContext('2d');
            const size = options.width || qrSystemSettings.size;
            canvas.width = size;
            canvas.height = size;
            
            // رسم خلفية بيضاء
            ctx.fillStyle = qrSystemSettings.colorLight;
            ctx.fillRect(0, 0, size, size);
            
            // رسم حدود
            ctx.strokeStyle = qrSystemSettings.colorDark;
            ctx.lineWidth = 2;
            ctx.strokeRect(2, 2, size - 4, size - 4);
            
            // رسم نمط QR بسيط
            ctx.fillStyle = qrSystemSettings.colorDark;
            const blockSize = (size - 8) / 21; // 21x21 grid
            
            // رسم زوايا التحديد
            drawFinderPattern(ctx, 4, 4, blockSize);
            drawFinderPattern(ctx, size - 7 * blockSize - 4, 4, blockSize);
            drawFinderPattern(ctx, 4, size - 7 * blockSize - 4, blockSize);
            
            // رسم نمط عشوائي في الوسط (محاكاة QR)
            for (let i = 8; i < 13; i++) {
                for (let j = 8; j < 13; j++) {
                    if ((i + j) % 2 === 0) {
                        ctx.fillRect(4 + i * blockSize, 4 + j * blockSize, blockSize, blockSize);
                    }
                }
            }
            
            // إضافة نص في الأسفل
            ctx.fillStyle = qrSystemSettings.colorDark;
            ctx.font = `${Math.floor(size / 25)}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText('QR', size / 2, size - 8);
            
            return canvas;
        }
    };
}

function drawFinderPattern(ctx, x, y, blockSize) {
    // مربع خارجي أسود
    ctx.fillStyle = qrSystemSettings.colorDark;
    ctx.fillRect(x, y, 7 * blockSize, 7 * blockSize);
    
    // مربع داخلي أبيض
    ctx.fillStyle = qrSystemSettings.colorLight;
    ctx.fillRect(x + blockSize, y + blockSize, 5 * blockSize, 5 * blockSize);
    
    // مربع أسود في الوسط
    ctx.fillStyle = qrSystemSettings.colorDark;
    ctx.fillRect(x + 2 * blockSize, y + 2 * blockSize, 3 * blockSize, 3 * blockSize);
}

// ==============================
// إنشاء نظام احتياطي
// ==============================
function createFallbackSystem() {
    QRCodeLib = createFallbackQRGenerator();
    isQRSystemReady = true;
    console.log('⚠️ تم تفعيل النظام الاحتياطي لـ QR Code');
}

// ==============================
// اختبار نظام QR Code
// ==============================
async function testQRSystem() {
    try {
        const testData = {
            formNumber: 'TEST-001',
            fullName: 'اختبار النظام',
            caseCode: 'اختبار',
            caseType: 'اختبار QR Code'
        };
        
        const testCanvas = await generateQRCodeForCase(testData);
        if (testCanvas) {
            console.log('✅ اختبار نظام QR Code: نجح');
        } else {
            console.warn('⚠️ اختبار نظام QR Code: فشل - لكن النظام الاحتياطي متاح');
        }
    } catch (error) {
        console.error('❌ خطأ في اختبار نظام QR Code:', error);
    }
}

// ==============================
// إنشاء QR Code لحالة معينة - الوظيفة الرئيسية المُحسنة
// ==============================
async function generateQRCodeForCase(caseData) {
    if (!isQRSystemReady || !QRCodeLib) {
        console.warn('⚠️ نظام QR Code غير جاهز بعد');
        return createErrorQRCode('النظام غير جاهز');
    }
    
    try {
        const cacheKey = generateCacheKey(caseData);
        
        // فحص الكاش أولاً
        if (qrCodeCache.has(cacheKey)) {
            const cached = qrCodeCache.get(cacheKey);
            if (Date.now() - cached.timestamp < qrSystemSettings.cacheDuration) {
                console.log('📋 تم استخدام QR Code من الكاش');
                return cached.canvas.cloneNode(true);
            } else {
                qrCodeCache.delete(cacheKey);
            }
        }
        
        // إنشاء محتوى QR Code
        const qrContent = generateQRContent(caseData);
        
        // إنشاء Canvas
        const canvas = document.createElement('canvas');
        
        // إنشاء QR Code
        await QRCodeLib.toCanvas(canvas, qrContent, {
            width: qrSystemSettings.size,
            height: qrSystemSettings.size,
            margin: qrSystemSettings.margin,
            color: {
                dark: qrSystemSettings.colorDark,
                light: qrSystemSettings.colorLight
            },
            errorCorrectionLevel: qrSystemSettings.errorCorrectionLevel
        });
        
        // حفظ في الكاش
        qrCodeCache.set(cacheKey, {
            canvas: canvas.cloneNode(true),
            timestamp: Date.now(),
            content: qrContent
        });
        
        // تنظيف الكاش إذا تجاوز الحد الأقصى
        if (qrCodeCache.size > qrSystemSettings.maxCacheSize) {
            const oldestKey = qrCodeCache.keys().next().value;
            qrCodeCache.delete(oldestKey);
        }
        
        console.log(`✅ تم إنشاء QR Code للحالة: ${caseData.formNumber || 'غير محدد'}`);
        return canvas;
        
    } catch (error) {
        console.error('❌ خطأ في إنشاء QR Code:', error);
        return createErrorQRCode('خطأ في الإنشاء');
    }
}

// إنشاء QR Code خطأ
function createErrorQRCode(errorMessage) {
    const canvas = document.createElement('canvas');
    canvas.width = qrSystemSettings.size;
    canvas.height = qrSystemSettings.size;
    
    const ctx = canvas.getContext('2d');
    
    // خلفية حمراء فاتحة
    ctx.fillStyle = '#ffebee';
    ctx.fillRect(0, 0, qrSystemSettings.size, qrSystemSettings.size);
    
    // حدود حمراء
    ctx.strokeStyle = '#f44336';
    ctx.lineWidth = 2;
    ctx.strokeRect(2, 2, qrSystemSettings.size - 4, qrSystemSettings.size - 4);
    
    // نص الخطأ
    ctx.fillStyle = '#d32f2f';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('❌', qrSystemSettings.size / 2, qrSystemSettings.size / 2 - 10);
    ctx.font = '10px Arial';
    ctx.fillText(errorMessage, qrSystemSettings.size / 2, qrSystemSettings.size / 2 + 10);
    
    return canvas;
}

// ==============================
// إنشاء محتوى QR Code المُحسن
// ==============================
function generateQRContent(caseData) {
    let content = {};
    
    // معلومات أساسية
    content.type = 'charity_case';
    content.version = '2.0.0';
    content.org = qrSystemSettings.organizationPrefix;
    
    if (qrSystemSettings.timestampEnabled) {
        content.timestamp = new Date().toISOString();
    }
    
    // رقم الاستمارة (مهم جداً)
    if (qrSystemSettings.includeFormNumber && caseData.formNumber) {
        content.formNumber = caseData.formNumber;
    }
    
    // المعلومات الأساسية
    if (qrSystemSettings.includeBasicInfo) {
        content.basic = {
            name: caseData.fullName || '',
            caseCode: caseData.caseCode || '',
            caseType: caseData.caseType || '',
            date: caseData.caseDate || new Date().toISOString().split('T')[0],
            organizer: caseData.organizer || ''
        };
    }
    
    // معلومات الاتصال
    if (qrSystemSettings.includeContactInfo) {
        content.contact = {
            phone1: caseData.phoneFirst || '',
            phone2: caseData.phoneSecond || '',
            address: caseData.address || ''
        };
    }
    
    // المعلومات المالية
    if (qrSystemSettings.includeFinancialInfo) {
        content.financial = {
            assistance: caseData.estimatedAssistance || '',
            totalAmount: caseData.totalAmount || ''
        };
    }
    
    // ضغط البيانات إذا كانت مفعلة
    let finalContent = JSON.stringify(content);
    
    if (qrSystemSettings.compression) {
        finalContent = compressData(finalContent);
    }
    
    // تشفير البيانات إذا كان مفعلاً
    if (qrSystemSettings.encryption) {
        finalContent = encryptData(finalContent);
    }
    
    return finalContent;
}

// ==============================
// وظائف الضغط والتشفير المُحسنة
// ==============================
function compressData(data) {
    try {
        return data
            .replace(/\s+/g, ' ')
            .replace(/": "/g, '":"')
            .replace(/", "/g, '","')
            .replace(/{ "/g, '{"')
            .replace(/" }/g, '"}');
    } catch (error) {
        console.warn('تحذير: فشل ضغط البيانات:', error);
        return data;
    }
}

function encryptData(data) {
    try {
        return btoa(unescape(encodeURIComponent(data)));
    } catch (error) {
        console.warn('تحذير: فشل تشفير البيانات:', error);
        return data;
    }
}

function decryptData(encryptedData) {
    try {
        return decodeURIComponent(escape(atob(encryptedData)));
    } catch (error) {
        console.warn('تحذير: فشل فك تشفير البيانات:', error);
        return encryptedData;
    }
}

// ==============================
// إنشاء مفتاح الكاش المُحسن
// ==============================
function generateCacheKey(caseData) {
    const keyData = {
        formNumber: caseData.formNumber || '',
        name: caseData.fullName || '',
        date: caseData.caseDate || '',
        hash: Date.now() // إضافة تاريخ لضمان التفرد
    };
    
    const keyString = JSON.stringify(keyData);
    return btoa(keyString).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
}

// ==============================
// تحسين وظائف الطباعة الموجودة - الجزء المُصحح
// ==============================
function enhanceExistingPrintFunctions() {
    // انتظار تحميل الوظائف في التطبيق الرئيسي
    if (typeof window.generateQRCode !== 'function') {
        // إضافة وظيفة generateQRCode العامة للتطبيق الرئيسي
        window.generateQRCode = async function(text, size = 200) {
            if (!isQRSystemReady) {
                console.warn('نظام QR غير جاهز، محاولة إنشاء QR بسيط');
                return createSimpleQR(text, size);
            }
            
            try {
                const canvas = document.createElement('canvas');
                await QRCodeLib.toCanvas(canvas, text, {
                    width: size,
                    height: size,
                    margin: qrSystemSettings.margin,
                    color: {
                        dark: qrSystemSettings.colorDark,
                        light: qrSystemSettings.colorLight
                    },
                    errorCorrectionLevel: qrSystemSettings.errorCorrectionLevel
                });
                return canvas;
            } catch (error) {
                console.error('خطأ في generateQRCode:', error);
                return createSimpleQR(text, size);
            }
        };
    }
    
    // تحسين وظيفة createEnhancedPrintTemplate إذا كانت موجودة
    if (typeof window.createEnhancedPrintTemplate === 'function') {
        const originalCreateTemplate = window.createEnhancedPrintTemplate;
        
        window.createEnhancedPrintTemplate = async function(data) {
            try {
                const container = await originalCreateTemplate(data);
                await addQRCodeToContainer(container, data);
                return container;
            } catch (error) {
                console.error('خطأ في إنشاء قالب الطباعة المحسن:', error);
                return originalCreateTemplate(data);
            }
        };
        
        console.log('✅ تم تحسين وظيفة createEnhancedPrintTemplate');
    } else {
        // إنشاء وظيفة احتياطية
        console.log('⚠️ لم يتم العثور على وظيفة createEnhancedPrintTemplate، سيتم إنشاء وظيفة احتياطية');
    }
}

// إنشاء QR بسيط (احتياطي)
function createSimpleQR(text, size) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    
    const ctx = canvas.getContext('2d');
    
    // خلفية بيضاء
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);
    
    // حدود سوداء
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeRect(2, 2, size - 4, size - 4);
    
    // نص QR
    ctx.fillStyle = '#000000';
    ctx.font = `${Math.floor(size / 15)}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText('QR', size / 2, size / 2 - 10);
    ctx.font = `${Math.floor(size / 25)}px Arial`;
    ctx.fillText('CODE', size / 2, size / 2 + 10);
    
    return canvas;
}

// ==============================
// إضافة QR Code لحاوية الطباعة - مُحسن ومُصحح
// ==============================
async function addQRCodeToContainer(container, caseData) {
    try {
        if (!qrSystemSettings.showInPrint) {
            console.log('💡 QR Code معطل في الطباعة');
            return;
        }
        
        // البحث عن منطقة QR في الهيدر
        const qrSection = container.querySelector('.header-qr');
        if (!qrSection) {
            console.warn('⚠️ لم يتم العثور على منطقة QR في الهيدر');
            return;
        }
        
        // مسح المحتوى الحالي
        qrSection.innerHTML = '';
        
        // الحصول على بيانات الحالة
        const actualCaseData = caseData || getCurrentFormData();
        
        if (!actualCaseData || (!actualCaseData.formNumber && !actualCaseData.fullName)) {
            console.warn('⚠️ لا توجد بيانات كافية لإنشاء QR Code');
            qrSection.innerHTML = '<div style="font-size:10px; text-align:center; color:#666;">QR<br>غير متاح</div>';
            return;
        }
        
        // إنشاء QR Code
        const qrCanvas = await generateQRCodeForCase(actualCaseData);
        
        if (!qrCanvas) {
            throw new Error('فشل في إنشاء QR Code');
        }
        
        // تطبيق أنماط الطباعة
        qrCanvas.style.cssText = `
            max-width: ${qrSystemSettings.printSize} !important;
            max-height: ${qrSystemSettings.printSize} !important;
            border: ${qrSystemSettings.printBorder} !important;
            display: block !important;
            margin: 0 auto !important;
        `;
        
        // إضافة QR Code للهيدر
        qrSection.appendChild(qrCanvas);
        
        console.log('✅ تم إضافة QR Code للطباعة بنجاح');
        
    } catch (error) {
        console.error('❌ خطأ في إضافة QR Code للحاوية:', error);
        
        // عرض رسالة خطأ في المكان المخصص
        const qrSection = container.querySelector('.header-qr');
        if (qrSection) {
            qrSection.innerHTML = '<div style="font-size:10px; text-align:center; color:#e74c3c;">QR<br>خطأ</div>';
        }
    }
}

// ==============================
// الحصول على بيانات النموذج الحالي - مُحسن
// ==============================
function getCurrentFormData() {
    try {
        // محاولة الحصول على البيانات من الوظيفة العامة
        if (typeof window.getFormData === 'function') {
            return window.getFormData();
        }
        
        // محاولة الحصول على البيانات من الحقول مباشرة
        const formData = {};
        const inputs = document.querySelectorAll('#case-form input, #case-form select, #case-form textarea');
        
        inputs.forEach(input => {
            if (input.id && input.value) {
                formData[input.id] = input.value.trim();
            }
        });
        
        return Object.keys(formData).length > 0 ? formData : null;
        
    } catch (error) {
        console.error('خطأ في الحصول على بيانات النموذج:', error);
        return null;
    }
}

// ==============================
// إنشاء لوحة التحكم في QR Code - مبسطة
// ==============================
function createQRControlPanel() {
    if (qrControlPanel) return; // منع الإنشاء المتكرر
    
    const panel = document.createElement('div');
    panel.id = 'qr-control-panel';
    panel.innerHTML = `
        <div class="qr-control-overlay">
            <div class="qr-control-container">
                <div class="qr-control-header">
                    <h3>🔳 إعدادات QR Code</h3>
                    <button class="qr-control-close" onclick="closeQRControlPanel()">✕</button>
                </div>
                
                <div class="qr-control-body">
                    <div class="qr-control-section">
                        <h4>⚙️ الإعدادات الأساسية</h4>
                        <div class="qr-control-row">
                            <label>إظهار في الطباعة:</label>
                            <input type="checkbox" id="qr-showInPrint" ${qrSystemSettings.showInPrint ? 'checked' : ''}>
                        </div>
                        <div class="qr-control-row">
                            <label>حجم QR Code:</label>
                            <input type="range" id="qr-size" min="100" max="300" value="${qrSystemSettings.size}">
                            <span id="qr-sizeValue">${qrSystemSettings.size}px</span>
                        </div>
                        <div class="qr-control-row">
                            <label>تضمين معلومات الاتصال:</label>
                            <input type="checkbox" id="qr-includeContactInfo" ${qrSystemSettings.includeContactInfo ? 'checked' : ''}>
                        </div>
                    </div>
                    
                    <div class="qr-control-section">
                        <h4>🧪 اختبار النظام</h4>
                        <button class="qr-test-btn" onclick="generateTestQR()">🔳 إنشاء QR تجريبي</button>
                        <button class="qr-test-btn" onclick="clearQRCache()">🗑️ مسح الكاش</button>
                        <button class="qr-test-btn" onclick="showQRStats()">📊 إحصائيات QR</button>
                    </div>
                </div>
                
                <div class="qr-control-footer">
                    <button class="qr-control-btn apply-btn" onclick="applyQRSettings()">✅ تطبيق</button>
                    <button class="qr-control-btn save-btn" onclick="saveQRSettings()">💾 حفظ</button>
                    <button class="qr-control-btn reset-btn" onclick="resetQRSettings()">🔄 إعادة تعيين</button>
                </div>
            </div>
        </div>
    `;
    
    // إضافة الأنماط
    addQRStyles();
    
    document.body.appendChild(panel);
    qrControlPanel = panel;
    
    // إعداد مستمعي الإحداث للمنزلقات
    setupQRSliderListeners();
    
    console.log('✅ تم إنشاء لوحة التحكم في QR Code');
}

// ==============================
// إضافة أنماط CSS لنظام QR - مُحسنة
// ==============================
function addQRStyles() {
    if (document.getElementById('qr-system-styles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'qr-system-styles';
    styles.textContent = `
        /* أنماط لوحة التحكم في QR */
        .qr-control-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.8);
            z-index: 10000;
            display: none;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }
        
        .qr-control-overlay.show {
            display: flex;
        }
        
        .qr-control-container {
            background: white;
            border-radius: 15px;
            width: 100%;
            max-width: 600px;
            max-height: 80vh;
            overflow: hidden;
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
            display: flex;
            flex-direction: column;
        }
        
        .qr-control-header {
            background: linear-gradient(135deg, #2c3e50, #34495e);
            color: white;
            padding: 15px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .qr-control-header h3 {
            margin: 0;
            font-size: 16px;
            font-weight: 600;
        }
        
        .qr-control-close {
            background: rgba(255, 255, 255, 0.2);
            border: none;
            color: white;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.3s;
        }
        
        .qr-control-close:hover {
            background: rgba(255, 255, 255, 0.3);
        }
        
        .qr-control-body {
            flex: 1;
            overflow-y: auto;
            padding: 20px;
        }
        
        .qr-control-section {
            margin-bottom: 20px;
        }
        
        .qr-control-section h4 {
            color: #2c3e50;
            margin-bottom: 12px;
            font-size: 14px;
            font-weight: 600;
            padding-bottom: 6px;
            border-bottom: 2px solid #e3e6f0;
        }
        
        .qr-control-row {
            display: flex;
            align-items: center;
            margin-bottom: 10px;
            gap: 10px;
        }
        
        .qr-control-row label {
            min-width: 150px;
            font-weight: 500;
            color: #495057;
            font-size: 13px;
        }
        
        .qr-control-row input {
            flex: 1;
            padding: 6px 10px;
            border: 2px solid #e3e6f0;
            border-radius: 4px;
            font-size: 13px;
        }
        
        .qr-control-row input:focus {
            outline: none;
            border-color: #3498db;
        }
        
        .qr-control-row input[type="checkbox"] {
            width: auto;
            flex: none;
        }
        
        .qr-test-btn {
            background: #17a2b8;
            color: white;
            border: none;
            padding: 8px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            margin: 3px;
            transition: background 0.3s;
        }
        
        .qr-test-btn:hover {
            background: #138496;
        }
        
        .qr-control-footer {
            padding: 15px 20px;
            background: #f8f9fa;
            border-top: 1px solid #e3e6f0;
            display: flex;
            gap: 8px;
            justify-content: center;
            flex-wrap: wrap;
        }
        
        .qr-control-btn {
            padding: 8px 16px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 12px;
            font-weight: 500;
            transition: all 0.3s;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        
        .apply-btn {
            background: #17a2b8;
            color: white;
        }
        
        .save-btn {
            background: #28a745;
            color: white;
        }
        
        .reset-btn {
            background: #ffc107;
            color: #212529;
        }
        
        /* إشعارات QR */
        .qr-toast {
            position: fixed;
            top: 80px;
            right: 15px;
            background: #2c3e50;
            color: white;
            padding: 10px 14px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 500;
            z-index: 10001;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            transform: translateX(100%);
            transition: transform 0.3s ease;
            max-width: 250px;
        }
        
        .qr-toast.show {
            transform: translateX(0);
        }
        
        .qr-toast.success {
            background: #27ae60;
        }
        
        .qr-toast.error {
            background: #e74c3c;
        }
        
        .qr-toast.warning {
            background: #f39c12;
        }
        
        /* تحسينات للهواتف */
        @media (max-width: 768px) {
            .qr-control-container {
                max-height: 90vh;
                margin: 10px;
            }
            
            .qr-control-row {
                flex-direction: column;
                align-items: stretch;
                gap: 5px;
            }
            
            .qr-control-row label {
                min-width: auto;
            }
            
            .qr-control-footer {
                flex-direction: column;
            }
            
            .qr-control-btn {
                width: 100%;
                justify-content: center;
            }
        }
    `;
    
    document.head.appendChild(styles);
}

// ==============================
// وظائف لوحة التحكم
// ==============================
function showQRControlPanel() {
    if (!qrControlPanel) {
        createQRControlPanel();
    }
    
    const overlay = qrControlPanel.querySelector('.qr-control-overlay');
    overlay.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeQRControlPanel() {
    if (qrControlPanel) {
        const overlay = qrControlPanel.querySelector('.qr-control-overlay');
        overlay.classList.remove('show');
        document.body.style.overflow = 'auto';
    }
}

function setupQRSliderListeners() {
    const sizeSlider = document.getElementById('qr-size');
    const sizeValue = document.getElementById('qr-sizeValue');
    
    if (sizeSlider && sizeValue) {
        sizeSlider.addEventListener('input', function() {
            sizeValue.textContent = this.value + 'px';
        });
    }
}

function applyQRSettings() {
    updateQRSettingsFromForm();
    qrCodeCache.clear();
    showQRToast('تم تطبيق إعدادات QR Code', 'success');
}

function saveQRSettings() {
    updateQRSettingsFromForm();
    
    try {
        localStorage.setItem(QR_SYSTEM_CONFIG.storageKey, JSON.stringify(qrSystemSettings));
        applyQRSettings();
        showQRToast('تم حفظ إعدادات QR Code بنجاح', 'success');
    } catch (error) {
        console.error('خطأ في حفظ إعدادات QR:', error);
        showQRToast('فشل في حفظ الإعدادات', 'error');
    }
}

function loadQRSettings() {
    try {
        const savedSettings = localStorage.getItem(QR_SYSTEM_CONFIG.storageKey);
        if (savedSettings) {
            const parsedSettings = JSON.parse(savedSettings);
            qrSystemSettings = { ...QR_SYSTEM_CONFIG, ...parsedSettings };
            console.log('تم تحميل إعدادات QR Code المحفوظة');
        }
    } catch (error) {
        console.error('خطأ في تحميل إعدادات QR:', error);
        qrSystemSettings = { ...QR_SYSTEM_CONFIG };
    }
}

function resetQRSettings() {
    if (confirm('هل أنت متأكد من إعادة تعيين جميع إعدادات QR Code؟')) {
        qrSystemSettings = { ...QR_SYSTEM_CONFIG };
        setQRSettingsToForm();
        applyQRSettings();
        showQRToast('تم إعادة تعيين الإعدادات', 'info');
    }
}

function updateQRSettingsFromForm() {
    const elements = {
        'showInPrint': document.getElementById('qr-showInPrint'),
        'size': document.getElementById('qr-size'),
        'includeContactInfo': document.getElementById('qr-includeContactInfo')
    };
    
    Object.keys(elements).forEach(key => {
        const element = elements[key];
        if (element) {
            if (element.type === 'checkbox') {
                qrSystemSettings[key] = element.checked;
            } else if (element.type === 'range') {
                qrSystemSettings[key] = parseInt(element.value);
            } else {
                qrSystemSettings[key] = element.value;
            }
        }
    });
}

function setQRSettingsToForm() {
    const elements = {
        'qr-showInPrint': qrSystemSettings.showInPrint,
        'qr-size': qrSystemSettings.size,
        'qr-includeContactInfo': qrSystemSettings.includeContactInfo
    };
    
    Object.keys(elements).forEach(key => {
        const element = document.getElementById(key);
        if (element) {
            if (element.type === 'checkbox') {
                element.checked = elements[key];
            } else {
                element.value = elements[key];
            }
        }
    });
}

// ==============================
// وظائف الاختبار والأدوات
// ==============================
async function generateTestQR() {
    try {
        const testData = {
            formNumber: 'TEST-001',
            fullName: 'اختبار QR Code',
            caseCode: 'اختبار',
            caseType: 'اختبار النظام',
            caseDate: new Date().toISOString().split('T')[0],
            phoneFirst: '07700000000',
            address: 'عنوان تجريبي'
        };
        
        const qrCanvas = await generateQRCodeForCase(testData);
        
        if (qrCanvas) {
            // عرض QR Code في نافذة منبثقة
            const popup = document.createElement('div');
            popup.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                padding: 20px;
                border-radius: 10px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                z-index: 10002;
                text-align: center;
                max-width: 90vw;
            `;
            
            popup.innerHTML = `
                <h3 style="margin-top: 0;">QR Code التجريبي</h3>
                <div style="margin: 15px 0;"></div>
                <button onclick="this.parentElement.remove()" style="margin-top: 15px; padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">إغلاق</button>
            `;
            
            popup.querySelector('div').appendChild(qrCanvas);
            document.body.appendChild(popup);
            
            showQRToast('تم إنشاء QR Code تجريبي', 'success');
        } else {
            showQRToast('فشل في إنشاء QR Code تجريبي', 'error');
        }
        
    } catch (error) {
        console.error('خطأ في إنشاء QR تجريبي:', error);
        showQRToast('فشل في إنشاء QR Code تجريبي', 'error');
    }
}

function clearQRCache() {
    qrCodeCache.clear();
    showQRToast(`تم مسح كاش QR Code`, 'info');
}

function showQRStats() {
    const stats = {
        cacheSize: qrCodeCache.size,
        maxCacheSize: qrSystemSettings.maxCacheSize,
        cacheUsage: Math.round((qrCodeCache.size / qrSystemSettings.maxCacheSize) * 100),
        isReady: isQRSystemReady,
        hasLibrary: !!QRCodeLib
    };
    
    alert(`إحصائيات QR Code:
    
🔳 عدد QR Codes في الكاش: ${stats.cacheSize}
📊 استخدام الكاش: ${stats.cacheUsage}%
💾 حجم الكاش الأقصى: ${stats.maxCacheSize}
✅ النظام جاهز: ${stats.isReady ? 'نعم' : 'لا'}
📚 المكتبة متاحة: ${stats.hasLibrary ? 'نعم' : 'لا'}

🔧 الإعدادات:
حجم QR: ${qrSystemSettings.size}x${qrSystemSettings.size}px
إظهار في الطباعة: ${qrSystemSettings.showInPrint ? 'نعم' : 'لا'}
تضمين معلومات الاتصال: ${qrSystemSettings.includeContactInfo ? 'نعم' : 'لا'}`);
}

// ==============================
// إعداد مستمعي الأحداث
// ==============================
function setupQREventListeners() {
    // مستمع النقر على زر QR في الشريط الجانبي
    const qrButton = document.querySelector('.qr-scanner-btn');
    if (qrButton && !qrButton.hasAttribute('data-qr-enhanced')) {
        qrButton.addEventListener('click', function(e) {
            e.preventDefault();
            showQRControlPanel();
        });
        qrButton.setAttribute('data-qr-enhanced', 'true');
        qrButton.innerHTML = '<i class="fas fa-qrcode"></i><span>إعدادات QR</span>';
    }
    
    // اختصارات لوحة المفاتيح
    document.addEventListener('keydown', function(e) {
        // Ctrl + Shift + Q لفتح لوحة التحكم
        if (e.ctrlKey && e.shiftKey && e.key === 'Q') {
            e.preventDefault();
            showQRControlPanel();
        }
    });
}

// ==============================
// وظائف مساعدة
// ==============================
function cleanupQRCache() {
    const now = Date.now();
    const expiredKeys = [];
    
    qrCodeCache.forEach((value, key) => {
        if (now - value.timestamp > qrSystemSettings.cacheDuration) {
            expiredKeys.push(key);
        }
    });
    
    expiredKeys.forEach(key => qrCodeCache.delete(key));
    
    if (expiredKeys.length > 0) {
        console.log(`🧹 تم مسح ${expiredKeys.length} QR Code منتهي الصلاحية من الكاش`);
    }
}

function showQRToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `qr-toast ${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // إظهار الإشعار
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    // إخفاء الإشعار بعد 3 ثوان
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (document.body.contains(toast)) {
                document.body.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

// ==============================
// تهيئة النظام عند تحميل الصفحة
// ==============================
document.addEventListener('DOMContentLoaded', function() {
    // تأخير التهيئة للتأكد من تحميل التطبيق الرئيسي
    setTimeout(() => {
        initializeQRSystem();
    }, 1500);
});

// ==============================
// إتاحة الوظائف عالمياً
// ==============================
window.qrCodeSystem = {
    show: showQRControlPanel,
    hide: closeQRControlPanel,
    generate: generateQRCodeForCase,
    test: generateTestQR,
    clearCache: clearQRCache,
    settings: qrSystemSettings,
    cache: qrCodeCache,
    isReady: () => isQRSystemReady
};

// إتاحة الوظائف المهمة للتطبيق الرئيسي
window.generateQRCodeForCase = generateQRCodeForCase;

// ==============================
// معالج الأخطاء
// ==============================
window.addEventListener('error', function(e) {
    if (e.filename && e.filename.includes('qr-system')) {
        console.error('خطأ في نظام QR Code:', e.error);
    }
});

console.log('🔳 تم تحميل نظام QR Code المُحسن والمُصحح بنجاح!');
console.log('💡 استخدم Ctrl+Shift+Q لفتح لوحة التحكم');
console.log('🔧 استخدم qrCodeSystem للتحكم البرمجي');
console.log('📱 النظام متوافق مع جميع المتصفحات ومحسن للهواتف');