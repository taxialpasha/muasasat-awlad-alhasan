/**
 * نظام إدارة المرفقات والوثائق المحسن - إصدار مُصحح
 * حل مشاكل التخزين المحلي وتحسين إدارة الذاكرة
 * 
 * الاستخدام: استبدل الملف السابق بهذا الملف المحسن
 * <script src="attachments-manager-fixed.js"></script>
 */

// ==============================
// إعدادات النظام المحسنة
// ==============================
const DEFAULT_ATTACHMENT_SETTINGS = {
    // إعدادات الرفع
    maxFileSize: 5 * 1024 * 1024, // تقليل إلى 5 MB لتجنب مشاكل التخزين
    maxFilesPerCase: 15, // تقليل عدد الملفات
    allowedFileTypes: [
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf',
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
    ],
    
    // إعدادات الضغط المحسنة
    compressImages: true,
    imageQuality: 0.6, // جودة أقل لتوفير مساحة أكبر
    maxImageWidth: 1280, // تقليل الأبعاد
    maxImageHeight: 720,
    
    // إعدادات التخزين المحسنة
    useChunkedStorage: true, // تقسيم البيانات الكبيرة
    chunkSize: 500 * 1024, // 500 KB لكل جزء
    compressionLevel: 'high', // ضغط عالي
    autoCleanup: true, // تنظيف تلقائي
    maxStorageSize: 50 * 1024 * 1024, // 50 MB حد أقصى للتخزين
    
    // إعدادات الأداء
    enableBatchProcessing: true,
    enableLazyLoading: true,
    enableMemoryOptimization: true,
    
    // إعدادات الواجهة
    showAttachmentButton: true,
    buttonPosition: 'top',
    compactMode: false,
    darkMode: false
};

// ==============================
// متغيرات النظام المحسنة
// ==============================
let currentAttachmentSettings = { ...DEFAULT_ATTACHMENT_SETTINGS };
let attachmentsData = new Map();
let lightweightDatabase = new Map(); // قاعدة بيانات خفيفة للفهرسة
let attachmentManager = null;
let currentCaseId = null;

// إحصائيات التخزين
let storageStats = {
    totalSize: 0,
    fileCount: 0,
    lastCleanup: Date.now(),
    compressionRatio: 0
};

// معرفات الملفات المُحملة حالياً في الذاكرة
let loadedFiles = new Set();

// ==============================
// مكتبة الضغط والتحسين
// ==============================
class CompressionUtility {
    // ضغط النصوص باستخدام خوارزمية بسيطة
    static compressString(str) {
        try {
            return btoa(unescape(encodeURIComponent(str)));
        } catch (error) {
            console.warn('فشل في ضغط النص:', error);
            return str;
        }
    }
    
    static decompressString(compressed) {
        try {
            return decodeURIComponent(escape(atob(compressed)));
        } catch (error) {
            console.warn('فشل في إلغاء ضغط النص:', error);
            return compressed;
        }
    }
    
    // تقسيم البيانات الكبيرة
    static chunkData(data, chunkSize = 500 * 1024) {
        const chunks = [];
        const dataString = typeof data === 'string' ? data : JSON.stringify(data);
        
        for (let i = 0; i < dataString.length; i += chunkSize) {
            chunks.push(dataString.slice(i, i + chunkSize));
        }
        
        return {
            chunks: chunks,
            totalChunks: chunks.length,
            originalSize: dataString.length
        };
    }
    
    static reconstructData(chunkedData) {
        return chunkedData.chunks.join('');
    }
}

// ==============================
// مدير التخزين المحسن
// ==============================
class StorageManager {
    static async checkStorageQuota() {
        try {
            if ('storage' in navigator && 'estimate' in navigator.storage) {
                const estimate = await navigator.storage.estimate();
                const usage = estimate.usage || 0;
                const quota = estimate.quota || 0;
                const percentUsed = quota > 0 ? (usage / quota) * 100 : 0;
                
                console.log(`💾 التخزين: ${this.formatBytes(usage)} / ${this.formatBytes(quota)} (${percentUsed.toFixed(1)}%)`);
                
                return {
                    usage,
                    quota,
                    percentUsed,
                    available: quota - usage,
                    canStore: percentUsed < 90
                };
            }
        } catch (error) {
            console.warn('لا يمكن فحص مساحة التخزين:', error);
        }
        
        return {
            usage: 0,
            quota: 0,
            percentUsed: 0,
            available: 0,
            canStore: true
        };
    }
    
    static formatBytes(bytes) {
        if (bytes === 0) return '0 بايت';
        const k = 1024;
        const sizes = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    static async saveWithRetry(key, data, maxRetries = 3) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const processedData = await this.preprocessData(data);
                
                if (currentAttachmentSettings.useChunkedStorage && processedData.length > currentAttachmentSettings.chunkSize) {
                    return await this.saveChunked(key, processedData);
                } else {
                    localStorage.setItem(key, processedData);
                    return true;
                }
                
            } catch (error) {
                console.warn(`محاولة ${attempt} فشلت:`, error.message);
                
                if (error.name === 'QuotaExceededError') {
                    if (attempt < maxRetries) {
                        await this.freeUpSpace();
                        continue;
                    } else {
                        throw new Error('مساحة التخزين ممتلئة - يرجى حذف بعض الملفات');
                    }
                } else {
                    throw error;
                }
            }
        }
        return false;
    }
    
    static async preprocessData(data) {
        try {
            let jsonString = JSON.stringify(data);
            
            // ضغط البيانات
            if (currentAttachmentSettings.compressionLevel === 'high') {
                jsonString = CompressionUtility.compressString(jsonString);
            }
            
            return jsonString;
        } catch (error) {
            console.error('خطأ في معالجة البيانات:', error);
            throw new Error('فشل في معالجة البيانات للحفظ');
        }
    }
    
    static async saveChunked(key, data) {
        try {
            const chunkedData = CompressionUtility.chunkData(data, currentAttachmentSettings.chunkSize);
            
            // حفظ معلومات التقسيم
            const chunkInfo = {
                totalChunks: chunkedData.totalChunks,
                originalSize: chunkedData.originalSize,
                timestamp: Date.now()
            };
            
            localStorage.setItem(`${key}_info`, JSON.stringify(chunkInfo));
            
            // حفظ كل جزء
            for (let i = 0; i < chunkedData.chunks.length; i++) {
                localStorage.setItem(`${key}_chunk_${i}`, chunkedData.chunks[i]);
            }
            
            console.log(`✅ تم حفظ البيانات في ${chunkedData.totalChunks} أجزاء`);
            return true;
            
        } catch (error) {
            console.error('فشل في الحفظ المقسم:', error);
            throw error;
        }
    }
    
    static async loadChunked(key) {
        try {
            const chunkInfoStr = localStorage.getItem(`${key}_info`);
            if (!chunkInfoStr) return null;
            
            const chunkInfo = JSON.parse(chunkInfoStr);
            const chunks = [];
            
            // تحميل جميع الأجزاء
            for (let i = 0; i < chunkInfo.totalChunks; i++) {
                const chunk = localStorage.getItem(`${key}_chunk_${i}`);
                if (!chunk) {
                    console.error(`الجزء ${i} مفقود`);
                    return null;
                }
                chunks.push(chunk);
            }
            
            // إعادة تجميع البيانات
            const reconstructedData = CompressionUtility.reconstructData({ chunks });
            
            // إلغاء الضغط إذا لزم الأمر
            let finalData = reconstructedData;
            if (currentAttachmentSettings.compressionLevel === 'high') {
                finalData = CompressionUtility.decompressString(reconstructedData);
            }
            
            return JSON.parse(finalData);
            
        } catch (error) {
            console.error('فشل في تحميل البيانات المقسمة:', error);
            return null;
        }
    }
    
    static async freeUpSpace(targetSize = 10 * 1024 * 1024) { // 10 MB
        console.log('🧹 بدء تنظيف مساحة التخزين...');
        
        let freedSpace = 0;
        const keysToRemove = [];
        
        // العثور على الملفات القديمة للحذف
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            
            if (key && key.startsWith('temp_') || key.startsWith('cache_')) {
                keysToRemove.push(key);
            }
        }
        
        // حذف الملفات المؤقتة
        for (const key of keysToRemove) {
            const item = localStorage.getItem(key);
            if (item) {
                freedSpace += item.length * 2; // تقدير تقريبي
                localStorage.removeItem(key);
            }
        }
        
        // تنظيف الملفات القديمة من المرفقات
        if (freedSpace < targetSize) {
            await this.cleanupOldAttachments();
        }
        
        console.log(`✅ تم تحرير ${this.formatBytes(freedSpace)} تقريباً`);
        return freedSpace;
    }
    
    static async cleanupOldAttachments() {
        try {
            const attachmentData = await this.loadChunked('charity_attachments_v2');
            if (!attachmentData || !attachmentData.metadata) return;
            
            const now = Date.now();
            const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
            
            let cleanedCount = 0;
            const metadataMap = new Map(Object.entries(attachmentData.metadata));
            
            for (const [fileId, metadata] of metadataMap) {
                const fileDate = new Date(metadata.uploadDate).getTime();
                
                if (fileDate < thirtyDaysAgo && metadata.size > 1024 * 1024) { // ملفات أكبر من 1 MB وأقدم من 30 يوم
                    delete attachmentData.files[fileId];
                    delete attachmentData.metadata[fileId];
                    delete attachmentData.thumbnails[fileId];
                    cleanedCount++;
                    
                    if (cleanedCount >= 5) break; // حذف 5 ملفات كحد أقصى
                }
            }
            
            if (cleanedCount > 0) {
                await this.saveWithRetry('charity_attachments_v2', attachmentData);
                console.log(`🗑️ تم حذف ${cleanedCount} ملف قديم`);
            }
            
        } catch (error) {
            console.warn('تعذر تنظيف الملفات القديمة:', error);
        }
    }
}

