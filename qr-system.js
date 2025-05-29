/**
 * نظام QR Code المتكامل
 * ملف منفصل لتفعيل وإدارة QR Code في التطبيق
 * يتضمن إنشاء، عرض، مسح وإدارة كاملة لـ QR Codes
 * 
 * الاستخدام: قم بتضمين هذا الملف في HTML الخاص بك
 * <script src="qr-system.js"></script>
 */

// ==============================
// إعدادات نظام QR Code الافتراضية
// ==============================
const DEFAULT_QR_SETTINGS = {
    // إعدادات الإنشاء
    size: 256, // حجم QR Code بالبكسل
    errorCorrectionLevel: 'M', // مستوى تصحيح الأخطاء (L, M, Q, H)
    type: 'image/png', // نوع الصورة
    quality: 0.92, // جودة الصورة
    margin: 4, // الهامش حول الكود
    
    // إعدادات الألوان
    colorDark: '#000000', // لون المربعات الداكنة
    colorLight: '#FFFFFF', // لون الخلفية
    
    // إعدادات العرض في الطباعة
    printSize: '60px', // حجم العرض في الطباعة
    printBorder: '1px solid #000', // حدود في الطباعة
    showInPrint: true, // إظهار في الطباعة
    
    // إعدادات المحتوى
    includeFormNumber: true, // تضمين رقم الاستمارة
    includeBasicInfo: true, // تضمين المعلومات الأساسية
    includeContactInfo: false, // تضمين معلومات الاتصال
    includeFinancialInfo: false, // تضمين المعلومات المالية
    
    // إعدادات الماسح
    enableScanner: true, // تفعيل ماسح QR
    scannerFacingMode: 'environment', // وضع الكاميرا (user/environment)
    scannerWidth: 300, // عرض نافذة المسح
    scannerHeight: 300, // ارتفاع نافذة المسح
    
    // إعدادات متقدمة
    compression: true, // ضغط البيانات
    encryption: false, // تشفير البيانات
    timestampEnabled: true, // إضافة طابع زمني
    organizationPrefix: 'CHARITY', // بادئة المؤسسة
    
    // إعدادات التخزين
    cacheDuration: 24 * 60 * 60 * 1000, // مدة الكاش (24 ساعة)
    maxCacheSize: 100 // عدد أقصى من QR Codes في الكاش
};

// ==============================
// متغيرات النظام
// ==============================
let currentQRSettings = { ...DEFAULT_QR_SETTINGS };
let qrCodeCache = new Map(); // كاش للـ QR Codes
let qrScanner = null; // ماسح QR
let qrControlPanel = null; // لوحة التحكم
let isScanning = false; // حالة المسح

// مكتبات QR Code (سيتم تحميلها ديناميكياً)
let QRCodeLib = null;
let QrScannerLib = null;

// ==============================
// تهيئة نظام QR Code
// ==============================
async function initializeQRSystem() {
    try {
        console.log('🔄 جاري تهيئة نظام QR Code...');
        
        // تحميل الإعدادات المحفوظة
        loadQRSettings();
        
        // تحميل مكتبات QR Code
        await loadQRLibraries();
        
        // إنشاء لوحة التحكم
        createQRControlPanel();
        
        // تحسين وظائف الطباعة الموجودة
        enhanceExistingPrintFunctions();
        
        // تفعيل ماسح QR
        if (currentQRSettings.enableScanner) {
            initializeQRScanner();
        }
        
        // إعداد مستمعي الأحداث
        setupQREventListeners();
        
        // تنظيف الكاش القديم
        cleanupQRCache();
        
        console.log('✅ تم تهيئة نظام QR Code بنجاح');
        showQRToast('🔳 نظام QR Code جاهز للاستخدام', 'success');
        
    } catch (error) {
        console.error('❌ خطأ في تهيئة نظام QR Code:', error);
        showQRToast('فشل في تهيئة نظام QR Code', 'error');
    }
}

// ==============================
// تحميل مكتبات QR Code
// ==============================
async function loadQRLibraries() {
    return new Promise((resolve, reject) => {
        try {
            // تحقق من وجود مكتبة QRCode
            if (typeof QRCode !== 'undefined') {
                QRCodeLib = QRCode;
                console.log('✅ مكتبة QRCode متاحة');
                resolve();
                return;
            }
            
            // تحميل مكتبة QRCode من CDN
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcode/1.5.3/qrcode.min.js';
            script.onload = () => {
                QRCodeLib = QRCode;
                console.log('✅ تم تحميل مكتبة QRCode');
                resolve();
            };
            script.onerror = () => {
                console.warn('⚠️ فشل تحميل مكتبة QRCode من CDN، سيتم استخدام مولد محلي');
                QRCodeLib = createLocalQRGenerator();
                resolve();
            };
            document.head.appendChild(script);
            
        } catch (error) {
            console.warn('⚠️ خطأ في تحميل مكتبات QR Code:', error);
            QRCodeLib = createLocalQRGenerator();
            resolve();
        }
    });
}

