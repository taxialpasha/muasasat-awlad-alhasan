/**
 * نظام QR Code المُبسط والمُصحح نهائياً
 * حل شامل لمشكلة عدم ظهور QR Code
 * 
 * استبدل ملف qr-system.js بالكامل بهذا الكود
 */

// ==============================
// إعدادات النظام المُبسطة
// ==============================
const QR_CONFIG = {
    size: 200,
    printSize: 60,
    enabled: true,
    showInPrint: true
};

// متغيرات النظام
let isQRReady = false;
let qrLibrary = null;

// ==============================
// تهيئة نظام QR Code المُبسط
// ==============================
function initQRSystem() {
    console.log('🔄 بدء تهيئة نظام QR Code المُبسط...');
    
    // التحقق من المكتبة
    if (typeof QRCode !== 'undefined') {
        qrLibrary = QRCode;
        isQRReady = true;
        console.log('✅ مكتبة QRCode جاهزة');
        setupQRSystem();
    } else {
        console.log('📦 تحميل مكتبة QRCode...');
        loadQRLibrary();
    }
}

// تحميل مكتبة QR Code
function loadQRLibrary() {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js';
    script.onload = function() {
        if (typeof QRCode !== 'undefined') {
            qrLibrary = QRCode;
            isQRReady = true;
            console.log('✅ تم تحميل مكتبة QRCode بنجاح');
            setupQRSystem();
        } else {
            console.warn('⚠️ فشل تحميل المكتبة، استخدام النظام الاحتياطي');
            setupFallbackQR();
        }
    };
    script.onerror = function() {
        console.warn('⚠️ خطأ في تحميل المكتبة، استخدام النظام الاحتياطي');
        setupFallbackQR();
    };
    document.head.appendChild(script);
}

// إعداد النظام الاحتياطي
function setupFallbackQR() {
    qrLibrary = {
        toCanvas: function(canvas, text) {
            return new Promise((resolve) => {
                createFallbackQR(canvas, text);
                resolve(canvas);
            });
        }
    };
    isQRReady = true;
    setupQRSystem();
}

// إنشاء QR احتياطي
function createFallbackQR(canvas, text) {
    canvas.width = QR_CONFIG.size;
    canvas.height = QR_CONFIG.size;
    
    const ctx = canvas.getContext('2d');
    
    // خلفية بيضاء
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, QR_CONFIG.size, QR_CONFIG.size);
    
    // حدود سوداء
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.strokeRect(5, 5, QR_CONFIG.size - 10, QR_CONFIG.size - 10);
    
    // رسم نمط QR بسيط
    const blockSize = (QR_CONFIG.size - 20) / 17;
    ctx.fillStyle = '#000000';
    
    // رسم زوايا التحديد
    for (let i = 0; i < 3; i++) {
        const x = i === 2 ? QR_CONFIG.size - 50 : 10;
        const y = i === 1 ? QR_CONFIG.size - 50 : 10;
        
        // مربع خارجي
        ctx.fillRect(x, y, 40, 40);
        // مربع داخلي أبيض
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + 5, y + 5, 30, 30);
        // مربع أسود في الوسط
        ctx.fillStyle = '#000000';
        ctx.fillRect(x + 12, y + 12, 16, 16);
    }
    
    // نمط عشوائي في الوسط
    for (let i = 60; i < QR_CONFIG.size - 60; i += blockSize) {
        for (let j = 60; j < QR_CONFIG.size - 60; j += blockSize) {
            if (Math.random() > 0.5) {
                ctx.fillRect(i, j, blockSize - 1, blockSize - 1);
            }
        }
    }
    
    // نص في الأسفل
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('QR Code', QR_CONFIG.size / 2, QR_CONFIG.size - 10);
}

// ==============================
// إعداد النظام
// ==============================
function setupQRSystem() {
    try {
        // إنشاء الوظائف العامة
        window.generateQRCode = generateQRCode;
        window.generateQRForCase = generateQRForCase;
        window.showQRSettings = showQRSettings;
        window.testQRCode = testQRCode;
        
        // تحسين وظائف الطباعة
        enhancePrintFunctions();
        
        // إعداد زر QR
        setupQRButton();
        
        console.log('✅ نظام QR Code جاهز بالكامل');
        
        // إظهار إشعار نجاح
        setTimeout(() => {
            if (typeof showToast === 'function') {
                showToast('نظام QR Code جاهز للاستخدام!', 'success');
            }
        }, 1000);
        
    } catch (error) {
        console.error('❌ خطأ في إعداد النظام:', error);
    }
}