// ==============================
// معالج الملفات المحسن
// ==============================
class FileProcessor {
    static async processFileOptimized(file) {
        try {
            let processedFile = {
                id: this.generateFileId(),
                name: file.name,
                size: file.size,
                type: file.type,
                lastModified: file.lastModified,
                uploadDate: new Date().toISOString(),
                category: this.getFileCategory(file.type),
                compressed: false
            };
            
            // معالجة خاصة للصور
            if (processedFile.category === 'images') {
                const compressedResult = await this.compressImageOptimized(file);
                if (compressedResult.success) {
                    processedFile.data = compressedResult.data;
                    processedFile.size = compressedResult.size;
                    processedFile.compressed = true;
                    processedFile.originalSize = file.size;
                    processedFile.compressionRatio = (file.size - compressedResult.size) / file.size;
                } else {
                    processedFile.data = await this.fileToBase64(file);
                }
            } else {
                // للملفات الأخرى، تحقق من الحجم
                if (file.size > 1024 * 1024) { // أكبر من 1 MB
                    throw new Error(`الملف كبير جداً (${StorageManager.formatBytes(file.size)}). الحد الأقصى ${StorageManager.formatBytes(currentAttachmentSettings.maxFileSize)}`);
                }
                processedFile.data = await this.fileToBase64(file);
            }
            
            // إنشاء معاينة خفيفة
            if (currentAttachmentSettings.enableLazyLoading) {
                processedFile.thumbnail = await this.generateLightweightThumbnail(processedFile);
            }
            
            return processedFile;
            
        } catch (error) {
            console.error('خطأ في معالجة الملف:', error);
            throw error;
        }
    }
    
    static async compressImageOptimized(file) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = function() {
                try {
                    // حساب الأبعاد الجديدة
                    const maxWidth = currentAttachmentSettings.maxImageWidth;
                    const maxHeight = currentAttachmentSettings.maxImageHeight;
                    
                    let { width, height } = FileProcessor.calculateOptimalDimensions(
                        img.width, img.height, maxWidth, maxHeight
                    );
                    
                    canvas.width = width;
                    canvas.height = height;
                    
                    // تحسين جودة الرسم
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    
                    // رسم الصورة
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    // تحويل إلى Base64 مع ضغط
                    const compressedDataUrl = canvas.toDataURL('image/jpeg', currentAttachmentSettings.imageQuality);
                    
                    // حساب حجم البيانات المضغوطة
                    const compressedSize = Math.round((compressedDataUrl.length * 3) / 4);
                    
                    resolve({
                        success: true,
                        data: compressedDataUrl,
                        size: compressedSize,
                        dimensions: { width, height }
                    });
                    
                } catch (error) {
                    console.error('فشل في ضغط الصورة:', error);
                    resolve({ success: false, error: error.message });
                }
            };
            
            img.onerror = function() {
                resolve({ success: false, error: 'فشل في تحميل الصورة' });
            };
            
            img.src = URL.createObjectURL(file);
        });
    }
    
    static calculateOptimalDimensions(originalWidth, originalHeight, maxWidth, maxHeight) {
        let width = originalWidth;
        let height = originalHeight;
        
        // تقليل إضافي إذا كانت الصورة كبيرة جداً
        if (width > 2000 || height > 2000) {
            const scale = Math.min(1000 / width, 1000 / height);
            width *= scale;
            height *= scale;
        }
        
        // تطبيق الحد الأقصى
        if (width > maxWidth || height > maxHeight) {
            const aspectRatio = width / height;
            
            if (width > height) {
                width = Math.min(width, maxWidth);
                height = width / aspectRatio;
            } else {
                height = Math.min(height, maxHeight);
                width = height * aspectRatio;
            }
        }
        
        return { 
            width: Math.round(width), 
            height: Math.round(height) 
        };
    }
    
    static async generateLightweightThumbnail(fileObj) {
        if (fileObj.category !== 'images') {
            return this.generateIconThumbnail(fileObj);
        }
        
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            return new Promise((resolve) => {
                img.onload = function() {
                    const size = 64; // معاينة صغيرة جداً
                    canvas.width = size;
                    canvas.height = size;
                    
                    const aspectRatio = img.width / img.height;
                    let drawWidth = size;
                    let drawHeight = size;
                    let drawX = 0;
                    let drawY = 0;
                    
                    if (aspectRatio > 1) {
                        drawHeight = size / aspectRatio;
                        drawY = (size - drawHeight) / 2;
                    } else {
                        drawWidth = size * aspectRatio;
                        drawX = (size - drawWidth) / 2;
                    }
                    
                    ctx.fillStyle = '#f8f9fa';
                    ctx.fillRect(0, 0, size, size);
                    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
                    
                    resolve(canvas.toDataURL('image/jpeg', 0.4));
                };
                
                img.onerror = function() {
                    resolve(FileProcessor.generateIconThumbnail(fileObj));
                };
                
                if (fileObj.data) {
                    img.src = fileObj.data;
                } else {
                    resolve(FileProcessor.generateIconThumbnail(fileObj));
                }
            });
            
        } catch (error) {
            return this.generateIconThumbnail(fileObj);
        }
    }
    
    static generateIconThumbnail(fileObj) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const size = 64;
        
        canvas.width = size;
        canvas.height = size;
        
        const colors = {
            'images': '#e74c3c',
            'documents': '#3498db',
            'word': '#2980b9',
            'excel': '#27ae60',
            'text': '#95a5a6',
            'other': '#95a5a6'
        };
        
        const icons = {
            'images': '🖼️',
            'documents': '📄',
            'word': '📝',
            'excel': '📊',
            'text': '📃',
            'other': '📁'
        };
        
        ctx.fillStyle = colors[fileObj.category] || colors.other;
        ctx.fillRect(0, 0, size, size);
        
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'white';
        ctx.fillText(icons[fileObj.category] || icons.other, size/2, size/2);
        
        return canvas.toDataURL('image/jpeg', 0.8);
    }
    
    static generateFileId() {
        return 'file_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    }
    
    static getFileCategory(mimeType) {
        if (mimeType.startsWith('image/')) return 'images';
        if (mimeType === 'application/pdf') return 'documents';
        if (mimeType.includes('word')) return 'word';
        if (mimeType.includes('excel') || mimeType.includes('sheet')) return 'excel';
        if (mimeType.startsWith('text/')) return 'text';
        return 'other';
    }
    
    static async fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }
}