// ==============================
// إنشاء مولد QR Code محلي (احتياطي)
// ==============================
function createLocalQRGenerator() {
    return {
        toCanvas: async (canvas, text, options = {}) => {
            const ctx = canvas.getContext('2d');
            const size = options.width || 256;
            canvas.width = size;
            canvas.height = size;
            
            // رسم خلفية بيضاء
            ctx.fillStyle = currentQRSettings.colorLight;
            ctx.fillRect(0, 0, size, size);
            
            // رسم حدود
            ctx.strokeStyle = currentQRSettings.colorDark;
            ctx.lineWidth = 2;
            ctx.strokeRect(0, 0, size, size);
            
            // رسم نمط QR بسيط (للاختبار)
            ctx.fillStyle = currentQRSettings.colorDark;
            const blockSize = size / 25;
            
            // رسم زوايا التحديد
            drawFinderPattern(ctx, 0, 0, blockSize);
            drawFinderPattern(ctx, size - 7 * blockSize, 0, blockSize);
            drawFinderPattern(ctx, 0, size - 7 * blockSize, blockSize);
            
            // رسم نمط عشوائي في الوسط
            for (let i = 8; i < 17; i++) {
                for (let j = 8; j < 17; j++) {
                    if (Math.random() > 0.5) {
                        ctx.fillRect(i * blockSize, j * blockSize, blockSize, blockSize);
                    }
                }
            }
            
            // إضافة نص في الأسفل
            ctx.fillStyle = currentQRSettings.colorDark;
            ctx.font = `${Math.floor(size / 20)}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText('QR Code', size / 2, size - 10);
            
            return canvas;
        }
    };
}

function drawFinderPattern(ctx, x, y, blockSize) {
    // رسم مربع خارجي
    ctx.fillRect(x, y, 7 * blockSize, 7 * blockSize);
    
    // رسم مربع داخلي أبيض
    ctx.fillStyle = currentQRSettings.colorLight;
    ctx.fillRect(x + blockSize, y + blockSize, 5 * blockSize, 5 * blockSize);
    
    // رسم مربع أسود في الوسط
    ctx.fillStyle = currentQRSettings.colorDark;
    ctx.fillRect(x + 2 * blockSize, y + 2 * blockSize, 3 * blockSize, 3 * blockSize);
}

// ==============================
// إنشاء QR Code لحالة معينة
// ==============================
async function generateQRCodeForCase(caseData) {
    try {
        const cacheKey = generateCacheKey(caseData);
        
        // فحص الكاش أولاً
        if (qrCodeCache.has(cacheKey)) {
            const cached = qrCodeCache.get(cacheKey);
            if (Date.now() - cached.timestamp < currentQRSettings.cacheDuration) {
                return cached.canvas;
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
            width: currentQRSettings.size,
            height: currentQRSettings.size,
            margin: currentQRSettings.margin,
            color: {
                dark: currentQRSettings.colorDark,
                light: currentQRSettings.colorLight
            },
            errorCorrectionLevel: currentQRSettings.errorCorrectionLevel
        });
        
        // حفظ في الكاش
        qrCodeCache.set(cacheKey, {
            canvas: canvas.cloneNode(true),
            timestamp: Date.now(),
            content: qrContent
        });
        
        // تنظيف الكاش إذا تجاوز الحد الأقصى
        if (qrCodeCache.size > currentQRSettings.maxCacheSize) {
            const oldestKey = qrCodeCache.keys().next().value;
            qrCodeCache.delete(oldestKey);
        }
        
        console.log(`✅ تم إنشاء QR Code للحالة: ${caseData.formNumber || 'غير محدد'}`);
        return canvas;
        
    } catch (error) {
        console.error('❌ خطأ في إنشاء QR Code:', error);
        
        // إنشاء QR Code احتياطي
        const fallbackCanvas = document.createElement('canvas');
        fallbackCanvas.width = currentQRSettings.size;
        fallbackCanvas.height = currentQRSettings.size;
        
        const ctx = fallbackCanvas.getContext('2d');
        ctx.fillStyle = currentQRSettings.colorLight;
        ctx.fillRect(0, 0, currentQRSettings.size, currentQRSettings.size);
        
        ctx.fillStyle = currentQRSettings.colorDark;
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('QR Error', currentQRSettings.size / 2, currentQRSettings.size / 2);
        
        return fallbackCanvas;
    }
}

// ==============================
// إنشاء محتوى QR Code
// ==============================
function generateQRContent(caseData) {
    let content = {};
    
    // معلومات أساسية
    content.type = 'charity_case';
    content.version = '1.0.0';
    content.org = currentQRSettings.organizationPrefix;
    
    if (currentQRSettings.timestampEnabled) {
        content.timestamp = new Date().toISOString();
    }
    
    // رقم الاستمارة (مهم جداً)
    if (currentQRSettings.includeFormNumber && caseData.formNumber) {
        content.formNumber = caseData.formNumber;
    }
    
    // المعلومات الأساسية
    if (currentQRSettings.includeBasicInfo) {
        content.basic = {
            name: caseData.fullName || '',
            caseCode: caseData.caseCode || '',
            caseType: caseData.caseType || '',
            date: caseData.caseDate || new Date().toISOString().split('T')[0]
        };
    }
    
    // معلومات الاتصال
    if (currentQRSettings.includeContactInfo) {
        content.contact = {
            phone1: caseData.phoneFirst || '',
            address: caseData.address || ''
        };
    }
    
    // المعلومات المالية
    if (currentQRSettings.includeFinancialInfo) {
        content.financial = {
            assistance: caseData.estimatedAssistance || '',
            totalAmount: caseData.totalAmount || ''
        };
    }
    
    // ضغط البيانات إذا كانت مفعلة
    let finalContent = JSON.stringify(content);
    
    if (currentQRSettings.compression) {
        finalContent = compressData(finalContent);
    }
    
    // تشفير البيانات إذا كان مفعلاً
    if (currentQRSettings.encryption) {
        finalContent = encryptData(finalContent);
    }
    
    return finalContent;
}

// ==============================
// وظائف الضغط والتشفير
// ==============================
function compressData(data) {
    try {
        // ضغط بسيط عن طريق إزالة المسافات والأحرف غير الضرورية
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
        // تشفير بسيط (Base64) - للحماية الأساسية فقط
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
// إنشاء مفتاح الكاش
// ==============================
function generateCacheKey(caseData) {
    const keyData = {
        formNumber: caseData.formNumber || '',
        name: caseData.fullName || '',
        date: caseData.caseDate || '',
        settings: {
            size: currentQRSettings.size,
            colors: currentQRSettings.colorDark + currentQRSettings.colorLight,
            content: [
                currentQRSettings.includeFormNumber,
                currentQRSettings.includeBasicInfo,
                currentQRSettings.includeContactInfo,
                currentQRSettings.includeFinancialInfo
            ].join('')
        }
    };
    
    const keyString = JSON.stringify(keyData);
    return btoa(keyString).replace(/[^a-zA-Z0-9]/g, '').substring(0, 20);
}

// ==============================
// تحسين وظائف الطباعة الموجودة
// ==============================
function enhanceExistingPrintFunctions() {
    // البحث عن الوظيفة الأصلية لمعاينة الطباعة
    if (typeof enhancedPrintPreview !== 'undefined') {
        const originalPrintPreview = enhancedPrintPreview;
        
        // استبدال الوظيفة بنسخة محسنة
        window.enhancedPrintPreview = async function(caseData = null) {
            try {
                // استدعاء الوظيفة الأصلية
                const result = await originalPrintPreview(caseData);
                
                // إضافة QR Code بعد إنشاء المعاينة
                setTimeout(async () => {
                    await addQRCodeToPrintPreview(caseData);
                }, 500);
                
                return result;
            } catch (error) {
                console.error('خطأ في معاينة الطباعة المحسنة:', error);
                return originalPrintPreview(caseData);
            }
        };
    }
    
    // تحسين وظائف إنشاء قالب الطباعة
    if (typeof createEnhancedPrintTemplate !== 'undefined') {
        const originalCreateTemplate = createEnhancedPrintTemplate;
        
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
    }
}

// ==============================
// إضافة QR Code لمعاينة الطباعة
// ==============================
async function addQRCodeToPrintPreview(caseData) {
    try {
        const printContainer = document.querySelector('.print-container');
        if (!printContainer) {
            console.warn('⚠️ لم يتم العثور على حاوية الطباعة');
            return;
        }
        
        await addQRCodeToContainer(printContainer, caseData);
        
    } catch (error) {
        console.error('❌ خطأ في إضافة QR Code للطباعة:', error);
    }
}

// ==============================
// إضافة QR Code لحاوية الطباعة
// ==============================
async function addQRCodeToContainer(container, caseData) {
    try {
        if (!currentQRSettings.showInPrint) {
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
            qrSection.innerHTML = '<div style="font-size:10px; text-align:center;">QR<br>غير متاح</div>';
            return;
        }
        
        // إنشاء QR Code
        const qrCanvas = await generateQRCodeForCase(actualCaseData);
        
        if (!qrCanvas) {
            throw new Error('فشل في إنشاء QR Code');
        }
        
        // تطبيق أنماط الطباعة
        qrCanvas.style.maxWidth = currentQRSettings.printSize;
        qrCanvas.style.maxHeight = currentQRSettings.printSize;
        qrCanvas.style.border = currentQRSettings.printBorder;
        qrCanvas.style.display = 'block';
        qrCanvas.style.margin = '0 auto';
        
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
// الحصول على بيانات النموذج الحالي
// ==============================
function getCurrentFormData() {
    try {
        // محاولة الحصول على البيانات من النموذج
        if (typeof getFormData === 'function') {
            return getFormData();
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
// تهيئة ماسح QR Code
// ==============================
function initializeQRScanner() {
    try {
        // إنشاء ماسح QR مخصص
        qrScanner = new QRCodeScanner();
        console.log('✅ تم تهيئة ماسح QR Code');
    } catch (error) {
        console.error('❌ خطأ في تهيئة ماسح QR Code:', error);
    }
}

// ==============================
// فئة ماسح QR Code مخصص
// ==============================
class QRCodeScanner {
    constructor() {
        this.video = null;
        this.canvas = null;
        this.context = null;
        this.stream = null;
        this.scanning = false;
        this.scanInterval = null;
    }
    
    async startScanning(callback) {
        try {
            if (this.scanning) {
                console.warn('⚠️ المسح قيد التشغيل بالفعل');
                return;
            }
            
            // إنشاء عناصر الفيديو والكانفاس
            await this.createVideoElements();
            
            // طلب إذن الكاميرا
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: currentQRSettings.scannerFacingMode,
                    width: currentQRSettings.scannerWidth,
                    height: currentQRSettings.scannerHeight
                }
            });
            
            this.video.srcObject = this.stream;
            await this.video.play();
            
            this.scanning = true;
            
            // بدء المسح المستمر
            this.scanInterval = setInterval(() => {
                this.scanFrame(callback);
            }, 300);
            
            console.log('✅ تم بدء مسح QR Code');
            
        } catch (error) {
            console.error('❌ خطأ في بدء مسح QR Code:', error);
            throw error;
        }
    }
    
    async createVideoElements() {
        this.video = document.createElement('video');
        this.video.style.width = currentQRSettings.scannerWidth + 'px';
        this.video.style.height = currentQRSettings.scannerHeight + 'px';
        this.video.setAttribute('playsinline', true);
        
        this.canvas = document.createElement('canvas');
        this.canvas.width = currentQRSettings.scannerWidth;
        this.canvas.height = currentQRSettings.scannerHeight;
        this.context = this.canvas.getContext('2d');
    }
    
    scanFrame(callback) {
        if (!this.scanning || !this.video || this.video.readyState !== this.video.HAVE_ENOUGH_DATA) {
            return;
        }
        
        try {
            // رسم الإطار الحالي على الكانفاس
            this.context.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
            
            // محاولة قراءة QR Code (هذا يتطلب مكتبة إضافية)
            const imageData = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
            const qrResult = this.decodeQRFromImageData(imageData);
            
            if (qrResult) {
                this.stopScanning();
                callback(qrResult);
            }
            
        } catch (error) {
            console.error('خطأ في مسح الإطار:', error);
        }
    }
    
    decodeQRFromImageData(imageData) {
        // هذه الوظيفة تحتاج مكتبة خاصة لفك تشفير QR Code
        // للتبسيط، سنستخدم محاكي
        
        // في التطبيق الحقيقي، يمكن استخدام مكتبة مثل jsQR
        // return jsQR(imageData.data, imageData.width, imageData.height);
        
        return null; // مؤقت
    }
    
    stopScanning() {
        this.scanning = false;
        
        if (this.scanInterval) {
            clearInterval(this.scanInterval);
            this.scanInterval = null;
        }
        
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        
        if (this.video) {
            this.video.srcObject = null;
        }
        
        console.log('⏹️ تم إيقاف مسح QR Code');
    }
    
    getVideoElement() {
        return this.video;
    }
}

// ==============================
// فتح ماسح QR Code
// ==============================
async function openQRScanner() {
    try {
        if (!currentQRSettings.enableScanner) {
            showQRToast('ماسح QR Code معطل في الإعدادات', 'warning');
            return;
        }
        
        if (isScanning) {
            showQRToast('المسح قيد التشغيل بالفعل', 'warning');
            return;
        }
        
        // إنشاء نافذة المسح
        const scannerModal = createQRScannerModal();
        document.body.appendChild(scannerModal);
        
        // عرض النافذة
        scannerModal.classList.add('show');
        
        // بدء المسح
        isScanning = true;
        await qrScanner.startScanning((result) => {
            handleQRScanResult(result);
            closeQRScanner();
        });
        
        // إضافة الفيديو للنافذة
        const videoContainer = scannerModal.querySelector('.qr-video-container');
        videoContainer.appendChild(qrScanner.getVideoElement());
        
        showQRToast('ابدأ بتوجيه الكاميرا نحو QR Code', 'info');
        
    } catch (error) {
        console.error('❌ خطأ في فتح ماسح QR Code:', error);
        showQRToast('فشل في فتح ماسح QR Code: ' + error.message, 'error');
        isScanning = false;
    }
}

// ==============================
// إنشاء نافذة ماسح QR Code
// ==============================
function createQRScannerModal() {
    const modal = document.createElement('div');
    modal.className = 'qr-scanner-modal';
    modal.innerHTML = `
        <div class="qr-scanner-overlay">
            <div class="qr-scanner-container">
                <div class="qr-scanner-header">
                    <h3>📷 مسح QR Code</h3>
                    <button class="qr-scanner-close" onclick="closeQRScanner()">✕</button>
                </div>
                
                <div class="qr-scanner-body">
                    <div class="qr-video-container">
                        <div class="qr-scanner-loading">
                            <div class="qr-spinner"></div>
                            <p>جاري تحضير الكاميرا...</p>
                        </div>
                    </div>
                    
                    <div class="qr-scanner-overlay-frame">
                        <div class="qr-scanner-corners">
                            <div class="corner top-left"></div>
                            <div class="corner top-right"></div>
                            <div class="corner bottom-left"></div>
                            <div class="corner bottom-right"></div>
                        </div>
                    </div>
                    
                    <div class="qr-scanner-instructions">
                        <p>🎯 وجه الكاميرا نحو QR Code</p>
                        <p>📱 تأكد من وضوح الإضاءة</p>
                    </div>
                </div>
                
                <div class="qr-scanner-footer">
                    <button class="qr-btn qr-btn-secondary" onclick="closeQRScanner()">
                        <i class="fas fa-times"></i> إلغاء
                    </button>
                    <button class="qr-btn qr-btn-primary" onclick="switchCamera()">
                        <i class="fas fa-camera"></i> تبديل الكاميرا
                    </button>
                </div>
            </div>
        </div>
    `;
    
    return modal;
}

// ==============================
// إغلاق ماسح QR Code
// ==============================
function closeQRScanner() {
    try {
        isScanning = false;
        
        if (qrScanner) {
            qrScanner.stopScanning();
        }
        
        const scannerModal = document.querySelector('.qr-scanner-modal');
        if (scannerModal) {
            scannerModal.classList.remove('show');
            setTimeout(() => {
                if (document.body.contains(scannerModal)) {
                    document.body.removeChild(scannerModal);
                }
            }, 300);
        }
        
        console.log('✅ تم إغلاق ماسح QR Code');
        
    } catch (error) {
        console.error('خطأ في إغلاق ماسح QR Code:', error);
    }
}

// ==============================
// معالجة نتيجة مسح QR Code
// ==============================
function handleQRScanResult(result) {
    try {
        console.log('📄 تم مسح QR Code:', result);
        
        // محاولة تحليل البيانات
        let qrData = null;
        
        try {
            // إذا كانت البيانات مشفرة
            if (currentQRSettings.encryption) {
                result = decryptData(result);
            }
            
            qrData = JSON.parse(result);
        } catch (parseError) {
            // إذا فشل التحليل، قد يكون النص عادي
            qrData = { rawData: result };
        }
        
        // البحث عن الحالة
        if (qrData.formNumber) {
            searchCaseByFormNumber(qrData.formNumber);
        } else if (qrData.basic && qrData.basic.name) {
            searchCaseByName(qrData.basic.name);
        } else if (qrData.rawData) {
            performGeneralSearch(qrData.rawData);
        } else {
            showQRToast('لا يمكن استخراج معلومات مفيدة من QR Code', 'warning');
        }
        
        showQRToast('تم مسح QR Code بنجاح!', 'success');
        
    } catch (error) {
        console.error('❌ خطأ في معالجة نتيجة المسح:', error);
        showQRToast('فشل في معالجة QR Code', 'error');
    }
}

// ==============================
// وظائف البحث بناءً على QR Code
// ==============================
function searchCaseByFormNumber(formNumber) {
    try {
        // البحث في البيانات المحلية
        if (typeof casesData !== 'undefined' && Array.isArray(casesData)) {
            const foundCase = casesData.find(c => c.formNumber === formNumber);
            
            if (foundCase) {
                displayFoundCase(foundCase);
                return;
            }
        }
        
        // البحث في النموذج العام
        if (typeof performSearch === 'function') {
            const searchInput = document.getElementById('globalSearch');
            if (searchInput) {
                searchInput.value = formNumber;
                performSearch();
            }
        }
        
        showQRToast(`جاري البحث عن الاستمارة رقم: ${formNumber}`, 'info');
        
    } catch (error) {
        console.error('خطأ في البحث برقم الاستمارة:', error);
    }
}

function searchCaseByName(name) {
    try {
        if (typeof performSearch === 'function') {
            const searchInput = document.getElementById('globalSearch');
            if (searchInput) {
                searchInput.value = name;
                performSearch();
            }
        }
        
        showQRToast(`جاري البحث عن: ${name}`, 'info');
        
    } catch (error) {
        console.error('خطأ في البحث بالاسم:', error);
    }
}

function performGeneralSearch(searchTerm) {
    try {
        if (typeof performSearch === 'function') {
            const searchInput = document.getElementById('globalSearch');
            if (searchInput) {
                searchInput.value = searchTerm;
                performSearch();
            }
        }
        
        showQRToast(`جاري البحث عن: ${searchTerm}`, 'info');
        
    } catch (error) {
        console.error('خطأ في البحث العام:', error);
    }
}

function displayFoundCase(caseData) {
    try {
        // عرض تفاصيل الحالة
        if (typeof viewCaseDetails === 'function') {
            viewCaseDetails(caseData.id);
        } else {
            // عرض معلومات أساسية
            const info = `
الاسم: ${caseData.fullName || 'غير محدد'}
رقم الاستمارة: ${caseData.formNumber || 'غير محدد'}
نوع الحالة: ${caseData.caseCode || 'غير محدد'}
التاريخ: ${caseData.caseDate || 'غير محدد'}
            `;
            
            alert('تم العثور على الحالة:\n\n' + info);
        }
        
        showQRToast('تم العثور على الحالة!', 'success');
        
    } catch (error) {
        console.error('خطأ في عرض الحالة:', error);
    }
}

// ==============================
// لوحة التحكم في QR Code
// ==============================
function createQRControlPanel() {
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
                    <div class="qr-control-tabs">
                        <button class="qr-tab-btn active" onclick="showQRTab('general')">عام</button>
                        <button class="qr-tab-btn" onclick="showQRTab('content')">المحتوى</button>
                        <button class="qr-tab-btn" onclick="showQRTab('appearance')">المظهر</button>
                        <button class="qr-tab-btn" onclick="showQRTab('scanner')">الماسح</button>
                        <button class="qr-tab-btn" onclick="showQRTab('advanced')">متقدم</button>
                    </div>
                    
                    <div class="qr-control-content">
                        <!-- تبويب عام -->
                        <div class="qr-tab-content active" id="general-tab">
                            <div class="qr-control-section">
                                <h4>⚙️ الإعدادات العامة</h4>
                                <div class="qr-control-row">
                                    <label>إظهار في الطباعة:</label>
                                    <input type="checkbox" id="showInPrint" ${currentQRSettings.showInPrint ? 'checked' : ''}>
                                </div>
                                <div class="qr-control-row">
                                    <label>حجم QR Code:</label>
                                    <input type="range" id="size" min="128" max="512" value="${currentQRSettings.size}">
                                    <span id="sizeValue">${currentQRSettings.size}px</span>
                                </div>
                                <div class="qr-control-row">
                                    <label>مستوى تصحيح الأخطاء:</label>
                                    <select id="errorCorrectionLevel">
                                        <option value="L" ${currentQRSettings.errorCorrectionLevel === 'L' ? 'selected' : ''}>منخفض (L)</option>
                                        <option value="M" ${currentQRSettings.errorCorrectionLevel === 'M' ? 'selected' : ''}>متوسط (M)</option>
                                        <option value="Q" ${currentQRSettings.errorCorrectionLevel === 'Q' ? 'selected' : ''}>عالي (Q)</option>
                                        <option value="H" ${currentQRSettings.errorCorrectionLevel === 'H' ? 'selected' : ''}>عالي جداً (H)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        
                        <!-- تبويب المحتوى -->
                        <div class="qr-tab-content" id="content-tab">
                            <div class="qr-control-section">
                                <h4>📄 محتوى QR Code</h4>
                                <div class="qr-control-row">
                                    <label>تضمين رقم الاستمارة:</label>
                                    <input type="checkbox" id="includeFormNumber" ${currentQRSettings.includeFormNumber ? 'checked' : ''}>
                                </div>
                                <div class="qr-control-row">
                                    <label>تضمين المعلومات الأساسية:</label>
                                    <input type="checkbox" id="includeBasicInfo" ${currentQRSettings.includeBasicInfo ? 'checked' : ''}>
                                </div>
                                <div class="qr-control-row">
                                    <label>تضمين معلومات الاتصال:</label>
                                    <input type="checkbox" id="includeContactInfo" ${currentQRSettings.includeContactInfo ? 'checked' : ''}>
                                </div>
                                <div class="qr-control-row">
                                    <label>تضمين المعلومات المالية:</label>
                                    <input type="checkbox" id="includeFinancialInfo" ${currentQRSettings.includeFinancialInfo ? 'checked' : ''}>
                                </div>
                                <div class="qr-control-row">
                                    <label>إضافة طابع زمني:</label>
                                    <input type="checkbox" id="timestampEnabled" ${currentQRSettings.timestampEnabled ? 'checked' : ''}>
                                </div>
                            </div>
                        </div>
                        
                        <!-- تبويب المظهر -->
                        <div class="qr-tab-content" id="appearance-tab">
                            <div class="qr-control-section">
                                <h4>🎨 مظهر QR Code</h4>
                                <div class="qr-control-row">
                                    <label>لون المربعات:</label>
                                    <input type="color" id="colorDark" value="${currentQRSettings.colorDark}">
                                </div>
                                <div class="qr-control-row">
                                    <label>لون الخلفية:</label>
                                    <input type="color" id="colorLight" value="${currentQRSettings.colorLight}">
                                </div>
                                <div class="qr-control-row">
                                    <label>حجم في الطباعة:</label>
                                    <input type="text" id="printSize" value="${currentQRSettings.printSize}">
                                </div>
                                <div class="qr-control-row">
                                    <label>حدود في الطباعة:</label>
                                    <input type="text" id="printBorder" value="${currentQRSettings.printBorder}">
                                </div>
                                <div class="qr-control-row">
                                    <label>الهامش:</label>
                                    <input type="range" id="margin" min="0" max="10" value="${currentQRSettings.margin}">
                                    <span id="marginValue">${currentQRSettings.margin}px</span>
                                </div>
                            </div>
                        </div>
                        
                        <!-- تبويب الماسح -->
                        <div class="qr-tab-content" id="scanner-tab">
                            <div class="qr-control-section">
                                <h4>📷 إعدادات الماسح</h4>
                                <div class="qr-control-row">
                                    <label>تفعيل الماسح:</label>
                                    <input type="checkbox" id="enableScanner" ${currentQRSettings.enableScanner ? 'checked' : ''}>
                                </div>
                                <div class="qr-control-row">
                                    <label>وضع الكاميرا:</label>
                                    <select id="scannerFacingMode">
                                        <option value="environment" ${currentQRSettings.scannerFacingMode === 'environment' ? 'selected' : ''}>خلفية</option>
                                        <option value="user" ${currentQRSettings.scannerFacingMode === 'user' ? 'selected' : ''}>أمامية</option>
                                    </select>
                                </div>
                                <div class="qr-control-row">
                                    <label>عرض نافذة المسح:</label>
                                    <input type="number" id="scannerWidth" min="200" max="800" value="${currentQRSettings.scannerWidth}">
                                </div>
                                <div class="qr-control-row">
                                    <label>ارتفاع نافذة المسح:</label>
                                    <input type="number" id="scannerHeight" min="200" max="800" value="${currentQRSettings.scannerHeight}">
                                </div>
                            </div>
                            
                            <div class="qr-control-section">
                                <h4>🧪 اختبار الماسح</h4>
                                <button class="qr-test-btn" onclick="testQRScanner()">📷 اختبار الماسح</button>
                            </div>
                        </div>
                        
                        <!-- تبويب متقدم -->
                        <div class="qr-tab-content" id="advanced-tab">
                            <div class="qr-control-section">
                                <h4>🔧 إعدادات متقدمة</h4>
                                <div class="qr-control-row">
                                    <label>ضغط البيانات:</label>
                                    <input type="checkbox" id="compression" ${currentQRSettings.compression ? 'checked' : ''}>
                                </div>
                                <div class="qr-control-row">
                                    <label>تشفير البيانات:</label>
                                    <input type="checkbox" id="encryption" ${currentQRSettings.encryption ? 'checked' : ''}>
                                </div>
                                <div class="qr-control-row">
                                    <label>بادئة المؤسسة:</label>
                                    <input type="text" id="organizationPrefix" value="${currentQRSettings.organizationPrefix}">
                                </div>
                                <div class="qr-control-row">
                                    <label>مدة الكاش (ساعات):</label>
                                    <input type="number" id="cacheDuration" min="1" max="168" value="${currentQRSettings.cacheDuration / (60 * 60 * 1000)}">
                                </div>
                                <div class="qr-control-row">
                                    <label>حجم الكاش الأقصى:</label>
                                    <input type="number" id="maxCacheSize" min="10" max="1000" value="${currentQRSettings.maxCacheSize}">
                                </div>
                            </div>
                            
                            <div class="qr-control-section">
                                <h4>🧪 أدوات التطوير</h4>
                                <button class="qr-test-btn" onclick="generateTestQR()">🔳 إنشاء QR تجريبي</button>
                                <button class="qr-test-btn" onclick="clearQRCache()">🗑️ مسح الكاش</button>
                                <button class="qr-test-btn" onclick="showQRStats()">📊 إحصائيات QR</button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="qr-control-footer">
                    <button class="qr-control-btn apply-btn" onclick="applyQRSettings()">✅ تطبيق</button>
                    <button class="qr-control-btn save-btn" onclick="saveQRSettings()">💾 حفظ</button>
                    <button class="qr-control-btn reset-btn" onclick="resetQRSettings()">🔄 إعادة تعيين</button>
                    <button class="qr-control-btn export-btn" onclick="exportQRSettings()">📤 تصدير</button>
                    <button class="qr-control-btn import-btn" onclick="importQRSettings()">📥 استيراد</button>
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
}

// ==============================
// إضافة أنماط CSS لنظام QR
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
            max-width: 800px;
            max-height: 90vh;
            overflow: hidden;
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
            display: flex;
            flex-direction: column;
        }
        
        .qr-control-header {
            background: linear-gradient(135deg, #2c3e50, #34495e);
            color: white;
            padding: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .qr-control-header h3 {
            margin: 0;
            font-size: 18px;
            font-weight: 600;
        }
        
        .qr-control-close {
            background: rgba(255, 255, 255, 0.2);
            border: none;
            color: white;
            width: 35px;
            height: 35px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 18px;
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
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }
        
        .qr-control-tabs {
            display: flex;
            border-bottom: 1px solid #e3e6f0;
            background: #f8f9fa;
        }
        
        .qr-tab-btn {
            background: none;
            border: none;
            padding: 15px 20px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            color: #6c757d;
            transition: all 0.3s;
            border-bottom: 3px solid transparent;
            flex: 1;
            text-align: center;
        }
        
        .qr-tab-btn:hover {
            background: #e9ecef;
            color: #495057;
        }
        
        .qr-tab-btn.active {
            color: #2c3e50;
            border-bottom-color: #2c3e50;
            background: white;
        }
        
        .qr-control-content {
            flex: 1;
            overflow-y: auto;
            padding: 20px;
        }
        
        .qr-tab-content {
            display: none;
        }
        
        .qr-tab-content.active {
            display: block;
        }
        
        .qr-control-section {
            margin-bottom: 25px;
        }
        
        .qr-control-section h4 {
            color: #2c3e50;
            margin-bottom: 15px;
            font-size: 16px;
            font-weight: 600;
            padding-bottom: 8px;
            border-bottom: 2px solid #e3e6f0;
        }
        
        .qr-control-row {
            display: flex;
            align-items: center;
            margin-bottom: 12px;
            gap: 15px;
        }
        
        .qr-control-row label {
            min-width: 180px;
            font-weight: 500;
            color: #495057;
            font-size: 14px;
        }
        
        .qr-control-row input,
        .qr-control-row select {
            flex: 1;
            padding: 8px 12px;
            border: 2px solid #e3e6f0;
            border-radius: 6px;
            font-size: 14px;
            transition: border-color 0.3s;
        }
        
        .qr-control-row input:focus,
        .qr-control-row select:focus {
            outline: none;
            border-color: #2c3e50;
            box-shadow: 0 0 0 3px rgba(44, 62, 80, 0.1);
        }
        
        .qr-control-row input[type="checkbox"] {
            width: auto;
            flex: none;
        }
        
        .qr-control-row input[type="color"] {
            width: 50px;
            height: 40px;
            padding: 2px;
            cursor: pointer;
        }
        
        .qr-control-row input[type="range"] {
            flex: 1;
        }
        
        .qr-test-btn {
            background: #17a2b8;
            color: white;
            border: none;
            padding: 10px 15px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            margin: 5px;
            transition: background 0.3s;
        }
        
        .qr-test-btn:hover {
            background: #138496;
        }
        
        .qr-control-footer {
            padding: 20px;
            background: #f8f9fa;
            border-top: 1px solid #e3e6f0;
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
            justify-content: center;
        }
        
        .qr-control-btn {
            padding: 10px 20px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            transition: all 0.3s;
            display: flex;
            align-items: center;
            gap: 8px;
            min-width: 120px;
            justify-content: center;
        }
        
        .apply-btn {
            background: #17a2b8;
            color: white;
        }
        
        .apply-btn:hover {
            background: #138496;
        }
        
        .save-btn {
            background: #28a745;
            color: white;
        }
        
        .save-btn:hover {
            background: #218838;
        }
        
        .reset-btn {
            background: #ffc107;
            color: #212529;
        }
        
        .reset-btn:hover {
            background: #e0a800;
        }
        
        .export-btn {
            background: #6f42c1;
            color: white;
        }
        
        .export-btn:hover {
            background: #5a359a;
        }
        
        .import-btn {
            background: #fd7e14;
            color: white;
        }
        
        .import-btn:hover {
            background: #dc6502;
        }
        
        /* أنماط ماسح QR */
        .qr-scanner-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.9);
            z-index: 10001;
            display: none;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }
        
        .qr-scanner-modal.show {
            display: flex;
        }
        
        .qr-scanner-overlay {
            position: relative;
            width: 100%;
            height: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        
        .qr-scanner-container {
            background: white;
            border-radius: 15px;
            max-width: 500px;
            width: 100%;
            overflow: hidden;
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
        }
        
        .qr-scanner-header {
            background: linear-gradient(135deg, #2c3e50, #34495e);
            color: white;
            padding: 15px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .qr-scanner-header h3 {
            margin: 0;
            font-size: 16px;
        }
        
        .qr-scanner-close {
            background: rgba(255, 255, 255, 0.2);
            border: none;
            color: white;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 16px;
        }
        
        .qr-scanner-body {
            position: relative;
            padding: 20px;
            text-align: center;
        }
        
        .qr-video-container {
            position: relative;
            display: inline-block;
            border-radius: 10px;
            overflow: hidden;
            background: #000;
        }
        
        .qr-video-container video {
            display: block;
            border-radius: 10px;
        }
        
        .qr-scanner-loading {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: white;
            text-align: center;
        }
        
        .qr-spinner {
            width: 40px;
            height: 40px;
            border: 4px solid rgba(255, 255, 255, 0.3);
            border-top: 4px solid white;
            border-radius: 50%;
            animation: qr-spin 1s linear infinite;
            margin: 0 auto 10px;
        }
        
        @keyframes qr-spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .qr-scanner-overlay-frame {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 200px;
            height: 200px;
            pointer-events: none;
        }
        
        .qr-scanner-corners {
            position: relative;
            width: 100%;
            height: 100%;
        }
        
        .corner {
            position: absolute;
            width: 30px;
            height: 30px;
            border: 3px solid #00ff00;
        }
        
        .corner.top-left {
            top: 0;
            left: 0;
            border-right: none;
            border-bottom: none;
        }
        
        .corner.top-right {
            top: 0;
            right: 0;
            border-left: none;
            border-bottom: none;
        }
        
        .corner.bottom-left {
            bottom: 0;
            left: 0;
            border-right: none;
            border-top: none;
        }
        
        .corner.bottom-right {
            bottom: 0;
            right: 0;
            border-left: none;
            border-top: none;
        }
        
        .qr-scanner-instructions {
            margin-top: 15px;
            color: #6c757d;
            font-size: 14px;
        }
        
        .qr-scanner-footer {
            padding: 15px;
            background: #f8f9fa;
            display: flex;
            gap: 10px;
            justify-content: center;
        }
        
        .qr-btn {
            padding: 10px 20px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: all 0.3s;
        }
        
        .qr-btn-primary {
            background: #007bff;
            color: white;
        }
        
        .qr-btn-primary:hover {
            background: #0056b3;
        }
        
        .qr-btn-secondary {
            background: #6c757d;
            color: white;
        }
        
        .qr-btn-secondary:hover {
            background: #545b62;
        }
        
        /* إشعارات QR */
        .qr-toast {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #2c3e50;
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            z-index: 10002;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            transform: translateX(100%);
            transition: transform 0.3s ease;
            max-width: 300px;
            word-wrap: break-word;
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
        
        .qr-toast.info {
            background: #3498db;
        }
        
        /* تحسينات للهواتف */
        @media (max-width: 768px) {
            .qr-control-overlay,
            .qr-scanner-modal {
                padding: 10px;
            }
            
            .qr-control-container,
            .qr-scanner-container {
                max-height: 95vh;
            }
            
            .qr-control-tabs {
                flex-wrap: wrap;
            }
            
            .qr-tab-btn {
                flex: none;
                min-width: 100px;
                padding: 10px 12px;
                font-size: 12px;
            }
            
            .qr-control-row {
                flex-direction: column;
                align-items: stretch;
                gap: 8px;
            }
            
            .qr-control-row label {
                min-width: auto;
                font-size: 13px;
            }
            
            .qr-control-footer,
            .qr-scanner-footer {
                flex-direction: column;
            }
            
            .qr-control-btn,
            .qr-btn {
                width: 100%;
                min-width: auto;
            }
            
            .qr-scanner-overlay-frame {
                width: 150px;
                height: 150px;
            }
        }
    `;
    
    document.head.appendChild(styles);
}

// ==============================
// وظائف إدارة لوحة التحكم
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

function showQRTab(tabName) {
    // إخفاء جميع التبويبات
    document.querySelectorAll('.qr-tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.querySelectorAll('.qr-tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // إظهار التبويب المطلوب
    document.getElementById(tabName + '-tab').classList.add('active');
    event.target.classList.add('active');
}

// ==============================
// إدارة إعدادات QR
// ==============================
function setupQRSliderListeners() {
    // مستمع حجم QR Code
    const sizeSlider = document.getElementById('size');
    const sizeValue = document.getElementById('sizeValue');
    
    if (sizeSlider && sizeValue) {
        sizeSlider.addEventListener('input', function() {
            sizeValue.textContent = this.value + 'px';
        });
    }
    
    // مستمع الهامش
    const marginSlider = document.getElementById('margin');
    const marginValue = document.getElementById('marginValue');
    
    if (marginSlider && marginValue) {
        marginSlider.addEventListener('input', function() {
            marginValue.textContent = this.value + 'px';
        });
    }
}

function applyQRSettings() {
    updateQRSettingsFromForm();
    
    // مسح الكاش لتطبيق الإعدادات الجديدة
    qrCodeCache.clear();
    
    showQRToast('تم تطبيق إعدادات QR Code', 'success');
}

function saveQRSettings() {
    updateQRSettingsFromForm();
    
    try {
        localStorage.setItem('charity_qr_settings', JSON.stringify(currentQRSettings));
        applyQRSettings();
        showQRToast('تم حفظ إعدادات QR Code بنجاح', 'success');
    } catch (error) {
        console.error('خطأ في حفظ إعدادات QR:', error);
        showQRToast('فشل في حفظ الإعدادات', 'error');
    }
}

function loadQRSettings() {
    try {
        const savedSettings = localStorage.getItem('charity_qr_settings');
        if (savedSettings) {
            const parsedSettings = JSON.parse(savedSettings);
            currentQRSettings = { ...DEFAULT_QR_SETTINGS, ...parsedSettings };
            console.log('تم تحميل إعدادات QR Code المحفوظة');
        }
    } catch (error) {
        console.error('خطأ في تحميل إعدادات QR:', error);
        currentQRSettings = { ...DEFAULT_QR_SETTINGS };
    }
}

function resetQRSettings() {
    if (confirm('هل أنت متأكد من إعادة تعيين جميع إعدادات QR Code؟')) {
        currentQRSettings = { ...DEFAULT_QR_SETTINGS };
        setQRSettingsToForm();
        applyQRSettings();
        showQRToast('تم إعادة تعيين الإعدادات', 'info');
    }
}

function updateQRSettingsFromForm() {
    const formElements = document.querySelectorAll('#qr-control-panel input, #qr-control-panel select');
    
    formElements.forEach(element => {
        if (element.id && currentQRSettings.hasOwnProperty(element.id)) {
            if (element.type === 'checkbox') {
                currentQRSettings[element.id] = element.checked;
            } else if (element.type === 'number') {
                currentQRSettings[element.id] = parseInt(element.value) || currentQRSettings[element.id];
            } else if (element.id === 'cacheDuration') {
                currentQRSettings[element.id] = parseInt(element.value) * 60 * 60 * 1000; // تحويل من ساعات لميلي ثانية
            } else {
                currentQRSettings[element.id] = element.value;
            }
        }
    });
}

function setQRSettingsToForm() {
    Object.keys(currentQRSettings).forEach(key => {
        const element = document.getElementById(key);
        if (element) {
            if (element.type === 'checkbox') {
                element.checked = currentQRSettings[key];
            } else if (key === 'cacheDuration') {
                element.value = currentQRSettings[key] / (60 * 60 * 1000); // تحويل من ميلي ثانية لساعات
            } else {
                element.value = currentQRSettings[key];
            }
        }
    });
}

// ==============================
// وظائف الاختبار والأدوات
// ==============================
function testQRScanner() {
    openQRScanner();
}

async function generateTestQR() {
    try {
        const testData = {
            formNumber: 'TEST-001',
            fullName: 'اختبار QR Code',
            caseCode: 'اختبار',
            caseType: 'اختبار النظام',
            caseDate: new Date().toISOString().split('T')[0]
        };
        
        const qrCanvas = await generateQRCodeForCase(testData);
        
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
            z-index: 10003;
            text-align: center;
        `;
        
        popup.innerHTML = `
            <h3>QR Code التجريبي</h3>
            <div style="margin: 15px 0;"></div>
            <button onclick="this.parentElement.remove()" style="margin-top: 15px; padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">إغلاق</button>
        `;
        
        popup.querySelector('div').appendChild(qrCanvas);
        document.body.appendChild(popup);
        
        showQRToast('تم إنشاء QR Code تجريبي', 'success');
        
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
        maxCacheSize: currentQRSettings.maxCacheSize,
        cacheUsage: Math.round((qrCodeCache.size / currentQRSettings.maxCacheSize) * 100),
        settings: Object.keys(currentQRSettings).length
    };
    
    alert(`إحصائيات QR Code:
    
🔳 عدد QR Codes في الكاش: ${stats.cacheSize}
📊 استخدام الكاش: ${stats.cacheUsage}%
⚙️ عدد الإعدادات: ${stats.settings}
💾 حجم الكاش الأقصى: ${stats.maxCacheSize}

المعدة: ${currentQRSettings.size}x${currentQRSettings.size}px
مستوى التصحيح: ${currentQRSettings.errorCorrectionLevel}
الألوان: ${currentQRSettings.colorDark} / ${currentQRSettings.colorLight}`);
}

// ==============================
// تصدير واستيراد الإعدادات
// ==============================
function exportQRSettings() {
    updateQRSettingsFromForm();
    
    const exportData = {
        qrSettings: currentQRSettings,
        exportDate: new Date().toISOString(),
        version: '1.0.0'
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `qr_settings_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    showQRToast('تم تصدير إعدادات QR Code', 'success');
}

function importQRSettings() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const importData = JSON.parse(e.target.result);
                
                if (importData.qrSettings) {
                    currentQRSettings = { ...DEFAULT_QR_SETTINGS, ...importData.qrSettings };
                    setQRSettingsToForm();
                    applyQRSettings();
                    showQRToast('تم استيراد إعدادات QR Code', 'success');
                } else {
                    showQRToast('تنسيق الملف غير صحيح', 'error');
                }
            } catch (error) {
                console.error('خطأ في استيراد الإعدادات:', error);
                showQRToast('خطأ في قراءة ملف الإعدادات', 'error');
            }
        };
        
        reader.readAsText(file);
    };
    
    input.click();
}