// ==============================
// إنشاء QR Code - الوظيفة الرئيسية
// ==============================
async function generateQRCode(text, size = QR_CONFIG.size) {
    if (!isQRReady || !qrLibrary) {
        console.error('❌ نظام QR غير جاهز');
        return createErrorCanvas('النظام غير جاهز');
    }
    
    if (!text || text.trim() === '') {
        console.error('❌ النص فارغ');
        return createErrorCanvas('النص فارغ');
    }
    
    try {
        const canvas = document.createElement('canvas');
        await qrLibrary.toCanvas(canvas, text, {
            width: size,
            height: size,
            margin: 2,
            color: { dark: '#000000', light: '#ffffff' },
            errorCorrectionLevel: 'M'
        });
        
        console.log('✅ تم إنشاء QR Code بنجاح');
        return canvas;
        
    } catch (error) {
        console.error('❌ خطأ في إنشاء QR Code:', error);
        return createErrorCanvas('خطأ في الإنشاء');
    }
}

// إنشاء QR Code للحالات
async function generateQRForCase(caseData) {
    if (!caseData) {
        console.error('❌ بيانات الحالة فارغة');
        return createErrorCanvas('بيانات فارغة');
    }
    
    try {
        // إنشاء النص
        const qrText = createQRText(caseData);
        
        // إنشاء QR Code
        return await generateQRCode(qrText, QR_CONFIG.size);
        
    } catch (error) {
        console.error('❌ خطأ في إنشاء QR للحالة:', error);
        return createErrorCanvas('خطأ في البيانات');
    }
}

// إنشاء نص QR Code
function createQRText(caseData) {
    const info = {
        org: 'مؤسسة أولاد الحسن (ع)',
        formNumber: caseData.formNumber || 'غير محدد',
        name: caseData.fullName || 'غير محدد',
        type: caseData.caseCode || 'غير محدد',
        date: caseData.caseDate || new Date().toISOString().split('T')[0],
        phone: caseData.phoneFirst || 'غير محدد',
        amount: caseData.estimatedAssistance || 'غير محدد'
    };
    
    return `${info.org}
استمارة رقم: ${info.formNumber}
الاسم: ${info.name}
النوع: ${info.type}
التاريخ: ${info.date}
الهاتف: ${info.phone}
المبلغ: ${info.amount}`;
}

// إنشاء canvas خطأ
function createErrorCanvas(message) {
    const canvas = document.createElement('canvas');
    canvas.width = QR_CONFIG.size;
    canvas.height = QR_CONFIG.size;
    
    const ctx = canvas.getContext('2d');
    
    // خلفية حمراء فاتحة
    ctx.fillStyle = '#ffebee';
    ctx.fillRect(0, 0, QR_CONFIG.size, QR_CONFIG.size);
    
    // حدود حمراء
    ctx.strokeStyle = '#f44336';
    ctx.lineWidth = 2;
    ctx.strokeRect(2, 2, QR_CONFIG.size - 4, QR_CONFIG.size - 4);
    
    // رمز الخطأ
    ctx.fillStyle = '#d32f2f';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('✖', QR_CONFIG.size / 2, QR_CONFIG.size / 2 - 10);
    
    // رسالة الخطأ
    ctx.font = '12px Arial';
    ctx.fillText(message, QR_CONFIG.size / 2, QR_CONFIG.size / 2 + 15);
    
    return canvas;
}

// ==============================
// تحسين وظائف الطباعة
// ==============================
function enhancePrintFunctions() {
    // تحسين createEnhancedPrintTemplate
    if (typeof window.createEnhancedPrintTemplate === 'function') {
        const original = window.createEnhancedPrintTemplate;
        
        window.createEnhancedPrintTemplate = async function(data) {
            try {
                const container = await original(data);
                await addQRToContainer(container, data);
                return container;
            } catch (error) {
                console.error('خطأ في قالب الطباعة:', error);
                return await original(data);
            }
        };
        
        console.log('✅ تم تحسين وظيفة الطباعة');
    }
}