// ==============================
// تهيئة النظام المحسن
// ==============================
async function initializeAttachmentSystemFixed() {
    try {
        console.log('🔄 بدء تهيئة نظام المرفقات المحسن...');
        
        // فحص مساحة التخزين
        const storageInfo = await StorageManager.checkStorageQuota();
        if (!storageInfo.canStore) {
            showAttachmentToast('⚠️ مساحة التخزين تقترب من الامتلاء. قد تحتاج لحذف بعض الملفات.', 'warning');
        }
        
        // تحميل الإعدادات
        loadAttachmentSettingsFixed();
        
        // تحميل قاعدة البيانات
        await loadAttachmentDatabaseFixed();
        
        // إنشاء مدير المرفقات
        createAttachmentManagerFixed();
        
        // إضافة أزرار المرفقات
        addAttachmentButtonsFixed();
        
        // إعداد معالجات الأحداث
        setupAttachmentEventListenersFixed();
        
        // بدء التنظيف التلقائي
        startAutoCleanup();
        
        console.log('✅ تم تهيئة نظام المرفقات المحسن بنجاح');
        showAttachmentToast('📎 نظام المرفقات المحسن جاهز للاستخدام', 'success');
        
    } catch (error) {
        console.error('❌ خطأ في تهيئة نظام المرفقات:', error);
        showAttachmentToast('فشل في تهيئة نظام المرفقات: ' + error.message, 'error');
    }
}

// ==============================
// تحميل وحفظ البيانات المحسن
// ==============================
async function loadAttachmentDatabaseFixed() {
    try {
        // محاولة تحميل الإصدار الجديد أولاً
        let data = await StorageManager.loadChunked('charity_attachments_v2');
        
        // إذا لم يوجد، جرب الإصدار القديم
        if (!data) {
            const oldData = localStorage.getItem('charity_attachments');
            if (oldData) {
                console.log('📦 تحويل البيانات من الإصدار القديم...');
                data = JSON.parse(oldData);
                
                // حفظ بالتنسيق الجديد
                await saveAttachmentDatabaseFixed();
                
                // حذف البيانات القديمة
                localStorage.removeItem('charity_attachments');
            }
        }
        
        if (data) {
            // تحويل البيانات إلى الشكل المطلوب
            if (data.attachments) {
                attachmentsData = new Map(Object.entries(data.attachments));
            }
            
            // بناء قاعدة البيانات الخفيفة للفهرسة
            if (data.metadata) {
                lightweightDatabase.clear();
                for (const [fileId, metadata] of Object.entries(data.metadata)) {
                    lightweightDatabase.set(fileId, {
                        id: fileId,
                        name: metadata.name,
                        size: metadata.size,
                        type: metadata.type,
                        category: metadata.category,
                        uploadDate: metadata.uploadDate,
                        caseId: metadata.caseId
                    });
                }
                
                storageStats.fileCount = lightweightDatabase.size;
                console.log(`📁 تم تحميل ${storageStats.fileCount} ملف`);
            }
        }
        
    } catch (error) {
        console.error('❌ خطأ في تحميل قاعدة بيانات المرفقات:', error);
        showAttachmentToast('تعذر تحميل المرفقات المحفوظة', 'warning');
    }
}

async function saveAttachmentDatabaseFixed() {
    try {
        const data = {
            version: '2.0',
            timestamp: new Date().toISOString(),
            attachments: Object.fromEntries(attachmentsData),
            metadata: Object.fromEntries(lightweightDatabase),
            stats: storageStats
        };
        
        await StorageManager.saveWithRetry('charity_attachments_v2', data);
        console.log('💾 تم حفظ قاعدة بيانات المرفقات بنجاح');
        
        return true;
        
    } catch (error) {
        console.error('❌ خطأ في حفظ المرفقات:', error);
        
        if (error.message.includes('مساحة التخزين ممتلئة')) {
            showAttachmentToast('مساحة التخزين ممتلئة. يرجى حذف بعض الملفات القديمة.', 'error');
        } else {
            showAttachmentToast('فشل في حفظ البيانات: ' + error.message, 'error');
        }
        
        return false;
    }
}

// ==============================
// معالجة رفع الملفات المحسنة
// ==============================
async function handleFileUploadFixed(files) {
    if (!files || files.length === 0) return;
    
    if (!currentCaseId) {
        showAttachmentToast('يرجى تحديد حالة أولاً', 'warning');
        return;
    }
    
    // فحص مساحة التخزين قبل البدء
    const storageInfo = await StorageManager.checkStorageQuota();
    if (!storageInfo.canStore) {
        showAttachmentToast('مساحة التخزين ممتلئة. يرجى حذف بعض الملفات أولاً.', 'error');
        return;
    }
    
    showUploadProgressFixed();
    
    let uploadedCount = 0;
    let failedCount = 0;
    let totalFiles = files.length;
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        try {
            updateUploadProgressFixed(((i) / totalFiles) * 50, `جاري معالجة ${file.name}...`);
            
            // التحقق من صحة الملف
            if (!validateFileFixed(file)) {
                failedCount++;
                continue;
            }
            
            // معالجة الملف
            const processedFile = await FileProcessor.processFileOptimized(file);
            
            updateUploadProgressFixed(((i) / totalFiles) * 80, `جاري حفظ ${file.name}...`);
            
            // حفظ الملف
            const saved = await saveFileFixed(processedFile, currentCaseId);
            
            if (saved) {
                uploadedCount++;
                updateUploadProgressFixed(((i + 1) / totalFiles) * 100, `تم رفع ${uploadedCount} من ${totalFiles} ملف`);
            } else {
                failedCount++;
            }
            
        } catch (error) {
            console.error('خطأ في رفع الملف:', file.name, error);
            failedCount++;
            showAttachmentToast(`فشل في رفع ${file.name}: ${error.message}`, 'error');
        }
    }
    
    hideUploadProgressFixed();
    
    // إظهار النتائج
    if (uploadedCount > 0) {
        showAttachmentToast(`✅ تم رفع ${uploadedCount} ملف بنجاح`, 'success');
        refreshAttachmentListFixed();
        updateAttachmentStatsFixed();
    }
    
    if (failedCount > 0) {
        showAttachmentToast(`⚠️ فشل في رفع ${failedCount} ملف`, 'warning');
    }
}

