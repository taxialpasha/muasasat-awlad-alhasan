// ==============================
// نظام QR Code المتكامل للتطبيق الخيري
// ملف: qr-system.js
// الإصدار: 2.0.0
// ==============================

(function() {
    'use strict';

    // ==============================
    // المتغيرات العامة
    // ==============================
    let isSystemReady = false;
    let qrCodeCache = new Map();
    let scanner = null;
    let isScanning = false;
    let currentCameraId = null;
    let availableCameras = [];

    // ==============================
    // تحميل المكتبات المطلوبة
    // ==============================
    function loadQRLibraries() {
        return new Promise((resolve, reject) => {
            let loadedCount = 0;
            const totalLibraries = 2;

            function checkComplete() {
                loadedCount++;
                if (loadedCount === totalLibraries) {
                    console.log('✅ تم تحميل جميع مكتبات QR Code بنجاح');
                    isSystemReady = true;
                    resolve();
                }
            }

            // تحميل مكتبة QRCode للإنشاء
            if (typeof QRCode === 'undefined') {
                const qrScript = document.createElement('script');
                qrScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcode/1.5.3/qrcode.min.js';
                qrScript.onload = checkComplete;
                qrScript.onerror = () => {
                    console.warn('⚠️ فشل في تحميل مكتبة QRCode، سيتم استخدام النظام الاحتياطي');
                    checkComplete();
                };
                document.head.appendChild(qrScript);
            } else {
                checkComplete();
            }

            // تحميل مكتبة Html5Qrcode للقراءة
            if (typeof Html5Qrcode === 'undefined') {
                const scanScript = document.createElement('script');
                scanScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/html5-qrcode/2.3.8/html5-qrcode.min.js';
                scanScript.onload = checkComplete;
                scanScript.onerror = () => {
                    console.warn('⚠️ فشل في تحميل مكتبة Html5Qrcode، سيتم تعطيل وظيفة المسح');
                    checkComplete();
                };
                document.head.appendChild(scanScript);
            } else {
                checkComplete();
            }
        });
    }

    // ==============================
    // إنشاء QR Code المُحسن
    // ==============================
    async function generateQRCode(data, options = {}) {
        try {
            // تحضير النص العربي
            const qrText = generateQRText(data);
            
            // الخيارات الافتراضية
            const defaultOptions = {
                width: options.width || 120,
                height: options.height || 120,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                },
                errorCorrectionLevel: 'M'
            };

            // دمج الخيارات
            const finalOptions = { ...defaultOptions, ...options };

            // التحقق من الكاش
            const cacheKey = qrText + JSON.stringify(finalOptions);
            if (qrCodeCache.has(cacheKey)) {
                console.log('📋 تم استرجاع QR Code من الكاش');
                return qrCodeCache.get(cacheKey).cloneNode(true);
            }

            const canvas = document.createElement('canvas');

            if (typeof QRCode !== 'undefined') {
                // استخدام مكتبة QRCode
                await QRCode.toCanvas(canvas, qrText, finalOptions);
            } else {
                // النظام الاحتياطي
                createFallbackQR(canvas, qrText, finalOptions);
            }

            // حفظ في الكاش
            qrCodeCache.set(cacheKey, canvas.cloneNode(true));

            return canvas;

        } catch (error) {
            console.error('❌ خطأ في إنشاء QR Code:', error);
            return createErrorQR(options.width || 120);
        }
    }

    // ==============================
    // إنشاء نص QR Code المُحسن باللغة العربية
    // ==============================
    function generateQRText(data) {
        const today = new Date();
        const formattedDate = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;
        
        // الحصول على إعدادات النظام من التطبيق الرئيسي
        const systemSettings = window.systemSettings || {
            orgName: 'مؤسسة أولاد الحسن (ع) الثقافية الخيرية'
        };

        // معالجة المنظم
        let organizer = data.organizer;
        if (data.organizer === 'other' && data.organizerCustom) {
            organizer = data.organizerCustom;
        }

        // إنشاء النص المُفصل باللغة العربية
        let qrText = `=== ${systemSettings.orgName} ===\n\n`;
        
        qrText += `📋 معلومات الاستمارة:\n`;
        qrText += `• رقم الاستمارة: ${data.formNumber || 'غير محدد'}\n`;
        qrText += `• رمز الحالة: ${data.caseCode || 'غير محدد'}\n`;
        qrText += `• نوع الحالة: ${data.caseType || 'غير محدد'}\n`;
        qrText += `• التاريخ: ${data.caseDate || formattedDate}\n`;
        qrText += `• المنظم: ${organizer || 'غير محدد'}\n\n`;

        qrText += `👤 البيانات الشخصية:\n`;
        qrText += `• الاسم الكامل: ${data.fullName || 'غير محدد'}\n`;
        if (data.lastName) qrText += `• اللقب: ${data.lastName}\n`;
        if (data.parentName) qrText += `• أبو/أم: ${data.parentName}\n`;
        if (data.age) qrText += `• العمر: ${data.age} سنة\n`;
        if (data.socialStatus) qrText += `• الحالة الاجتماعية: ${data.socialStatus}\n`;
        if (data.address) qrText += `• العنوان: ${data.address}\n\n`;

        if (data.caseDescription) {
            qrText += `📝 شرح الحالة:\n${data.caseDescription}\n\n`;
        }

        qrText += `💰 المعلومات المالية:\n`;
        if (data.govSalary && parseInt(data.govSalary) > 0) {
            qrText += `• راتب حكومي: ${formatNumber(data.govSalary)} دينار\n`;
        }
        if (data.orgSalary && parseInt(data.orgSalary) > 0) {
            qrText += `• راتب مؤسسة: ${formatNumber(data.orgSalary)} دينار\n`;
        }
        if (data.incomeAmount && parseInt(data.incomeAmount) > 0) {
            qrText += `• مقدار الدخل: ${formatNumber(data.incomeAmount)} دينار\n`;
        }
        if (data.expenses && parseInt(data.expenses) > 0) {
            qrText += `• المصروفات: ${formatNumber(data.expenses)} دينار\n`;
        }
        if (data.incomeRemaining) {
            qrText += `• باقي الدخل: ${formatNumber(data.incomeRemaining)} دينار\n`;
        }
        qrText += '\n';

        qrText += `🏠 معلومات العائلة:\n`;
        if (data.housingType) qrText += `• نوع السكن: ${data.housingType}\n`;
        if (data.housingType === 'إيجار' && data.rentAmount) {
            qrText += `• مقدار الإيجار: ${formatNumber(data.rentAmount)} دينار\n`;
        }
        if (data.totalFamilyMembers) qrText += `• أفراد الأسرة: ${data.totalFamilyMembers}\n`;
        if (data.maleChildren) qrText += `• بنين: ${data.maleChildren}\n`;
        if (data.femaleChildren) qrText += `• بنات: ${data.femaleChildren}\n`;
        if (data.married) qrText += `• متزوجين: ${data.married}\n\n`;

        // تفاصيل أفراد العائلة
        if (data.familyMembers) {
            if (data.familyMembers.males && data.familyMembers.males.length > 0) {
                qrText += `👦 البنين:\n`;
                data.familyMembers.males.forEach((male, index) => {
                    qrText += `  ${index + 1}. العمر: ${male.age || 'غير محدد'} - المهنة: ${male.job || 'غير محدد'}\n`;
                });
                qrText += '\n';
            }

            if (data.familyMembers.females && data.familyMembers.females.length > 0) {
                qrText += `👧 البنات:\n`;
                data.familyMembers.females.forEach((female, index) => {
                    qrText += `  ${index + 1}. العمر: ${female.age || 'غير محدد'} - المهنة: ${female.job || 'غير محدد'}\n`;
                });
                qrText += '\n';
            }

            if (data.familyMembers.married && data.familyMembers.married.length > 0) {
                qrText += `💑 المتزوجين:\n`;
                data.familyMembers.married.forEach((married, index) => {
                    qrText += `  ${index + 1}. العمر: ${married.age || 'غير محدد'} - المهنة: ${married.job || 'غير محدد'}\n`;
                });
                qrText += '\n';
            }
        }

        if (data.hospitalName || data.doctorName || data.caseTypeDetail) {
            qrText += `🏥 المعلومات الطبية:\n`;
            if (data.hospitalName) qrText += `• المستشفى: ${data.hospitalName}\n`;
            if (data.hospitalAddress) qrText += `• عنوان المستشفى: ${data.hospitalAddress}\n`;
            if (data.caseTypeDetail) qrText += `• نوع الحالة الطبية: ${data.caseTypeDetail}\n`;
            if (data.doctorName) qrText += `• اسم الدكتور: ${data.doctorName}\n\n`;
        }

        if (data.phoneFirst || data.phoneSecond) {
            qrText += `📱 معلومات الاتصال:\n`;
            if (data.phoneFirst && data.phoneFirst !== '00000000000') {
                qrText += `• هاتف 1: ${data.phoneFirst}\n`;
            }
            if (data.phoneSecond && data.phoneSecond !== '00000000000') {
                qrText += `• هاتف 2: ${data.phoneSecond}\n`;
            }
            qrText += '\n';
        }

        if (data.spouseName || data.spouseJob) {
            qrText += `💍 معلومات الزوج/ة:\n`;
            if (data.spouseName) qrText += `• الاسم: ${data.spouseName}\n`;
            if (data.spouseLastName) qrText += `• اللقب: ${data.spouseLastName}\n`;
            if (data.spouseJob) qrText += `• المهنة: ${data.spouseJob}\n`;
            if (data.spouseSalary && parseInt(data.spouseSalary) > 0) {
                qrText += `• الراتب: ${formatNumber(data.spouseSalary)} دينار\n`;
            }
            qrText += '\n';
        }

        if (data.hasOtherSupport === 'نعم' && data.supporterName) {
            qrText += `🤝 معلومات المعيل الآخر:\n`;
            qrText += `• اسم المعيل: ${data.supporterName}\n`;
            if (data.supporterRelation) qrText += `• صلة القرابة: ${data.supporterRelation}\n`;
            qrText += '\n';
        }

        if (data.estimatedAssistance && data.estimatedAssistance.trim() !== '') {
            qrText += `💸 مبلغ المساعدة المقدر:\n`;
            qrText += `${formatNumber(data.estimatedAssistance)} دينار\n\n`;
        }

        if (data.notes) {
            qrText += `📝 ملاحظات:\n${data.notes}\n\n`;
        }

        qrText += `📅 تاريخ الإصدار: ${formattedDate}\n`;
        qrText += `🔗 المصدر: نظام إدارة الحالات الخيرية`;

        return qrText;
    }

    // ==============================
    // QR Code احتياطي
    // ==============================
    function createFallbackQR(canvas, text, options) {
        const size = options.width || 120;
        canvas.width = size;
        canvas.height = size;
        
        const ctx = canvas.getContext('2d');
        
        // خلفية بيضاء
        ctx.fillStyle = options.color?.light || '#ffffff';
        ctx.fillRect(0, 0, size, size);
        
        // حدود سوداء
        ctx.strokeStyle = options.color?.dark || '#000000';
        ctx.lineWidth = 2;
        ctx.strokeRect(2, 2, size - 4, size - 4);
        
        // نص QR في المنتصف
        ctx.fillStyle = options.color?.dark || '#000000';
        ctx.font = `${Math.floor(size / 12)}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText('QR', size / 2, size / 2 - 8);
        ctx.font = `${Math.floor(size / 18)}px Arial`;
        ctx.fillText('CODE', size / 2, size / 2 + 8);
        
        // نقاط الزوايا
        const cornerSize = Math.floor(size / 8);
        ctx.fillRect(5, 5, cornerSize, cornerSize);
        ctx.fillRect(size - cornerSize - 5, 5, cornerSize, cornerSize);
        ctx.fillRect(5, size - cornerSize - 5, cornerSize, cornerSize);
    }

    // ==============================
    // QR Code للخطأ
    // ==============================
    function createErrorQR(size = 120) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        
        const ctx = canvas.getContext('2d');
        
        // خلفية حمراء فاتحة
        ctx.fillStyle = '#ffe6e6';
        ctx.fillRect(0, 0, size, size);
        
        // حدود حمراء
        ctx.strokeStyle = '#e74c3c';
        ctx.lineWidth = 2;
        ctx.strokeRect(2, 2, size - 4, size - 4);
        
        // نص الخطأ
        ctx.fillStyle = '#e74c3c';
        ctx.font = `${Math.floor(size / 15)}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText('ERROR', size / 2, size / 2);
        
        return canvas;
    }

    // ==============================
    // إنشاء واجهة مسح QR Code
    // ==============================
    function createQRScannerInterface() {
        // إنشاء النافذة المنبثقة
        const modal = document.createElement('div');
        modal.id = 'qr-scanner-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.9);
            z-index: 10000;
            display: none;
            justify-content: center;
            align-items: center;
            backdrop-filter: blur(10px);
        `;

        modal.innerHTML = `
            <div id="qr-scanner-container" style="
                background: white;
                border-radius: 15px;
                padding: 20px;
                max-width: 90vw;
                max-height: 90vh;
                overflow: auto;
                box-shadow: 0 10px 50px rgba(0, 0, 0, 0.3);
                position: relative;
            ">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h2 style="margin: 0; color: #2c3e50; font-size: 18px;">
                        <i class="fas fa-qrcode" style="margin-left: 10px; color: #3498db;"></i>
                        مسح رمز QR
                    </h2>
                    <button id="qr-close-btn" style="
                        background: #e74c3c;
                        color: white;
                        border: none;
                        border-radius: 50%;
                        width: 35px;
                        height: 35px;
                        cursor: pointer;
                        font-size: 16px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        transition: all 0.3s ease;
                    " onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
                        <i class="fas fa-times"></i>
                    </button>
                </div>

                <div id="qr-camera-selection" style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #2c3e50;">
                        اختيار الكاميرا:
                    </label>
                    <select id="camera-select" style="
                        width: 100%;
                        padding: 10px;
                        border: 2px solid #e3e6f0;
                        border-radius: 8px;
                        font-size: 14px;
                        background: white;
                    ">
                        <option value="">تحديد الكاميرا...</option>
                    </select>
                </div>

                <div id="qr-reader" style="
                    width: 100%;
                    max-width: 500px;
                    margin: 0 auto 15px;
                    border: 2px solid #3498db;
                    border-radius: 10px;
                    overflow: hidden;
                    background: #f8f9fa;
                "></div>

                <div id="qr-result" style="display: none; margin-top: 15px;">
                    <h3 style="color: #27ae60; margin-bottom: 10px;">
                        <i class="fas fa-check-circle"></i>
                        تم مسح الرمز بنجاح!
                    </h3>
                    <div id="qr-result-content" style="
                        background: #f8f9fa;
                        padding: 15px;
                        border-radius: 8px;
                        border-left: 4px solid #27ae60;
                        white-space: pre-wrap;
                        font-family: monospace;
                        font-size: 12px;
                        max-height: 200px;
                        overflow-y: auto;
                        direction: rtl;
                    "></div>
                    <div style="margin-top: 15px; text-align: center;">
                        <button id="qr-search-btn" style="
                            background: #3498db;
                            color: white;
                            border: none;
                            padding: 10px 20px;
                            border-radius: 8px;
                            cursor: pointer;
                            font-size: 14px;
                            margin-left: 10px;
                        ">
                            <i class="fas fa-search"></i>
                            البحث عن الحالة
                        </button>
                        <button id="qr-scan-again-btn" style="
                            background: #f39c12;
                            color: white;
                            border: none;
                            padding: 10px 20px;
                            border-radius: 8px;
                            cursor: pointer;
                            font-size: 14px;
                        ">
                            <i class="fas fa-camera"></i>
                            مسح مرة أخرى
                        </button>
                    </div>
                </div>

                <div id="qr-controls" style="text-align: center; margin-top: 15px;">
                    <button id="qr-start-btn" style="
                        background: #27ae60;
                        color: white;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 14px;
                        margin-left: 10px;
                    ">
                        <i class="fas fa-play"></i>
                        بدء المسح
                    </button>
                    <button id="qr-stop-btn" style="
                        background: #e74c3c;
                        color: white;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 14px;
                        display: none;
                    ">
                        <i class="fas fa-stop"></i>
                        إيقاف المسح
                    </button>
                </div>

                <div id="qr-status" style="
                    margin-top: 15px;
                    padding: 10px;
                    border-radius: 8px;
                    text-align: center;
                    font-size: 13px;
                    display: none;
                "></div>
            </div>
        `;

        document.body.appendChild(modal);
        
        // إعداد مستمعي الأحداث
        setupQRScannerEvents();
        
        return modal;
    }

    // ==============================
    // إعداد أحداث مسح QR Code
    // ==============================
    function setupQRScannerEvents() {
        const modal = document.getElementById('qr-scanner-modal');
        const closeBtn = document.getElementById('qr-close-btn');
        const startBtn = document.getElementById('qr-start-btn');
        const stopBtn = document.getElementById('qr-stop-btn');
        const cameraSelect = document.getElementById('camera-select');
        const searchBtn = document.getElementById('qr-search-btn');
        const scanAgainBtn = document.getElementById('qr-scan-again-btn');

        // إغلاق النافذة
        closeBtn.onclick = closeQRScanner;
        modal.onclick = (e) => {
            if (e.target === modal) closeQRScanner();
        };

        // بدء المسح
        startBtn.onclick = startQRScanning;
        
        // إيقاف المسح
        stopBtn.onclick = stopQRScanning;

        // تغيير الكاميرا
        cameraSelect.onchange = () => {
            if (isScanning) {
                stopQRScanning();
                setTimeout(startQRScanning, 500);
            }
        };

        // البحث عن الحالة
        searchBtn.onclick = searchCaseFromQR;

        // مسح مرة أخرى
        scanAgainBtn.onclick = () => {
            document.getElementById('qr-result').style.display = 'none';
            document.getElementById('qr-controls').style.display = 'block';
            startQRScanning();
        };

        // تحميل قائمة الكاميرات
        loadAvailableCameras();
    }

    // ==============================
    // تحميل الكاميرات المتاحة
    // ==============================
    async function loadAvailableCameras() {
        try {
            if (typeof Html5Qrcode === 'undefined') {
                showQRStatus('مكتبة المسح غير متاحة', 'error');
                return;
            }

            const devices = await Html5Qrcode.getCameras();
            const select = document.getElementById('camera-select');
            
            if (devices && devices.length > 0) {
                availableCameras = devices;
                select.innerHTML = '<option value="">اختر الكاميرا...</option>';
                
                devices.forEach((device, index) => {
                    const option = document.createElement('option');
                    option.value = device.id;
                    option.text = device.label || `كاميرا ${index + 1}`;
                    select.appendChild(option);
                });

                // اختيار الكاميرا الخلفية تلقائياً إن وجدت
                const backCamera = devices.find(device => 
                    device.label && device.label.toLowerCase().includes('back')
                );
                if (backCamera) {
                    select.value = backCamera.id;
                } else if (devices.length > 0) {
                    select.value = devices[0].id;
                }

                showQRStatus(`تم العثور على ${devices.length} كاميرا`, 'success');
            } else {
                showQRStatus('لم يتم العثور على كاميرات', 'warning');
            }
        } catch (error) {
            console.error('خطأ في تحميل الكاميرات:', error);
            showQRStatus('خطأ في الوصول للكاميرات', 'error');
        }
    }

    // ==============================
    // بدء مسح QR Code
    // ==============================
    async function startQRScanning() {
        try {
            const cameraSelect = document.getElementById('camera-select');
            const selectedCameraId = cameraSelect.value;

            if (!selectedCameraId) {
                showQRStatus('يرجى اختيار الكاميرا أولاً', 'warning');
                return;
            }

            if (typeof Html5Qrcode === 'undefined') {
                showQRStatus('مكتبة المسح غير متاحة', 'error');
                return;
            }

            // إنشاء ماسح جديد
            scanner = new Html5Qrcode("qr-reader");

            const config = {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0,
                disableFlip: false
            };

            await scanner.start(
                selectedCameraId,
                config,
                onQRCodeScanned,
                onQRScanError
            );

            isScanning = true;
            currentCameraId = selectedCameraId;

            // تحديث واجهة المستخدم
            document.getElementById('qr-start-btn').style.display = 'none';
            document.getElementById('qr-stop-btn').style.display = 'inline-block';
            document.getElementById('camera-select').disabled = true;

            showQRStatus('جاري المسح... وجه الكاميرا نحو رمز QR', 'info');

        } catch (error) {
            console.error('خطأ في بدء المسح:', error);
            showQRStatus('فشل في بدء المسح: ' + error.message, 'error');
        }
    }

    // ==============================
    // إيقاف مسح QR Code
    // ==============================
    async function stopQRScanning() {
        try {
            if (scanner && isScanning) {
                await scanner.stop();
                await scanner.clear();
                scanner = null;
            }

            isScanning = false;
            currentCameraId = null;

            // تحديث واجهة المستخدم
            document.getElementById('qr-start-btn').style.display = 'inline-block';
            document.getElementById('qr-stop-btn').style.display = 'none';
            document.getElementById('camera-select').disabled = false;

            showQRStatus('تم إيقاف المسح', 'info');

        } catch (error) {
            console.error('خطأ في إيقاف المسح:', error);
        }
    }

    // ==============================
    // معالج نجاح مسح QR Code
    // ==============================
    function onQRCodeScanned(decodedText, decodedResult) {
        console.log('✅ تم مسح QR Code بنجاح:', decodedText);

        // إيقاف المسح
        stopQRScanning();

        // عرض النتيجة
        document.getElementById('qr-result-content').textContent = decodedText;
        document.getElementById('qr-result').style.display = 'block';
        document.getElementById('qr-controls').style.display = 'none';

        // حفظ النتيجة للبحث
        window.lastScannedQRData = decodedText;

        showQRStatus('تم مسح الرمز بنجاح!', 'success');

        // تشغيل صوت نجاح
        playSuccessSound();
    }

    // ==============================
    // معالج خطأ مسح QR Code
    // ==============================
    function onQRScanError(errorMessage) {
        // لا نعرض أخطاء المسح المستمرة لتجنب الإزعاج
        // console.log('QR Scan Error:', errorMessage);
    }

    // ==============================
    // البحث عن الحالة من QR Code
    // ==============================
    function searchCaseFromQR() {
        const qrData = window.lastScannedQRData;
        if (!qrData) {
            showQRStatus('لا توجد بيانات مسح متاحة', 'warning');
            return;
        }

        try {
            // استخراج رقم الاستمارة من بيانات QR
            const formNumberMatch = qrData.match(/رقم الاستمارة:\s*([^\n]+)/);
            const nameMatch = qrData.match(/الاسم الكامل:\s*([^\n]+)/);

            let searchTerm = '';
            if (formNumberMatch) {
                searchTerm = formNumberMatch[1].trim();
            } else if (nameMatch) {
                searchTerm = nameMatch[1].trim();
            }

            if (searchTerm) {
                // إغلاق نافذة QR
                closeQRScanner();

                // الانتقال للوحة التحكم
                if (typeof showSection === 'function') {
                    showSection('dashboard');
                }

                // تطبيق البحث
                setTimeout(() => {
                    const searchInput = document.getElementById('globalSearch');
                    if (searchInput) {
                        searchInput.value = searchTerm;
                        if (typeof performSearch === 'function') {
                            performSearch();
                        }
                    }

                    if (typeof showToast === 'function') {
                        showToast(`تم البحث عن: ${searchTerm}`, 'success', 'QR Code');
                    }
                }, 500);

            } else {
                showQRStatus('لم يتم العثور على معلومات الحالة في الرمز', 'warning');
            }

        } catch (error) {
            console.error('خطأ في البحث من QR:', error);
            showQRStatus('خطأ في معالجة بيانات QR', 'error');
        }
    }

    // ==============================
    // إظهار حالة QR Code
    // ==============================
    function showQRStatus(message, type = 'info') {
        const statusDiv = document.getElementById('qr-status');
        if (!statusDiv) return;

        const colors = {
            success: '#d4edda',
            error: '#f8d7da',
            warning: '#fff3cd',
            info: '#d1ecf1'
        };

        const textColors = {
            success: '#155724',
            error: '#721c24',
            warning: '#856404',
            info: '#0c5460'
        };

        statusDiv.style.backgroundColor = colors[type] || colors.info;
        statusDiv.style.color = textColors[type] || textColors.info;
        statusDiv.style.display = 'block';
        statusDiv.textContent = message;

        // إخفاء الرسالة بعد 5 ثوان
        setTimeout(() => {
            statusDiv.style.display = 'none';
        }, 5000);
    }

    // ==============================
    // تشغيل صوت النجاح
    // ==============================
    function playSuccessSound() {
        try {
            // إنشاء صوت نجاح بسيط
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1);

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch (error) {
            // تجاهل أخطاء الصوت
        }
    }

    // ==============================
    // فتح نافذة QR Scanner
    // ==============================
    function openQRScanner() {
        let modal = document.getElementById('qr-scanner-modal');
        if (!modal) {
            modal = createQRScannerInterface();
        }

        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';

        // إعادة تعيين الواجهة
        document.getElementById('qr-result').style.display = 'none';
        document.getElementById('qr-controls').style.display = 'block';
        document.getElementById('qr-start-btn').style.display = 'inline-block';
        document.getElementById('qr-stop-btn').style.display = 'none';

        showQRStatus('جاهز للمسح - اختر الكاميرا وابدأ', 'info');
    }

    // ==============================
    // إغلاق نافذة QR Scanner
    // ==============================
    function closeQRScanner() {
        if (isScanning) {
            stopQRScanning();
        }

        const modal = document.getElementById('qr-scanner-modal');
        if (modal) {
            modal.style.display = 'none';
        }

        document.body.style.overflow = 'auto';
    }

    // ==============================
    // إنشاء لوحة تحكم QR Code متقدمة
    // ==============================
    function createQRControlPanel() {
        const panel = document.createElement('div');
        panel.id = 'qr-control-panel';
        panel.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.95);
            z-index: 10001;
            display: none;
            justify-content: center;
            align-items: center;
            backdrop-filter: blur(15px);
        `;

        panel.innerHTML = `
            <div style="
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 20px;
                padding: 30px;
                max-width: 600px;
                width: 90vw;
                max-height: 90vh;
                overflow: auto;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                color: white;
                position: relative;
            ">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
                    <h1 style="margin: 0; font-size: 24px; font-weight: 700;">
                        <i class="fas fa-qrcode" style="margin-left: 15px; color: #f1c40f;"></i>
                        مركز تحكم QR Code
                    </h1>
                    <button onclick="window.qrCodeSystem.hide()" style="
                        background: rgba(255, 255, 255, 0.2);
                        color: white;
                        border: none;
                        border-radius: 50%;
                        width: 40px;
                        height: 40px;
                        cursor: pointer;
                        font-size: 18px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        transition: all 0.3s ease;
                    " onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'">
                        <i class="fas fa-times"></i>
                    </button>
                </div>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px;">
                    <!-- بطاقة المسح -->
                    <div style="
                        background: rgba(255, 255, 255, 0.1);
                        border-radius: 15px;
                        padding: 20px;
                        backdrop-filter: blur(10px);
                        border: 1px solid rgba(255, 255, 255, 0.2);
                    ">
                        <h3 style="margin: 0 0 15px 0; color: #f1c40f;">
                            <i class="fas fa-camera"></i>
                            مسح رمز QR
                        </h3>
                        <p style="margin-bottom: 15px; opacity: 0.9; font-size: 14px;">
                            امسح رمز QR للبحث السريع عن الحالات
                        </p>
                        <button onclick="window.qrCodeSystem.openScanner()" style="
                            background: #27ae60;
                            color: white;
                            border: none;
                            padding: 12px 20px;
                            border-radius: 10px;
                            cursor: pointer;
                            font-size: 14px;
                            width: 100%;
                            transition: all 0.3s ease;
                        " onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                            <i class="fas fa-camera"></i>
                            فتح الماسح
                        </button>
                    </div>

                    <!-- بطاقة الإنشاء -->
                    <div style="
                        background: rgba(255, 255, 255, 0.1);
                        border-radius: 15px;
                        padding: 20px;
                        backdrop-filter: blur(10px);
                        border: 1px solid rgba(255, 255, 255, 0.2);
                    ">
                        <h3 style="margin: 0 0 15px 0; color: #3498db;">
                            <i class="fas fa-plus-circle"></i>
                            إنشاء رمز QR
                        </h3>
                        <p style="margin-bottom: 15px; opacity: 0.9; font-size: 14px;">
                            أنشئ رمز QR لحالة معينة
                        </p>
                        <button onclick="window.qrCodeSystem.createQR()" style="
                            background: #3498db;
                            color: white;
                            border: none;
                            padding: 12px 20px;
                            border-radius: 10px;
                            cursor: pointer;
                            font-size: 14px;
                            width: 100%;
                            transition: all 0.3s ease;
                        " onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                            <i class="fas fa-plus-circle"></i>
                            إنشاء رمز
                        </button>
                    </div>
                </div>

                <div style="margin-top: 25px; text-align: center;">
                    <div style="
                        background: rgba(255, 255, 255, 0.1);
                        border-radius: 10px;
                        padding: 15px;
                        font-size: 13px;
                        opacity: 0.8;
                    ">
                        <i class="fas fa-info-circle" style="margin-left: 8px;"></i>
                        يمكنك استخدام الاختصار <kbd style="background: rgba(0,0,0,0.3); padding: 2px 6px; border-radius: 4px;">Ctrl+Shift+Q</kbd> لفتح هذه اللوحة
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(panel);
        return panel;
    }

    // ==============================
    // وظائف مساعدة
    // ==============================
    function formatNumber(value) {
        if (value === undefined || value === null || value === '') {
            return '0';
        }
        if (parseInt(value) === 0) {
            return '0';
        }
        if (!isNaN(value)) {
            return parseInt(value).toLocaleString('en-US');
        }
        return value;
    }

    function clearCache() {
        qrCodeCache.clear();
        console.log('🧹 تم مسح كاش QR Code');
    }

    // ==============================
    // واجهة النظام العامة
    // ==============================
    window.qrCodeSystem = {
        // التحقق من جاهزية النظام
        isReady: () => isSystemReady,

        // إنشاء QR Code
        generate: generateQRCode,

        // فتح ماسح QR Code
        openScanner: openQRScanner,

        // إغلاق ماسح QR Code
        closeScanner: closeQRScanner,

        // فتح لوحة التحكم
        show: function() {
            let panel = document.getElementById('qr-control-panel');
            if (!panel) {
                panel = createQRControlPanel();
            }
            panel.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        },

        // إخفاء لوحة التحكم
        hide: function() {
            const panel = document.getElementById('qr-control-panel');
            if (panel) {
                panel.style.display = 'none';
            }
            document.body.style.overflow = 'auto';
        },

        // إنشاء QR Code مخصص
        createQR: function() {
            const text = prompt('أدخل النص لإنشاء رمز QR:');
            if (text) {
                generateQRCode({ caseDescription: text }).then(canvas => {
                    const newWindow = window.open('', '_blank');
                    newWindow.document.write(`
                        <html>
                            <head><title>QR Code مخصص</title></head>
                            <body style="text-align: center; padding: 20px;">
                                <h2>رمز QR مخصص</h2>
                                <div id="qr-container"></div>
                                <p style="margin-top: 20px;">${text}</p>
                            </body>
                        </html>
                    `);
                    newWindow.document.getElementById('qr-container').appendChild(canvas);
                });
            }
        },

        // تنظيف الكاش
        clearCache: clearCache,

        // معلومات النظام
        getInfo: () => ({
            ready: isSystemReady,
            scanning: isScanning,
            cacheSize: qrCodeCache.size,
            cameras: availableCameras.length
        })
    };

    // ==============================
    // اختصارات لوحة المفاتيح
    // ==============================
    document.addEventListener('keydown', function(e) {
        // Ctrl+Shift+Q لفتح لوحة التحكم
        if (e.ctrlKey && e.shiftKey && e.key === 'Q') {
            e.preventDefault();
            window.qrCodeSystem.show();
        }

        // Escape لإغلاق النوافذ
        if (e.key === 'Escape') {
            closeQRScanner();
            window.qrCodeSystem.hide();
        }
    });

    // ==============================
    // تهيئة النظام
    // ==============================
    function initializeQRSystem() {
        console.log('🔄 جاري تهيئة نظام QR Code...');
        
        loadQRLibraries().then(() => {
            console.log('✅ تم تهيئة نظام QR Code بنجاح');
            
            // إضافة رسالة ترحيب
            if (typeof showToast === 'function') {
                setTimeout(() => {
                    showToast('نظام QR Code جاهز للاستخدام!', 'success', 'QR System');
                }, 2000);
            }
            
        }).catch(error => {
            console.error('❌ خطأ في تهيئة نظام QR Code:', error);
        });
    }

    // بدء التهيئة عند تحميل الصفحة
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeQRSystem);
    } else {
        initializeQRSystem();
    }

    // إضافة معلومات للكونسول
    console.log(`
🔳 نظام QR Code المتكامل v2.0.0
===============================
📱 الميزات:
• إنشاء QR Code تلقائياً مع البيانات العربية
• مسح QR Code بالكاميرا مع دعم متعدد الكاميرات
• لوحة تحكم متقدمة (Ctrl+Shift+Q)
• كاش ذكي لتحسين الأداء
• دعم كامل للنصوص العربية
• تكامل شامل مع نظام الطباعة

🔧 الواجهة:
• qrCodeSystem.generate(data) - إنشاء QR Code
• qrCodeSystem.openScanner() - فتح الماسح
• qrCodeSystem.show() - لوحة التحكم
• qrCodeSystem.getInfo() - معلومات النظام

⚡ جاهز للاستخدام!
    `);

})();