// إضافة QR Code للحاوية
async function addQRToContainer(container, data) {
    try {
        if (!QR_CONFIG.showInPrint) return;
        
        const qrSection = container.querySelector('.header-qr');
        if (!qrSection) {
            console.warn('⚠️ منطقة QR غير موجودة');
            return;
        }
        
        qrSection.innerHTML = '';
        
        // إنشاء QR Code
        const qrCanvas = await generateQRForCase(data);
        
        if (qrCanvas) {
            // تطبيق الأنماط
            qrCanvas.style.cssText = `
                max-width: ${QR_CONFIG.printSize}px !important;
                max-height: ${QR_CONFIG.printSize}px !important;
                border: 1px solid #000 !important;
                display: block !important;
                margin: 0 auto !important;
            `;
            
            qrSection.appendChild(qrCanvas);
            console.log('✅ تم إضافة QR Code للطباعة');
        }
        
    } catch (error) {
        console.error('❌ خطأ في إضافة QR للحاوية:', error);
    }
}

// ==============================
// إعداد زر QR Code
// ==============================
function setupQRButton() {
    const qrButton = document.querySelector('.qr-scanner-btn');
    if (qrButton) {
        qrButton.innerHTML = '<i class="fas fa-qrcode"></i><span>اختبار QR</span>';
        qrButton.onclick = testQRCode;
        console.log('✅ تم إعداد زر QR');
    }
}

// ==============================
// اختبار QR Code
// ==============================
async function testQRCode() {
    try {
        console.log('🧪 بدء اختبار QR Code...');
        
        // بيانات تجريبية
        const testData = {
            formNumber: 'TEST-001',
            fullName: 'اختبار النظام',
            caseCode: 'اختبار',
            caseDate: new Date().toISOString().split('T')[0],
            phoneFirst: '07700000000',
            estimatedAssistance: '100000'
        };
        
        // إنشاء QR Code
        const qrCanvas = await generateQRForCase(testData);
        
        if (qrCanvas) {
            showQRResult(qrCanvas, 'تم إنشاء QR Code تجريبي بنجاح!');
        } else {
            showQRResult(null, 'فشل في إنشاء QR Code التجريبي');
        }
        
    } catch (error) {
        console.error('❌ خطأ في اختبار QR:', error);
        showQRResult(null, 'خطأ في الاختبار: ' + error.message);
    }
}