function validateFileFixed(file) {
    // التحقق من الحجم
    if (file.size > currentAttachmentSettings.maxFileSize) {
        showAttachmentToast(`❌ الملف "${file.name}" كبير جداً (${StorageManager.formatBytes(file.size)}). الحد الأقصى ${StorageManager.formatBytes(currentAttachmentSettings.maxFileSize)}`, 'error');
        return false;
    }
    
    // التحقق من النوع
    if (!currentAttachmentSettings.allowedFileTypes.includes(file.type)) {
        showAttachmentToast(`❌ نوع الملف "${file.name}" غير مدعوم`, 'error');
        return false;
    }
    
    // التحقق من عدد الملفات
    const currentFiles = attachmentsData.get(currentCaseId) || [];
    if (currentFiles.length >= currentAttachmentSettings.maxFilesPerCase) {
        showAttachmentToast(`❌ تم الوصول للحد الأقصى من الملفات (${currentAttachmentSettings.maxFilesPerCase})`, 'error');
        return false;
    }
    
    return true;
}

async function saveFileFixed(fileObj, caseId) {
    try {
        // حفظ في قاعدة البيانات الخفيفة
        lightweightDatabase.set(fileObj.id, {
            id: fileObj.id,
            name: fileObj.name,
            size: fileObj.size,
            type: fileObj.type,
            category: fileObj.category,
            uploadDate: fileObj.uploadDate,
            caseId: caseId,
            compressed: fileObj.compressed || false,
            thumbnail: fileObj.thumbnail
        });
        
        // إضافة إلى قائمة مرفقات الحالة
        if (!attachmentsData.has(caseId)) {
            attachmentsData.set(caseId, []);
        }
        attachmentsData.get(caseId).push(fileObj.id);
        
        // حفظ البيانات الكاملة للملف بشكل منفصل
        const fileKey = `file_data_${fileObj.id}`;
        await StorageManager.saveWithRetry(fileKey, {
            id: fileObj.id,
            data: fileObj.data,
            thumbnail: fileObj.thumbnail
        });
        
        // حفظ قاعدة البيانات المحدثة
        const success = await saveAttachmentDatabaseFixed();
        
        if (success) {
            // تحديث الإحصائيات
            storageStats.fileCount++;
            storageStats.totalSize += fileObj.size;
            
            if (fileObj.compressed) {
                storageStats.compressionRatio = ((fileObj.originalSize - fileObj.size) / fileObj.originalSize);
            }
            
            console.log('✅ تم حفظ الملف:', fileObj.name);
            return true;
        } else {
            // حذف البيانات المؤقتة في حالة فشل الحفظ
            lightweightDatabase.delete(fileObj.id);
            const caseFiles = attachmentsData.get(caseId);
            if (caseFiles) {
                const index = caseFiles.indexOf(fileObj.id);
                if (index > -1) caseFiles.splice(index, 1);
            }
            localStorage.removeItem(fileKey);
            
            return false;
        }
        
    } catch (error) {
        console.error('❌ خطأ في حفظ الملف:', error);
        throw error;
    }
}

// ==============================
// واجهة المستخدم المحسنة
// ==============================
function createAttachmentManagerFixed() {
    // إزالة المدير القديم إن وجد
    if (attachmentManager) {
        attachmentManager.remove();
    }
    
    const manager = document.createElement('div');
    manager.id = 'attachment-manager-fixed';
    manager.innerHTML = `
        <div class="attachment-overlay">
            <div class="attachment-container">
                <div class="attachment-header">
                    <div class="attachment-title">
                        <h3>📎 إدارة المرفقات المحسنة</h3>
                        <span class="case-info" id="current-case-info">لم يتم تحديد حالة</span>
                        <div class="storage-info" id="storage-info">جاري تحميل معلومات التخزين...</div>
                    </div>
                    <div class="attachment-actions">
                        <button class="attachment-btn upload-btn" onclick="triggerFileUploadFixed()">
                            <i class="fas fa-upload"></i> رفع ملفات
                        </button>
                        <button class="attachment-btn cleanup-btn" onclick="cleanupStorageFixed()">
                            <i class="fas fa-broom"></i> تنظيف
                        </button>
                        <button class="attachment-btn close-btn" onclick="closeAttachmentManagerFixed()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
                
                <div class="attachment-toolbar">
                    <div class="attachment-search">
                        <input type="text" id="attachment-search-fixed" placeholder="البحث في المرفقات..." onkeyup="searchAttachmentsFixed()">
                        <i class="fas fa-search"></i>
                    </div>
                    <div class="attachment-filters">
                        <select id="attachment-filter-type-fixed" onchange="filterAttachmentsFixed()">
                            <option value="all">جميع الأنواع</option>
                            <option value="images">الصور</option>
                            <option value="documents">المستندات</option>
                            <option value="word">وورد</option>
                            <option value="excel">اكسل</option>
                        </select>
                    </div>
                </div>
                
                <div class="attachment-content">
                    <div class="attachment-dropzone" id="attachment-dropzone-fixed">
                        <div class="dropzone-content">
                            <i class="fas fa-cloud-upload-alt"></i>
                            <h4>اسحب وأفلت الملفات هنا</h4>
                            <p>أو <button class="upload-link" onclick="triggerFileUploadFixed()">اختر الملفات</button></p>
                            <div class="upload-info">
                                <small>الحد الأقصى: ${StorageManager.formatBytes(currentAttachmentSettings.maxFileSize)} لكل ملف</small>
                                <small>الأنواع المدعومة: الصور، PDF، Word، النصوص</small>
                                <small>ضغط تلقائي للصور لتوفير المساحة</small>
                            </div>
                        </div>
                    </div>
                    
                    <div class="attachment-list" id="attachment-list-fixed">
                        <!-- المرفقات ستظهر هنا -->
                    </div>
                </div>
                
                <div class="attachment-footer">
                    <div class="attachment-stats" id="attachment-stats-fixed">
                        <span>0 ملفات</span>
                        <span>0 بايت</span>
                    </div>
                    <div class="compression-info" id="compression-info">
                        <small>نسبة الضغط: 0%</small>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- حقل رفع الملفات المخفي -->
        <input type="file" id="attachment-file-input-fixed" multiple accept="${getAcceptedFileTypesFixed()}" style="display: none;">
    `;
    
    // إضافة الأنماط المحسنة
    addAttachmentStylesFixed();
    
    document.body.appendChild(manager);
    attachmentManager = manager;
    
    // إعداد معالج رفع الملفات
    setupFileUploadHandlerFixed();
    
    // إعداد السحب والإفلات
    setupDragAndDropFixed();
    
    // تحديث معلومات التخزين
    updateStorageInfoFixed();
}