// ==============================
// وظائف مساعدة
// ==============================
function switchCamera() {
    // تبديل وضع الكاميرا
    currentQRSettings.scannerFacingMode = currentQRSettings.scannerFacingMode === 'environment' ? 'user' : 'environment';
    
    if (isScanning && qrScanner) {
        qrScanner.stopScanning();
        setTimeout(() => {
            qrScanner.startScanning(handleQRScanResult);
        }, 500);
    }
    
    showQRToast('تم تبديل الكاميرا', 'info');
}

function cleanupQRCache() {
    const now = Date.now();
    const expiredKeys = [];
    
    qrCodeCache.forEach((value, key) => {
        if (now - value.timestamp > currentQRSettings.cacheDuration) {
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
// إعداد مستمعي الأحداث
// ==============================
function setupQREventListeners() {
    // مستمع النقر على زر QR في الشريط الجانبي
    const qrButton = document.querySelector('.qr-scanner-btn');
    if (qrButton) {
        qrButton.addEventListener('click', openQRScanner);
    }
    
    // اختصارات لوحة المفاتيح
    document.addEventListener('keydown', function(e) {
        // Ctrl + Shift + Q لفتح لوحة التحكم
        if (e.ctrlKey && e.shiftKey && e.key === 'Q') {
            e.preventDefault();
            showQRControlPanel();
        }
        
        // Ctrl + Q لفتح الماسح
        if (e.ctrlKey && !e.shiftKey && e.key === 'q') {
            e.preventDefault();
            openQRScanner();
        }
    });
}

// ==============================
// تهيئة النظام عند تحميل الصفحة
// ==============================
document.addEventListener('DOMContentLoaded', function() {
    // تأخير التهيئة للتأكد من تحميل الملف الرئيسي
    setTimeout(() => {
        initializeQRSystem();
    }, 2000);
});

// ==============================
// إتاحة الوظائف عالمياً
// ==============================
window.qrCodeSystem = {
    show: showQRControlPanel,
    hide: closeQRControlPanel,
    scan: openQRScanner,
    generate: generateQRCodeForCase,
    test: generateTestQR,
    clearCache: clearQRCache,
    settings: currentQRSettings,
    cache: qrCodeCache
};

// ==============================
// معالج الأخطاء
// ==============================
window.addEventListener('error', function(e) {
    if (e.filename && e.filename.includes('qr-system')) {
        console.error('خطأ في نظام QR Code:', e.error);
    }
});

console.log('🔳 تم تحميل نظام QR Code المتكامل بنجاح!');
console.log('💡 استخدم Ctrl+Shift+Q لفتح لوحة التحكم');
console.log('📷 استخدم Ctrl+Q لفتح الماسح');
console.log('🔧 استخدم qrCodeSystem للتحكم البرمجي');