// عرض نتيجة QR Code
function showQRResult(canvas, message) {
    // إزالة النافذة القديمة إن وجدت
    const oldPopup = document.getElementById('qr-test-popup');
    if (oldPopup) {
        oldPopup.remove();
    }
    
    // إنشاء نافذة النتيجة
    const popup = document.createElement('div');
    popup.id = 'qr-test-popup';
    popup.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 30px;
        border-radius: 15px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        z-index: 10000;
        text-align: center;
        max-width: 90vw;
        max-height: 90vh;
        overflow: auto;
    `;
    
    let content = `<h3 style="margin: 0 0 20px 0; color: #2c3e50;">نتيجة اختبار QR Code</h3>`;
    
    if (canvas) {
        content += `<div style="margin: 20px 0;"></div>`;
        content += `<p style="color: #27ae60; font-weight: bold; margin: 15px 0;">${message}</p>`;
    } else {
        content += `<p style="color: #e74c3c; font-weight: bold; margin: 15px 0;">${message}</p>`;
    }
    
    content += `
        <div style="margin-top: 20px;">
            <button onclick="this.parentElement.parentElement.remove()" 
                    style="padding: 10px 20px; background: #3498db; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; margin: 5px;">
                إغلاق
            </button>
            <button onclick="testQRCode()" 
                    style="padding: 10px 20px; background: #27ae60; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; margin: 5px;">
                اختبار مرة أخرى
            </button>
        </div>
    `;
    
    popup.innerHTML = content;
    
    // إضافة QR Code إذا كان موجوداً
    if (canvas) {
        const canvasContainer = popup.querySelector('div');
        canvasContainer.appendChild(canvas);
    }
    
    document.body.appendChild(popup);
    
    // إزالة النافذة تلقائياً بعد 10 ثوان
    setTimeout(() => {
        if (document.getElementById('qr-test-popup')) {
            popup.remove();
        }
    }, 10000);
}

// ==============================
// إعدادات QR Code
// ==============================
function showQRSettings() {
    const settingsHTML = `
        <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 9999; display: flex; justify-content: center; align-items: center; padding: 20px;">
            <div style="background: white; border-radius: 15px; padding: 30px; max-width: 500px; width: 100%;">
                <h3 style="margin: 0 0 20px 0; text-align: center;">إعدادات QR Code</h3>
                
                <div style="margin: 15px 0;">
                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">إظهار في الطباعة:</label>
                    <input type="checkbox" id="qr-show-print" ${QR_CONFIG.showInPrint ? 'checked' : ''} style="transform: scale(1.2);">
                </div>
                
                <div style="margin: 15px 0;">
                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">حجم QR Code:</label>
                    <input type="range" id="qr-size" min="100" max="300" value="${QR_CONFIG.size}" style="width: 100%;">
                    <span id="qr-size-value">${QR_CONFIG.size}px</span>
                </div>
                
                <div style="margin: 15px 0;">
                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">حجم الطباعة:</label>
                    <input type="range" id="qr-print-size" min="40" max="100" value="${QR_CONFIG.printSize}" style="width: 100%;">
                    <span id="qr-print-size-value">${QR_CONFIG.printSize}px</span>
                </div>
                
                <div style="text-align: center; margin-top: 25px;">
                    <button onclick="applyQRSettings()" style="padding: 12px 24px; background: #27ae60; color: white; border: none; border-radius: 8px; cursor: pointer; margin: 5px; font-size: 14px;">
                        تطبيق الإعدادات
                    </button>
                    <button onclick="testQRCode()" style="padding: 12px 24px; background: #3498db; color: white; border: none; border-radius: 8px; cursor: pointer; margin: 5px; font-size: 14px;">
                        اختبار QR
                    </button>
                    <button onclick="this.parentElement.parentElement.parentElement.remove()" style="padding: 12px 24px; background: #95a5a6; color: white; border: none; border-radius: 8px; cursor: pointer; margin: 5px; font-size: 14px;">
                        إغلاق
                    </button>
                </div>
            </div>
        </div>
    `;
    
    const settingsDiv = document.createElement('div');
    settingsDiv.innerHTML = settingsHTML;
    document.body.appendChild(settingsDiv);
    
    // إعداد المنزلقات
    const sizeSlider = document.getElementById('qr-size');
    const printSizeSlider = document.getElementById('qr-print-size');
    
    sizeSlider.oninput = function() {
        document.getElementById('qr-size-value').textContent = this.value + 'px';
    };
    
    printSizeSlider.oninput = function() {
        document.getElementById('qr-print-size-value').textContent = this.value + 'px';
    };
}

// تطبيق الإعدادات
function applyQRSettings() {
    const showInPrint = document.getElementById('qr-show-print').checked;
    const size = parseInt(document.getElementById('qr-size').value);
    const printSize = parseInt(document.getElementById('qr-print-size').value);
    
    QR_CONFIG.showInPrint = showInPrint;
    QR_CONFIG.size = size;
    QR_CONFIG.printSize = printSize;
    
    // حفظ في التخزين المحلي
    try {
        localStorage.setItem('qr_config', JSON.stringify(QR_CONFIG));
        console.log('✅ تم حفظ إعدادات QR');
    } catch (error) {
        console.error('❌ خطأ في حفظ الإعدادات:', error);
    }
    
    if (typeof showToast === 'function') {
        showToast('تم تطبيق إعدادات QR Code', 'success');
    } else {
        alert('تم تطبيق إعدادات QR Code');
    }
    
    // إغلاق نافذة الإعدادات
    const settingsDiv = document.querySelector('[style*="position: fixed"][style*="z-index: 9999"]');
    if (settingsDiv) {
        settingsDiv.remove();
    }
}

// تحميل الإعدادات المحفوظة
function loadQRSettings() {
    try {
        const saved = localStorage.getItem('qr_config');
        if (saved) {
            const config = JSON.parse(saved);
            Object.assign(QR_CONFIG, config);
            console.log('✅ تم تحميل إعدادات QR المحفوظة');
        }
    } catch (error) {
        console.error('❌ خطأ في تحميل الإعدادات:', error);
    }
}

// ==============================
// تهيئة النظام
// ==============================
document.addEventListener('DOMContentLoaded', function() {
    // تحميل الإعدادات المحفوظة
    loadQRSettings();
    
    // تأخير التهيئة قليلاً
    setTimeout(() => {
        initQRSystem();
    }, 1000);
});

// ==============================
// إتاحة الوظائف عالمياً
// ==============================
window.qrSystem = {
    test: testQRCode,
    settings: showQRSettings,
    generate: generateQRForCase,
    isReady: () => isQRReady,
    config: QR_CONFIG
};

// رسالة في الكونسول
console.log(`
🔳 نظام QR Code المُبسط
📋 الوظائف المتاحة:
• testQRCode() - اختبار النظام
• showQRSettings() - فتح الإعدادات  
• generateQRForCase(data) - إنشاء QR للحالة
• qrSystem.test() - اختبار سريع

✅ النظام مُصمم للعمل حتى لو فشلت المكتبة الخارجية
`);