function addAttachmentButtonsFixed() {
    if (!currentAttachmentSettings.showAttachmentButton) return;
    
    // البحث عن مناطق النماذج
    const formSections = document.querySelectorAll('.form-container, .content-header, .case-container');
    
    formSections.forEach(section => {
        if (!section.querySelector('.attachment-button-fixed')) {
            addAttachmentButtonToSectionFixed(section);
        }
    });
}

function addAttachmentButtonToSectionFixed(section) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'attachment-button-fixed';
    button.innerHTML = `
        <i class="fas fa-paperclip"></i>
        <span>المرفقات المحسنة</span>
        <span class="attachment-count-badge" id="attachment-badge-fixed-${generateSectionIdFixed(section)}">0</span>
    `;
    
    button.onclick = () => {
        const caseId = extractCaseIdFixed(section);
        openAttachmentManagerFixed(caseId);
    };
    
    // إضافة الزر
    if (currentAttachmentSettings.buttonPosition === 'top') {
        section.insertBefore(button, section.firstChild);
    } else {
        section.appendChild(button);
    }
}

// ==============================
// وظائف مساعدة محسنة
// ==============================
function generateSectionIdFixed(section) {
    return 'section_' + Math.random().toString(36).substr(2, 6);
}

function extractCaseIdFixed(section) {
    // محاولة استخراج معرف الحالة
    if (typeof getFormData === 'function') {
        const formData = getFormData();
        if (formData && formData.id) {
            return formData.id;
        }
        if (formData && formData.formNumber) {
            return 'case_' + formData.formNumber;
        }
    }
    
    // إنشاء معرف افتراضي
    return 'current_case_' + Date.now();
}

function getAcceptedFileTypesFixed() {
    return currentAttachmentSettings.allowedFileTypes.join(',');
}

async function updateStorageInfoFixed() {
    try {
        const storageInfo = await StorageManager.checkStorageQuota();
        const storageInfoElement = document.getElementById('storage-info');
        
        if (storageInfoElement) {
            const usageColor = storageInfo.percentUsed > 90 ? '#e74c3c' : 
                              storageInfo.percentUsed > 70 ? '#f39c12' : '#27ae60';
            
            storageInfoElement.innerHTML = `
                <span style="color: ${usageColor}">
                    💾 ${StorageManager.formatBytes(storageInfo.usage)} / ${StorageManager.formatBytes(storageInfo.quota)} 
                    (${storageInfo.percentUsed.toFixed(1)}%)
                </span>
            `;
        }
    } catch (error) {
        console.warn('تعذر تحديث معلومات التخزين:', error);
    }
}

function updateAttachmentStatsFixed() {
    const statsElement = document.getElementById('attachment-stats-fixed');
    const compressionElement = document.getElementById('compression-info');
    
    if (statsElement) {
        statsElement.innerHTML = `
            <span>${storageStats.fileCount} ملفات</span>
            <span>${StorageManager.formatBytes(storageStats.totalSize)}</span>
        `;
    }
    
    if (compressionElement) {
        const ratio = (storageStats.compressionRatio * 100).toFixed(1);
        compressionElement.innerHTML = `<small>توفير مساحة: ${ratio}%</small>`;
    }
}

function refreshAttachmentListFixed() {
    const listContainer = document.getElementById('attachment-list-fixed');
    if (!listContainer || !currentCaseId) return;
    
    const caseAttachments = attachmentsData.get(currentCaseId) || [];
    
    if (caseAttachments.length === 0) {
        listContainer.innerHTML = `
            <div class="empty-attachments">
                <i class="fas fa-folder-open"></i>
                <h4>لا توجد مرفقات</h4>
                <p>ابدأ برفع الملفات للحالة الحالية</p>
            </div>
        `;
        return;
    }
    
    // جلب البيانات الخفيفة
    const files = caseAttachments
        .map(id => lightweightDatabase.get(id))
        .filter(Boolean)
        .sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
    
    listContainer.innerHTML = `
        <div class="attachment-grid-fixed">
            ${files.map(file => createFileCardFixed(file)).join('')}
        </div>
    `;
    
    updateAttachmentStatsFixed();
}

function createFileCardFixed(file) {
    const typeIcons = {
        'images': '🖼️',
        'documents': '📄',
        'word': '📝',
        'excel': '📊',
        'text': '📃',
        'other': '📁'
    };
    
    const typeColors = {
        'images': '#e74c3c',
        'documents': '#3498db',
        'word': '#2980b9',
        'excel': '#27ae60',
        'text': '#95a5a6',
        'other': '#95a5a6'
    };
    
    const icon = typeIcons[file.category] || typeIcons.other;
    const color = typeColors[file.category] || typeColors.other;
    
    return `
        <div class="file-card-fixed" data-file-id="${file.id}">
            <div class="file-thumbnail-fixed" style="background: ${color}">
                ${file.thumbnail ? 
                    `<img src="${file.thumbnail}" alt="${file.name}">` : 
                    `<span class="file-icon-fixed">${icon}</span>`
                }
                ${file.compressed ? '<div class="compressed-badge">📦</div>' : ''}
            </div>
            <div class="file-info-fixed">
                <div class="file-name-fixed" title="${file.name}">${truncateTextFixed(file.name, 20)}</div>
                <div class="file-meta-fixed">
                    <span class="file-size-fixed">${StorageManager.formatBytes(file.size)}</span>
                    <span class="file-date-fixed">${formatDateFixed(file.uploadDate)}</span>
                </div>
            </div>
            <div class="file-actions-fixed">
                <button class="action-btn-fixed" onclick="downloadFileFixed('${file.id}')" title="تحميل">
                    <i class="fas fa-download"></i>
                </button>
                <button class="action-btn-fixed delete-btn-fixed" onclick="deleteFileFixed('${file.id}')" title="حذف">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;
}

async function downloadFileFixed(fileId) {
    try {
        showAttachmentToast('جاري تحضير التحميل...', 'info');
        
        const fileMetadata = lightweightDatabase.get(fileId);
        if (!fileMetadata) {
            showAttachmentToast('الملف غير موجود', 'error');
            return;
        }
        
        // تحميل بيانات الملف
        const fileDataStr = localStorage.getItem(`file_data_${fileId}`);
        if (!fileDataStr) {
            showAttachmentToast('بيانات الملف غير متوفرة', 'error');
            return;
        }
        
        const fileData = JSON.parse(fileDataStr);
        
        // إنشاء رابط التحميل
        const link = document.createElement('a');
        link.href = fileData.data;
        link.download = fileMetadata.name;
        link.click();
        
        showAttachmentToast(`✅ تم تحميل ${fileMetadata.name}`, 'success');
        
    } catch (error) {
        console.error('خطأ في تحميل الملف:', error);
        showAttachmentToast('فشل في تحميل الملف', 'error');
    }
}

async function deleteFileFixed(fileId) {
    const fileMetadata = lightweightDatabase.get(fileId);
    if (!fileMetadata) {
        showAttachmentToast('الملف غير موجود', 'error');
        return;
    }
    
    if (confirm(`هل أنت متأكد من حذف الملف "${fileMetadata.name}"؟`)) {
        try {
            // حذف من قاعدة البيانات الخفيفة
            lightweightDatabase.delete(fileId);
            
            // حذف من قائمة مرفقات الحالة
            const caseAttachments = attachmentsData.get(fileMetadata.caseId);
            if (caseAttachments) {
                const index = caseAttachments.indexOf(fileId);
                if (index > -1) {
                    caseAttachments.splice(index, 1);
                }
            }
            
            // حذف بيانات الملف
            localStorage.removeItem(`file_data_${fileId}`);
            
            // حفظ التغييرات
            await saveAttachmentDatabaseFixed();
            
            // تحديث الإحصائيات
            storageStats.fileCount--;
            storageStats.totalSize -= fileMetadata.size;
            
            // تحديث العرض
            refreshAttachmentListFixed();
            
            showAttachmentToast(`✅ تم حذف ${fileMetadata.name}`, 'success');
            
        } catch (error) {
            console.error('خطأ في حذف الملف:', error);
            showAttachmentToast('فشل في حذف الملف', 'error');
        }
    }
}

// ==============================
// وظائف إضافية محسنة
// ==============================
function setupFileUploadHandlerFixed() {
    const fileInput = document.getElementById('attachment-file-input-fixed');
    if (!fileInput) return;
    
    fileInput.addEventListener('change', function(e) {
        const files = [...e.target.files];
        handleFileUploadFixed(files);
        this.value = '';
    });
}

function setupDragAndDropFixed() {
    const dropzone = document.getElementById('attachment-dropzone-fixed');
    if (!dropzone) return;
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, preventDefaults, false);
    });
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropzone.addEventListener(eventName, () => dropzone.classList.add('drag-over'), false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, () => dropzone.classList.remove('drag-over'), false);
    });
    
    dropzone.addEventListener('drop', handleDropFixed, false);
}

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function handleDropFixed(e) {
    const dt = e.dataTransfer;
    const files = [...dt.files];
    handleFileUploadFixed(files);
}

function triggerFileUploadFixed() {
    const fileInput = document.getElementById('attachment-file-input-fixed');
    if (fileInput) {
        fileInput.click();
    }
}

function openAttachmentManagerFixed(caseId = null) {
    if (!attachmentManager) {
        createAttachmentManagerFixed();
    }
    
    currentCaseId = caseId;
    
    // تحديث معلومات الحالة
    updateCaseInfoFixed(caseId);
    
    // عرض المدير
    const overlay = attachmentManager.querySelector('.attachment-overlay');
    overlay.classList.add('show');
    document.body.style.overflow = 'hidden';
    
    // تحديث قائمة المرفقات
    refreshAttachmentListFixed();
    
    // تحديث معلومات التخزين
    updateStorageInfoFixed();
}

function closeAttachmentManagerFixed() {
    if (attachmentManager) {
        const overlay = attachmentManager.querySelector('.attachment-overlay');
        overlay.classList.remove('show');
        document.body.style.overflow = 'auto';
    }
    currentCaseId = null;
}

function updateCaseInfoFixed(caseId) {
    const caseInfoElement = document.getElementById('current-case-info');
    if (!caseInfoElement) return;
    
    if (caseId) {
        const attachmentCount = (attachmentsData.get(caseId) || []).length;
        caseInfoElement.textContent = `الحالة: ${caseId} (${attachmentCount} مرفق)`;
    } else {
        caseInfoElement.textContent = 'لم يتم تحديد حالة';
    }
}

async function cleanupStorageFixed() {
    if (confirm('هل تريد تنظيف مساحة التخزين؟ سيتم حذف الملفات المؤقتة والقديمة.')) {
        try {
            showAttachmentToast('🧹 جاري تنظيف مساحة التخزين...', 'info');
            
            const freedSpace = await StorageManager.freeUpSpace();
            
            // تحديث معلومات التخزين
            await updateStorageInfoFixed();
            
            showAttachmentToast(`✅ تم تحرير ${StorageManager.formatBytes(freedSpace)} تقريباً`, 'success');
            
        } catch (error) {
            console.error('فشل في تنظيف التخزين:', error);
            showAttachmentToast('فشل في تنظيف مساحة التخزين', 'error');
        }
    }
}

function searchAttachmentsFixed() {
    const searchTerm = document.getElementById('attachment-search-fixed').value.toLowerCase();
    const fileCards = document.querySelectorAll('.file-card-fixed');
    
    fileCards.forEach(card => {
        const fileName = card.querySelector('.file-name-fixed').textContent.toLowerCase();
        card.style.display = fileName.includes(searchTerm) ? 'block' : 'none';
    });
}

function filterAttachmentsFixed() {
    const filterType = document.getElementById('attachment-filter-type-fixed').value;
    const fileCards = document.querySelectorAll('.file-card-fixed');
    
    fileCards.forEach(card => {
        const fileId = card.getAttribute('data-file-id');
        const fileMetadata = lightweightDatabase.get(fileId);
        
        if (filterType === 'all' || fileMetadata.category === filterType) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// ==============================
// وظائف التقدم والإشعارات
// ==============================
function showUploadProgressFixed() {
    const progressBar = document.createElement('div');
    progressBar.id = 'upload-progress-fixed';
    progressBar.innerHTML = `
        <div class="progress-overlay">
            <div class="progress-container-fixed">
                <div class="progress-header">
                    <h4>جاري رفع الملفات</h4>
                    <button onclick="cancelUploadFixed()" class="cancel-btn">✕</button>
                </div>
                <div class="progress-bar-fixed">
                    <div class="progress-fill-fixed" style="width: 0%"></div>
                </div>
                <div class="progress-text-fixed">بدء الرفع...</div>
                <div class="progress-details">
                    <small>نصيحة: الصور سيتم ضغطها تلقائياً لتوفير المساحة</small>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(progressBar);
}

function updateUploadProgressFixed(percentage, message = '') {
    const progressFill = document.querySelector('#upload-progress-fixed .progress-fill-fixed');
    const progressText = document.querySelector('#upload-progress-fixed .progress-text-fixed');
    
    if (progressFill) {
        progressFill.style.width = Math.min(100, Math.max(0, percentage)) + '%';
    }
    
    if (progressText && message) {
        progressText.textContent = message;
    }
}

function hideUploadProgressFixed() {
    const progressBar = document.getElementById('upload-progress-fixed');
    if (progressBar) {
        progressBar.remove();
    }
}

function cancelUploadFixed() {
    hideUploadProgressFixed();
    showAttachmentToast('تم إلغاء رفع الملفات', 'info');
}

// ==============================
// وظائف مساعدة عامة
// ==============================
function loadAttachmentSettingsFixed() {
    try {
        const settings = localStorage.getItem('charity_attachment_settings_v2');
        if (settings) {
            currentAttachmentSettings = { ...DEFAULT_ATTACHMENT_SETTINGS, ...JSON.parse(settings) };
        }
    } catch (error) {
        console.error('خطأ في تحميل إعدادات المرفقات:', error);
    }
}

function truncateTextFixed(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
}

function formatDateFixed(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'منذ لحظات';
    if (diff < 3600000) return `منذ ${Math.floor(diff / 60000)} دقيقة`;
    if (diff < 86400000) return `منذ ${Math.floor(diff / 3600000)} ساعة`;
    if (diff < 604800000) return `منذ ${Math.floor(diff / 86400000)} يوم`;
    
    return date.toLocaleDateString('ar-EG');
}

function showAttachmentToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `attachment-toast-fixed ${type}`;
    toast.innerHTML = `
        <div class="toast-icon-fixed">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle'}"></i>
        </div>
        <div class="toast-message-fixed">${message}</div>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 100);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (document.body.contains(toast)) {
                document.body.removeChild(toast);
            }
        }, 300);
    }, 4000);
}

function startAutoCleanup() {
    // تنظيف تلقائي كل ساعة
    setInterval(async () => {
        try {
            const storageInfo = await StorageManager.checkStorageQuota();
            
            // إذا كانت المساحة ممتلئة بنسبة أكثر من 85%
            if (storageInfo.percentUsed > 85) {
                console.log('🧹 بدء التنظيف التلقائي...');
                await StorageManager.freeUpSpace();
            }
        } catch (error) {
            console.warn('فشل في التنظيف التلقائي:', error);
        }
    }, 3600000); // كل ساعة
}

function setupAttachmentEventListenersFixed() {
    // اختصارات لوحة المفاتيح
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.altKey && e.key === 'A') {
            e.preventDefault();
            openAttachmentManagerFixed();
        }
        
        if (e.key === 'Escape' && attachmentManager) {
            const overlay = attachmentManager.querySelector('.attachment-overlay');
            if (overlay && overlay.classList.contains('show')) {
                closeAttachmentManagerFixed();
            }
        }
    });
}

// ==============================
// إضافة الأنماط المحسنة
// ==============================
function addAttachmentStylesFixed() {
    if (document.getElementById('attachment-styles-fixed')) return;
    
    const styles = document.createElement('style');
    styles.id = 'attachment-styles-fixed';
    styles.textContent = `
        /* أنماط الأزرار المحسنة */
        .attachment-button-fixed {
            background: linear-gradient(135deg, #27ae60, #2ecc71);
            color: white;
            border: none;
            padding: 12px 16px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            transition: all 0.3s ease;
            margin: 10px 0;
            position: relative;
            box-shadow: 0 2px 8px rgba(39, 174, 96, 0.3);
        }
        
        .attachment-button-fixed:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(39, 174, 96, 0.4);
        }
        
        .attachment-count-badge {
            background: #e74c3c;
            color: white;
            border-radius: 50%;
            width: 22px;
            height: 22px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 11px;
            position: absolute;
            top: -5px;
            right: -5px;
        }
        
        /* نافذة المرفقات المحسنة */
        .attachment-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.85);
            z-index: 10000;
            display: none;
            justify-content: center;
            align-items: center;
            padding: 15px;
            backdrop-filter: blur(5px);
        }
        
        .attachment-overlay.show {
            display: flex;
        }
        
        .attachment-container {
            background: white;
            border-radius: 16px;
            width: 100%;
            max-width: 1000px;
            max-height: 90vh;
            overflow: hidden;
            box-shadow: 0 25px 60px rgba(0, 0, 0, 0.4);
            display: flex;
            flex-direction: column;
            animation: slideInUp 0.3s ease;
        }
        
        @keyframes slideInUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .attachment-header {
            background: linear-gradient(135deg, #27ae60, #2ecc71);
            color: white;
            padding: 20px;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            flex-wrap: wrap;
            gap: 15px;
        }
        
        .attachment-title h3 {
            margin: 0 0 8px 0;
            font-size: 20px;
            font-weight: 700;
        }
        
        .case-info {
            font-size: 14px;
            opacity: 0.95;
            background: rgba(255,255,255,0.15);
            padding: 4px 8px;
            border-radius: 4px;
            margin-bottom: 5px;
        }
        
        .storage-info {
            font-size: 12px;
            opacity: 0.9;
        }
        
        .attachment-actions {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
        }
        
        .attachment-btn {
            background: rgba(255, 255, 255, 0.2);
            border: none;
            color: white;
            padding: 10px 14px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 6px;
            transition: all 0.3s;
            backdrop-filter: blur(10px);
        }
        
        .attachment-btn:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: translateY(-1px);
        }
        
        .cleanup-btn {
            background: rgba(241, 196, 15, 0.3);
        }
        
        .cleanup-btn:hover {
            background: rgba(241, 196, 15, 0.4);
        }
        
        .close-btn {
            background: rgba(231, 76, 60, 0.3);
        }
        
        .close-btn:hover {
            background: rgba(231, 76, 60, 0.5);
        }
        
        /* شريط البحث المحسن */
        .attachment-toolbar {
            background: linear-gradient(135deg, #f8f9fa, #e9ecef);
            padding: 16px 20px;
            border-bottom: 1px solid #dee2e6;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 15px;
        }
        
        .attachment-search {
            position: relative;
            flex: 1;
            min-width: 250px;
        }
        
        .attachment-search input {
            width: 100%;
            padding: 12px 45px 12px 16px;
            border: 2px solid #e9ecef;
            border-radius: 25px;
            font-size: 14px;
            transition: all 0.3s;
            background: white;
        }
        
        .attachment-search input:focus {
            outline: none;
            border-color: #27ae60;
            box-shadow: 0 0 0 3px rgba(39, 174, 96, 0.1);
        }
        
        .attachment-search i {
            position: absolute;
            right: 16px;
            top: 50%;
            transform: translateY(-50%);
            color: #6c757d;
        }
        
        .attachment-filters select {
            padding: 10px 14px;
            border: 2px solid #e9ecef;
            border-radius: 8px;
            font-size: 14px;
            background: white;
            cursor: pointer;
        }
        
        /* منطقة المحتوى */
        .attachment-content {
            flex: 1;
            overflow-y: auto;
            padding: 20px;
            background: #f8f9fa;
        }
        
        /* منطقة السحب والإفلات المحسنة */
        .attachment-dropzone {
            border: 3px dashed #bdc3c7;
            border-radius: 16px;
            padding: 40px 20px;
            text-align: center;
            margin-bottom: 25px;
            transition: all 0.3s;
            background: white;
        }
        
        .attachment-dropzone.drag-over {
            border-color: #27ae60;
            background: rgba(39, 174, 96, 0.05);
            transform: scale(1.02);
        }
        
        .dropzone-content i {
            font-size: 52px;
            color: #27ae60;
            margin-bottom: 16px;
        }
        
        .dropzone-content h4 {
            color: #2c3e50;
            margin-bottom: 12px;
            font-size: 18px;
        }
        
        .upload-link {
            background: none;
            border: none;
            color: #27ae60;
            text-decoration: underline;
            cursor: pointer;
            font-size: 15px;
            font-weight: 600;
        }
        
        .upload-info {
            margin-top: 16px;
            display: flex;
            flex-direction: column;
            gap: 6px;
        }
        
        .upload-info small {
            color: #6c757d;
            font-size: 12px;
        }
        
        /* عرض الملفات المحسن */
        .attachment-grid-fixed {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
            gap: 20px;
        }
        
        .file-card-fixed {
            background: white;
            border-radius: 12px;
            padding: 16px;
            transition: all 0.3s;
            cursor: pointer;
            border: 1px solid #e9ecef;
            position: relative;
            overflow: hidden;
        }
        
        .file-card-fixed:hover {
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
            transform: translateY(-3px);
        }
        
        .file-thumbnail-fixed {
            width: 100%;
            height: 100px;
            border-radius: 8px;
            overflow: hidden;
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
        }
        
        .file-thumbnail-fixed img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        
        .file-icon-fixed {
            font-size: 32px;
            color: white;
        }
        
        .compressed-badge {
            position: absolute;
            top: 5px;
            right: 5px;
            background: rgba(39, 174, 96, 0.9);
            color: white;
            padding: 2px 6px;
            border-radius: 10px;
            font-size: 10px;
            font-weight: 700;
        }
        
        .file-info-fixed {
            margin-bottom: 12px;
        }
        
        .file-name-fixed {
            font-weight: 600;
            color: #2c3e50;
            margin-bottom: 6px;
            font-size: 14px;
            line-height: 1.3;
        }
        
        .file-meta-fixed {
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            color: #6c757d;
        }
        
        .file-actions-fixed {
            display: flex;
            justify-content: center;
            gap: 8px;
        }
        
        .action-btn-fixed {
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            color: #6c757d;
            width: 35px;
            height: 35px;
            border-radius: 8px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 13px;
            transition: all 0.3s;
        }
        
        .action-btn-fixed:hover {
            background: #e9ecef;
            color: #495057;
            transform: translateY(-1px);
        }
        
        .delete-btn-fixed:hover {
            background: #e74c3c;
            color: white;
            border-color: #e74c3c;
        }
        
        /* الحالة الفارغة */
        .empty-attachments {
            text-align: center;
            padding: 60px 20px;
            color: #6c757d;
        }
        
        .empty-attachments i {
            font-size: 72px;
            color: #bdc3c7;
            margin-bottom: 20px;
        }
        
        .empty-attachments h4 {
            margin-bottom: 12px;
            color: #2c3e50;
            font-size: 20px;
        }
        
        /* التذييل المحسن */
        .attachment-footer {
            background: linear-gradient(135deg, #f8f9fa, #e9ecef);
            padding: 16px 20px;
            border-top: 1px solid #dee2e6;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 12px;
        }
        
        .attachment-stats {
            display: flex;
            gap: 20px;
            font-size: 14px;
            color: #495057;
            font-weight: 600;
        }
        
        .compression-info {
            color: #27ae60;
            font-weight: 600;
        }
        
        /* شريط التقدم المحسن */
        .progress-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            z-index: 10001;
            display: flex;
            align-items: center;
            justify-content: center;
            backdrop-filter: blur(8px);
        }
        
        .progress-container-fixed {
            background: white;
            padding: 30px;
            border-radius: 16px;
            width: 400px;
            max-width: 90vw;
            text-align: center;
            box-shadow: 0 25px 60px rgba(0, 0, 0, 0.3);
        }
        
        .progress-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }
        
        .progress-header h4 {
            margin: 0;
            color: #2c3e50;
            font-size: 18px;
        }
        
        .cancel-btn {
            background: #e74c3c;
            color: white;
            border: none;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 16px;
        }
        
        .progress-bar-fixed {
            width: 100%;
            height: 12px;
            background: #e9ecef;
            border-radius: 25px;
            overflow: hidden;
            margin-bottom: 16px;
        }
        
        .progress-fill-fixed {
            height: 100%;
            background: linear-gradient(135deg, #27ae60, #2ecc71);
            transition: width 0.3s ease;
            border-radius: 25px;
        }
        
        .progress-text-fixed {
            font-weight: 600;
            color: #2c3e50;
            margin-bottom: 8px;
        }
        
        .progress-details {
            font-size: 12px;
            color: #6c757d;
        }
        
        /* الإشعارات المحسنة */
        .attachment-toast-fixed {
            position: fixed;
            top: 80px;
            right: 20px;
            background: #2c3e50;
            color: white;
            padding: 16px 20px;
            border-radius: 12px;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
            z-index: 10002;
            display: flex;
            align-items: center;
            gap: 12px;
            transform: translateX(100%);
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            max-width: 400px;
            word-wrap: break-word;
            backdrop-filter: blur(10px);
        }
        
        .attachment-toast-fixed.show {
            transform: translateX(0);
        }
        
        .attachment-toast-fixed.success {
            background: linear-gradient(135deg, #27ae60, #2ecc71);
            border-left: 4px solid #1e8449;
        }
        
        .attachment-toast-fixed.error {
            background: linear-gradient(135deg, #e74c3c, #c0392b);
            border-left: 4px solid #a93226;
        }
        
        .attachment-toast-fixed.warning {
            background: linear-gradient(135deg, #f39c12, #e67e22);
            border-left: 4px solid #d68910;
        }
        
        .attachment-toast-fixed.info {
            background: linear-gradient(135deg, #3498db, #2980b9);
            border-left: 4px solid #2471a3;
        }
        
        .toast-icon-fixed {
            font-size: 20px;
            flex-shrink: 0;
        }
        
        .toast-message-fixed {
            flex: 1;
            font-size: 14px;
            font-weight: 500;
        }
        
        /* تحسينات للهواتف */
        @media (max-width: 768px) {
            .attachment-overlay {
                padding: 10px;
            }
            
            .attachment-container {
                max-height: 95vh;
                border-radius: 12px;
            }
            
            .attachment-header {
                padding: 16px;
                flex-direction: column;
                align-items: stretch;
            }
            
            .attachment-actions {
                justify-content: center;
                gap: 8px;
            }
            
            .attachment-btn {
                flex: 1;
                min-width: 90px;
                padding: 8px 10px;
                font-size: 12px;
            }
            
            .attachment-toolbar {
                padding: 12px 16px;
                flex-direction: column;
                align-items: stretch;
            }
            
            .attachment-search {
                min-width: auto;
                margin-bottom: 10px;
            }
            
            .attachment-content {
                padding: 16px;
            }
            
            .attachment-grid-fixed {
                grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
                gap: 15px;
            }
            
            .file-card-fixed {
                padding: 12px;
            }
            
            .file-thumbnail-fixed {
                height: 80px;
            }
            
            .attachment-footer {
                padding: 12px 16px;
                flex-direction: column;
                align-items: center;
            }
            
            .attachment-stats {
                gap: 15px;
                font-size: 13px;
            }
            
            .attachment-toast-fixed {
                right: 10px;
                left: 10px;
                max-width: none;
            }
            
            .progress-container-fixed {
                width: 300px;
                padding: 20px;
            }
        }
        
        @media (max-width: 480px) {
            .attachment-grid-fixed {
                grid-template-columns: 1fr 1fr;
                gap: 12px;
            }
            
            .file-card-fixed {
                padding: 10px;
            }
            
            .file-actions-fixed {
                gap: 6px;
            }
            
            .action-btn-fixed {
                width: 30px;
                height: 30px;
                font-size: 11px;
            }
        }
    `;
    
    document.head.appendChild(styles);
}

// ==============================
// تهيئة النظام عند تحميل الصفحة
// ==============================
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        initializeAttachmentSystemFixed();
    }, 2000);
});

// ==============================
// إتاحة الوظائف عالمياً
// ==============================
window.attachmentSystemFixed = {
    open: openAttachmentManagerFixed,
    close: closeAttachmentManagerFixed,
    upload: handleFileUploadFixed,
    download: downloadFileFixed,
    delete: deleteFileFixed,
    cleanup: cleanupStorageFixed,
    stats: storageStats,
    settings: currentAttachmentSettings
};

console.log('📎✨ تم تحميل نظام إدارة المرفقات المحسن بنجاح!');
console.log('🔧 معالجة محسنة للأخطاء وإدارة ذكية للذاكرة');
console.log('💾 ضغط تلقائي وتوفير مساحة التخزين');
console.log('🧹 تنظيف تلقائي ونسخ احتياطي آمن');
