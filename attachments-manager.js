/**
 * نظام إدارة المرفقات والوثائق المحسن والمتكامل
 * إصدار محسن مع حل مشاكل التخزين والتكامل مع النظام الرئيسي
 * يدعم الصور، PDF، Word، Excel مع حفظ دائم وربط بالحالات
 * 
 * الاستخدام: قم بتضمين هذا الملف في HTML الخاص بك
 * <script src="attachments-manager.js"></script>
 */

// ==============================
// إعدادات نظام المرفقات المحسنة
// ==============================
const DEFAULT_ATTACHMENT_SETTINGS = {
    // إعدادات الرفع
    maxFileSize: 5 * 1024 * 1024, // 5 MB (مخفض لتحسين الأداء)
    maxFilesPerCase: 15, // مخفض لتحسين الأداء
    allowedFileTypes: [
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf',
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
    ],
    
    // إعدادات الضغط المحسنة
    compressImages: true,
    imageQuality: 0.7, // مخفض لتوفير المساحة
    maxImageWidth: 1200, // مخفض لتحسين الأداء
    maxImageHeight: 800,
    
    // إعدادات التخزين المحسنة
    useIndexedDB: true, // استخدام IndexedDB بدلاً من localStorage
    autoSave: true,
    saveInterval: 5000, // حفظ كل 5 ثوان
    
    // إعدادات الواجهة
    showInSidebar: true,
    sidebarPosition: 'bottom',
    showThumbnails: true,
    compactMode: true
};

// ==============================
// متغيرات النظام المحسنة
// ==============================
let currentAttachmentSettings = { ...DEFAULT_ATTACHMENT_SETTINGS };
let attachmentDatabase = {
    db: null, // IndexedDB instance
    version: 1,
    stores: {
        files: 'files',
        metadata: 'metadata',
        thumbnails: 'thumbnails',
        cases: 'cases'
    }
};

let attachmentsCache = new Map(); // كاش للوصول السريع
let currentCaseData = null; // بيانات الحالة الحالية
let sidebarAttachmentIcon = null;
let attachmentManager = null;
let isInitialized = false;

// مفاتيح التخزين المحسنة
const STORAGE_KEYS = {
    SETTINGS: 'charity_attachment_settings_v2',
    BACKUP: 'charity_attachment_backup_v2',
    CACHE: 'charity_attachment_cache_v2'
};

// ==============================
// تهيئة النظام المحسنة
// ==============================
async function initializeAttachmentSystem() {
    if (isInitialized) return;
    
    try {
        console.log('🔄 بدء تهيئة نظام المرفقات المحسن...');
        
        // تحميل الإعدادات
        await loadAttachmentSettings();
        
        // تهيئة قاعدة البيانات
        await initializeDatabase();
        
        // تحميل البيانات المحفوظة
        await loadAttachmentsFromDB();
        
        // إضافة أيقونة الشريط الجانبي
        addSidebarAttachmentIcon();
        
        // إنشاء مدير المرفقات
        createAttachmentManager();
        
        // إضافة أزرار المرفقات للنماذج
        addAttachmentButtons();
        
        // إعداد المستمعين
        setupAttachmentEventListeners();
        
        // بدء الحفظ التلقائي
        startAutoSave();
        
        // تحديث الواجهة
        updateSidebarIcon();
        
        isInitialized = true;
        console.log('✅ تم تهيئة نظام المرفقات بنجاح');
        showAttachmentToast('📎 نظام المرفقات جاهز للاستخدام', 'success');
        
    } catch (error) {
        console.error('❌ خطأ في تهيئة نظام المرفقات:', error);
        showAttachmentToast('فشل في تهيئة نظام المرفقات: ' + error.message, 'error');
        
        // محاولة التهيئة بالتخزين العادي كبديل
        await fallbackToLocalStorage();
    }
}

// ==============================
// تهيئة قاعدة البيانات IndexedDB
// ==============================
async function initializeDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('CharityAttachmentsDB', attachmentDatabase.version);
        
        request.onerror = () => {
            console.error('خطأ في فتح قاعدة البيانات');
            reject(new Error('فشل في فتح قاعدة البيانات'));
        };
        
        request.onsuccess = (event) => {
            attachmentDatabase.db = event.target.result;
            console.log('✅ تم فتح قاعدة البيانات بنجاح');
            resolve();
        };
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            // إنشاء متاجر البيانات
            if (!db.objectStoreNames.contains('files')) {
                const filesStore = db.createObjectStore('files', { keyPath: 'id' });
                filesStore.createIndex('caseId', 'caseId', { unique: false });
                filesStore.createIndex('uploadDate', 'uploadDate', { unique: false });
            }
            
            if (!db.objectStoreNames.contains('metadata')) {
                const metadataStore = db.createObjectStore('metadata', { keyPath: 'id' });
                metadataStore.createIndex('caseId', 'caseId', { unique: false });
                metadataStore.createIndex('category', 'category', { unique: false });
            }
            
            if (!db.objectStoreNames.contains('thumbnails')) {
                db.createObjectStore('thumbnails', { keyPath: 'id' });
            }
            
            if (!db.objectStoreNames.contains('cases')) {
                const casesStore = db.createObjectStore('cases', { keyPath: 'caseId' });
                casesStore.createIndex('caseType', 'caseType', { unique: false });
            }
            
            console.log('✅ تم إنشاء هيكل قاعدة البيانات');
        };
    });
}

// ==============================
// إضافة أيقونة الشريط الجانبي
// ==============================
function addSidebarAttachmentIcon() {
    const sidebar = document.querySelector('.nav-menu');
    if (!sidebar) {
        setTimeout(addSidebarAttachmentIcon, 1000);
        return;
    }
    
    // إنشاء قسم المرفقات
    const attachmentSection = document.createElement('div');
    attachmentSection.className = 'nav-section';
    attachmentSection.innerHTML = `
        <div class="nav-section-title">المرفقات والوثائق</div>
        <div class="nav-item attachment-nav-item" onclick="openAttachmentGallery()" role="button" tabindex="0">
            <i class="fas fa-images"></i>
            <span>معرض المرفقات</span>
            <span class="badge" id="total-attachments-count">0</span>
        </div>
        <div class="nav-item" onclick="openAttachmentsByType('سيد')" role="button" tabindex="0">
            <i class="fas fa-hand-holding-heart"></i>
            <span>مرفقات السيد</span>
            <span class="badge" id="sayed-attachments-count">0</span>
        </div>
        <div class="nav-item" onclick="openAttachmentsByType('مصاريف')" role="button" tabindex="0">
            <i class="fas fa-receipt"></i>
            <span>مرفقات المصاريف</span>
            <span class="badge" id="expenses-attachments-count">0</span>
        </div>
        <div class="nav-item" onclick="openAttachmentsByType('عام')" role="button" tabindex="0">
            <i class="fas fa-users"></i>
            <span>المرفقات العامة</span>
            <span class="badge" id="general-attachments-count">0</span>
        </div>
    `;
    
    sidebar.appendChild(attachmentSection);
    sidebarAttachmentIcon = attachmentSection;
}

// ==============================
// ربط الملفات بالحالات الحالية
// ==============================
function getCurrentCaseInfo() {
    try {
        // محاولة الحصول على بيانات النموذج الحالي
        if (typeof getFormData === 'function') {
            const formData = getFormData();
            if (formData) {
                return {
                    id: formData.formNumber || 'case_' + Date.now(),
                    type: formData.caseCode || 'عام',
                    name: formData.fullName || 'حالة غير مسماة',
                    section: getCurrentSection()
                };
            }
        }
        
        // الحصول على القسم الحالي
        const currentSection = getCurrentSection();
        let caseType = 'عام';
        
        if (currentSection.includes('sayed')) caseType = 'سيد';
        else if (currentSection.includes('expenses')) caseType = 'مصاريف';
        
        return {
            id: 'current_case_' + Date.now(),
            type: caseType,
            name: 'الحالة الحالية',
            section: currentSection
        };
        
    } catch (error) {
        console.error('خطأ في الحصول على معلومات الحالة:', error);
        return {
            id: 'default_case',
            type: 'عام',
            name: 'حالة افتراضية',
            section: 'unknown'
        };
    }
}

function getCurrentSection() {
    try {
        if (typeof currentSection !== 'undefined') {
            return currentSection;
        }
        
        const activeSection = document.querySelector('.content-section.active');
        if (activeSection) {
            return activeSection.id.replace('-section', '');
        }
        
        return 'dashboard';
    } catch (error) {
        return 'dashboard';
    }
}

// ==============================
// حفظ الملفات في قاعدة البيانات المحسن
// ==============================
async function saveFileToDatabase(fileData) {
    try {
        if (!attachmentDatabase.db) {
            throw new Error('قاعدة البيانات غير متاحة');
        }
        
        const transaction = attachmentDatabase.db.transaction(['files', 'metadata', 'thumbnails', 'cases'], 'readwrite');
        
        // حفظ الملف
        const filesStore = transaction.objectStore('files');
        await new Promise((resolve, reject) => {
            const request = filesStore.put({
                id: fileData.id,
                data: fileData.data,
                size: fileData.size,
                originalSize: fileData.originalSize || fileData.size
            });
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
        
        // حفظ البيانات الوصفية
        const metadataStore = transaction.objectStore('metadata');
        await new Promise((resolve, reject) => {
            const request = metadataStore.put({
                id: fileData.id,
                caseId: fileData.caseId,
                name: fileData.name,
                type: fileData.type,
                category: fileData.category,
                uploadDate: fileData.uploadDate,
                size: fileData.size,
                isCompressed: fileData.isCompressed || false,
                description: fileData.description || '',
                tags: fileData.tags || []
            });
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
        
        // حفظ المعاينة المصغرة
        if (fileData.thumbnail) {
            const thumbnailsStore = transaction.objectStore('thumbnails');
            await new Promise((resolve, reject) => {
                const request = thumbnailsStore.put({
                    id: fileData.id,
                    thumbnail: fileData.thumbnail
                });
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        }
        
        // تحديث معلومات الحالة
        const casesStore = transaction.objectStore('cases');
        const caseInfo = await getCaseFromDB(fileData.caseId) || {
            caseId: fileData.caseId,
            caseType: fileData.caseType || 'عام',
            caseName: fileData.caseName || 'حالة',
            files: [],
            totalSize: 0,
            lastUpdate: new Date().toISOString()
        };
        
        if (!caseInfo.files.includes(fileData.id)) {
            caseInfo.files.push(fileData.id);
        }
        caseInfo.totalSize = (caseInfo.totalSize || 0) + fileData.size;
        caseInfo.lastUpdate = new Date().toISOString();
        
        await new Promise((resolve, reject) => {
            const request = casesStore.put(caseInfo);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
        
        // تحديث الكاش
        attachmentsCache.set(fileData.id, fileData);
        
        console.log('✅ تم حفظ الملف في قاعدة البيانات:', fileData.name);
        return true;
        
    } catch (error) {
        console.error('❌ خطأ في حفظ الملف:', error);
        throw error;
    }
}

// ==============================
// تحميل الملفات من قاعدة البيانات
// ==============================
async function loadAttachmentsFromDB() {
    try {
        if (!attachmentDatabase.db) return;
        
        const transaction = attachmentDatabase.db.transaction(['files', 'metadata', 'thumbnails'], 'readonly');
        
        // تحميل جميع الملفات
        const metadataStore = transaction.objectStore('metadata');
        const metadataRequest = metadataStore.getAll();
        
        const filesData = await new Promise((resolve, reject) => {
            metadataRequest.onsuccess = () => resolve(metadataRequest.result);
            metadataRequest.onerror = () => reject(metadataRequest.error);
        });
        
        console.log(`📁 تم تحميل ${filesData.length} ملف من قاعدة البيانات`);
        
        // تحديث الكاش
        for (const file of filesData) {
            attachmentsCache.set(file.id, file);
        }
        
        return filesData;
        
    } catch (error) {
        console.error('❌ خطأ في تحميل المرفقات:', error);
        return [];
    }
}

// ==============================
// معالجة رفع الملفات المحسنة
// ==============================
async function handleFileUpload(files) {
    if (!files || files.length === 0) return;
    
    const caseInfo = getCurrentCaseInfo();
    console.log('📎 رفع ملفات للحالة:', caseInfo);
    
    showUploadProgress();
    
    let uploadedCount = 0;
    let failedCount = 0;
    
    try {
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            
            try {
                // التحقق من صحة الملف
                if (!validateFile(file)) {
                    failedCount++;
                    continue;
                }
                
                updateUploadProgress(((i + 0.5) / files.length) * 100, `معالجة ${file.name}...`);
                
                // معالجة الملف
                const processedFile = await processFile(file, caseInfo);
                
                updateUploadProgress(((i + 0.8) / files.length) * 100, `حفظ ${file.name}...`);
                
                // حفظ الملف
                await saveFileToDatabase(processedFile);
                
                uploadedCount++;
                updateUploadProgress(((i + 1) / files.length) * 100, `تم حفظ ${file.name}`);
                
            } catch (error) {
                console.error('خطأ في رفع الملف:', file.name, error);
                failedCount++;
            }
        }
        
    } catch (error) {
        console.error('خطأ عام في رفع الملفات:', error);
        showAttachmentToast('حدث خطأ غير متوقع في رفع الملفات', 'error');
    } finally {
        hideUploadProgress();
    }
    
    // إظهار النتائج
    if (uploadedCount > 0) {
        showAttachmentToast(`✅ تم رفع ${uploadedCount} ملف بنجاح`, 'success');
        await refreshAllViews();
    }
    
    if (failedCount > 0) {
        showAttachmentToast(`❌ فشل في رفع ${failedCount} ملف`, 'error');
    }
}

// ==============================
// معالجة الملفات المحسنة
// ==============================
async function processFile(file, caseInfo) {
    const fileId = generateFileId();
    
    let processedFile = {
        id: fileId,
        name: file.name,
        size: file.size,
        originalSize: file.size,
        type: file.type,
        category: getFileCategory(file.type),
        uploadDate: new Date().toISOString(),
        caseId: caseInfo.id,
        caseType: caseInfo.type,
        caseName: caseInfo.name,
        description: '',
        tags: [caseInfo.type, caseInfo.section],
        isCompressed: false
    };
    
    // معالجة خاصة للصور
    if (processedFile.category === 'images' && currentAttachmentSettings.compressImages) {
        try {
            const compressedData = await compressImage(file);
            processedFile.data = compressedData.data;
            processedFile.size = compressedData.size;
            processedFile.isCompressed = true;
            console.log(`🗜️ تم ضغط ${file.name} من ${formatFileSize(file.size)} إلى ${formatFileSize(compressedData.size)}`);
        } catch (error) {
            console.error('خطأ في ضغط الصورة:', error);
            processedFile.data = await fileToBase64(file);
        }
    } else {
        processedFile.data = await fileToBase64(file);
    }
    
    // إنشاء معاينة مصغرة
    try {
        processedFile.thumbnail = await generateThumbnail(processedFile, file);
    } catch (error) {
        console.error('خطأ في إنشاء المعاينة:', error);
        processedFile.thumbnail = getDefaultThumbnail(processedFile.type);
    }
    
    return processedFile;
}

// ==============================
// ضغط الصور المحسن
// ==============================
async function compressImage(file) {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = function() {
            try {
                // حساب الأبعاد الجديدة
                const { width, height } = calculateNewDimensions(
                    img.width, 
                    img.height, 
                    currentAttachmentSettings.maxImageWidth, 
                    currentAttachmentSettings.maxImageHeight
                );
                
                canvas.width = width;
                canvas.height = height;
                
                // تحسين جودة الرسم
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                
                // رسم الصورة المضغوطة
                ctx.drawImage(img, 0, 0, width, height);
                
                // تحويل إلى Base64
                const compressedDataUrl = canvas.toDataURL(file.type, currentAttachmentSettings.imageQuality);
                
                // حساب الحجم الجديد
                const base64Data = compressedDataUrl.split(',')[1];
                const newSize = Math.round(base64Data.length * 0.75); // تقدير تقريبي
                
                resolve({
                    data: compressedDataUrl,
                    size: newSize
                });
                
            } catch (error) {
                reject(error);
            }
        };
        
        img.onerror = () => reject(new Error('فشل في تحميل الصورة'));
        img.src = URL.createObjectURL(file);
    });
}

// ==============================
// إنشاء المعاينات المصغرة المحسن
// ==============================
async function generateThumbnail(fileData, originalFile = null) {
    const category = fileData.category;
    
    if (category === 'images') {
        return await generateImageThumbnail(fileData, originalFile);
    } else {
        return generateDefaultThumbnail(fileData.type);
    }
}

async function generateImageThumbnail(fileData, originalFile) {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = function() {
            try {
                const size = 120; // حجم المعاينة المصغرة
                canvas.width = size;
                canvas.height = size;
                
                // حساب النسبة والموضع
                const scale = Math.min(size / img.width, size / img.height);
                const x = (size - img.width * scale) / 2;
                const y = (size - img.height * scale) / 2;
                
                // خلفية بيضاء
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, size, size);
                
                // رسم الصورة
                ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
                
                resolve(canvas.toDataURL('image/jpeg', 0.8));
            } catch (error) {
                console.error('خطأ في إنشاء معاينة الصورة:', error);
                resolve(generateDefaultThumbnail(fileData.type));
            }
        };
        
        img.onerror = () => {
            resolve(generateDefaultThumbnail(fileData.type));
        };
        
        // استخدام البيانات المضغوطة أو الأصلية
        if (fileData.data && fileData.data.startsWith('data:')) {
            img.src = fileData.data;
        } else if (originalFile) {
            img.src = URL.createObjectURL(originalFile);
        } else {
            resolve(generateDefaultThumbnail(fileData.type));
        }
    });
}

function generateDefaultThumbnail(fileType) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const size = 120;
    
    canvas.width = size;
    canvas.height = size;
    
    const typeInfo = getFileTypeInfo(fileType);
    
    // خلفية ملونة
    ctx.fillStyle = typeInfo.color || '#95a5a6';
    ctx.fillRect(0, 0, size, size);
    
    // أيقونة
    ctx.font = '40px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'white';
    ctx.fillText(typeInfo.icon || '📄', size/2, size/2 - 10);
    
    // امتداد الملف
    const extension = getFileExtension(fileType);
    ctx.font = '12px Arial';
    ctx.fillText(extension, size/2, size/2 + 25);
    
    return canvas.toDataURL('image/jpeg', 0.8);
}

// ==============================
// تحديث الواجهة المحسن
// ==============================
async function refreshAllViews() {
    try {
        // تحديث أيقونة الشريط الجانبي
        await updateSidebarIcon();
        
        // تحديث مدير المرفقات إذا كان مفتوحاً
        if (attachmentManager && attachmentManager.querySelector('.attachment-overlay.show')) {
            await refreshAttachmentManager();
        }
        
        // تحديث أزرار المرفقات في النماذج
        updateAttachmentButtons();
        
    } catch (error) {
        console.error('خطأ في تحديث الواجهة:', error);
    }
}

async function updateSidebarIcon() {
    try {
        const counts = await getAttachmentCounts();
        
        // تحديث العدادات
        updateElement('total-attachments-count', counts.total);
        updateElement('sayed-attachments-count', counts.sayed);
        updateElement('expenses-attachments-count', counts.expenses);
        updateElement('general-attachments-count', counts.general);
        
    } catch (error) {
        console.error('خطأ في تحديث أيقونة الشريط الجانبي:', error);
    }
}

async function getAttachmentCounts() {
    try {
        const metadata = Array.from(attachmentsCache.values());
        
        return {
            total: metadata.length,
            sayed: metadata.filter(f => f.caseType === 'سيد').length,
            expenses: metadata.filter(f => f.caseType === 'مصاريف').length,
            general: metadata.filter(f => f.caseType === 'عام').length
        };
    } catch (error) {
        return { total: 0, sayed: 0, expenses: 0, general: 0 };
    }
}

// ==============================
// معرض المرفقات المحسن
// ==============================
function openAttachmentGallery() {
    createAttachmentGallery('all');
}

function openAttachmentsByType(caseType) {
    createAttachmentGallery(caseType);
}

function createAttachmentGallery(filterType = 'all') {
    const gallery = document.createElement('div');
    gallery.id = 'attachment-gallery';
    gallery.innerHTML = `
        <div class="gallery-overlay">
            <div class="gallery-container">
                <div class="gallery-header">
                    <h3>📎 ${filterType === 'all' ? 'جميع المرفقات' : 'مرفقات ' + filterType}</h3>
                    <button class="gallery-close" onclick="closeAttachmentGallery()">✕</button>
                </div>
                <div class="gallery-content">
                    <div class="gallery-grid" id="gallery-grid">
                        <!-- المرفقات ستظهر هنا -->
                    </div>
                </div>
                <div class="gallery-footer">
                    <div class="gallery-stats" id="gallery-stats">جاري التحميل...</div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(gallery);
    
    // تحميل المرفقات
    loadGalleryContent(filterType);
    
    // إظهار المعرض
    setTimeout(() => {
        gallery.querySelector('.gallery-overlay').classList.add('show');
        document.body.style.overflow = 'hidden';
    }, 100);
}

async function loadGalleryContent(filterType) {
    try {
        const galleryGrid = document.getElementById('gallery-grid');
        const galleryStats = document.getElementById('gallery-stats');
        
        if (!galleryGrid) return;
        
        // جلب المرفقات
        let files = Array.from(attachmentsCache.values());
        
        if (filterType !== 'all') {
            files = files.filter(f => f.caseType === filterType);
        }
        
        // ترتيب حسب التاريخ (الأحدث أولاً)
        files.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
        
        if (files.length === 0) {
            galleryGrid.innerHTML = `
                <div class="gallery-empty">
                    <i class="fas fa-folder-open"></i>
                    <h4>لا توجد مرفقات</h4>
                    <p>${filterType === 'all' ? 'لم يتم رفع أي ملفات بعد' : 'لا توجد مرفقات لهذا النوع'}</p>
                </div>
            `;
        } else {
            galleryGrid.innerHTML = files.map(file => createGalleryItem(file)).join('');
        }
        
        // إحصائيات
        const totalSize = files.reduce((sum, f) => sum + f.size, 0);
        galleryStats.textContent = `${files.length} ملف • ${formatFileSize(totalSize)}`;
        
    } catch (error) {
        console.error('خطأ في تحميل معرض المرفقات:', error);
        const galleryGrid = document.getElementById('gallery-grid');
        if (galleryGrid) {
            galleryGrid.innerHTML = '<div class="gallery-error">حدث خطأ في تحميل المرفقات</div>';
        }
    }
}

function createGalleryItem(file) {
    const typeInfo = getFileTypeInfo(file.type);
    
    return `
        <div class="gallery-item" data-file-id="${file.id}">
            <div class="gallery-thumbnail" onclick="previewFile('${file.id}')">
                ${file.thumbnail ? 
                    `<img src="${file.thumbnail}" alt="${file.name}">` : 
                    `<div class="default-thumb" style="background: ${typeInfo.color}">${typeInfo.icon}</div>`
                }
                <div class="file-type-badge" style="background: ${typeInfo.color}">
                    ${getFileExtension(file.type)}
                </div>
            </div>
            <div class="gallery-info">
                <div class="file-name" title="${file.name}">${truncateText(file.name, 20)}</div>
                <div class="file-meta">
                    <span class="file-size">${formatFileSize(file.size)}</span>
                    <span class="case-type">${file.caseType}</span>
                </div>
                <div class="file-date">${formatRelativeDate(file.uploadDate)}</div>
            </div>
            <div class="gallery-actions">
                <button class="action-btn" onclick="downloadFile('${file.id}')" title="تحميل">
                    <i class="fas fa-download"></i>
                </button>
                <button class="action-btn delete-btn" onclick="deleteFileFromGallery('${file.id}')" title="حذف">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;
}

function closeAttachmentGallery() {
    const gallery = document.getElementById('attachment-gallery');
    if (gallery) {
        gallery.querySelector('.gallery-overlay').classList.remove('show');
        document.body.style.overflow = 'auto';
        setTimeout(() => {
            document.body.removeChild(gallery);
        }, 300);
    }
}

// ==============================
// حذف الملفات المحسن
// ==============================
async function deleteFileFromGallery(fileId) {
    const file = attachmentsCache.get(fileId);
    if (!file) return;
    
    if (confirm(`هل أنت متأكد من حذف الملف "${file.name}"؟`)) {
        try {
            await deleteFileFromDatabase(fileId);
            
            // إزالة من الكاش
            attachmentsCache.delete(fileId);
            
            // تحديث المعرض
            const filterType = getCurrentGalleryFilter();
            await loadGalleryContent(filterType);
            
            // تحديث الواجهة
            await refreshAllViews();
            
            showAttachmentToast(`تم حذف ${file.name}`, 'success');
            
        } catch (error) {
            console.error('خطأ في حذف الملف:', error);
            showAttachmentToast('فشل في حذف الملف', 'error');
        }
    }
}

async function deleteFileFromDatabase(fileId) {
    if (!attachmentDatabase.db) {
        throw new Error('قاعدة البيانات غير متاحة');
    }
    
    const transaction = attachmentDatabase.db.transaction(['files', 'metadata', 'thumbnails', 'cases'], 'readwrite');
    
    // حذف من جميع المتاجر
    await Promise.all([
        deleteFromStore(transaction.objectStore('files'), fileId),
        deleteFromStore(transaction.objectStore('metadata'), fileId),
        deleteFromStore(transaction.objectStore('thumbnails'), fileId)
    ]);
    
    // تحديث معلومات الحالة
    const file = attachmentsCache.get(fileId);
    if (file && file.caseId) {
        const casesStore = transaction.objectStore('cases');
        const caseData = await getCaseFromDB(file.caseId);
        if (caseData) {
            caseData.files = caseData.files.filter(id => id !== fileId);
            caseData.totalSize = Math.max(0, (caseData.totalSize || 0) - file.size);
            caseData.lastUpdate = new Date().toISOString();
            
            await new Promise((resolve, reject) => {
                const request = casesStore.put(caseData);
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        }
    }
}

function deleteFromStore(store, id) {
    return new Promise((resolve, reject) => {
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

// ==============================
// معاينة الملفات المحسنة
// ==============================
async function previewFile(fileId) {
    try {
        const file = await getFileFromDatabase(fileId);
        if (!file) {
            showAttachmentToast('الملف غير موجود', 'error');
            return;
        }
        
        if (file.category === 'images') {
            createImageViewer(file);
        } else {
            createFileViewer(file);
        }
        
    } catch (error) {
        console.error('خطأ في معاينة الملف:', error);
        showAttachmentToast('فشل في معاينة الملف', 'error');
    }
}

async function getFileFromDatabase(fileId) {
    if (!attachmentDatabase.db) return null;
    
    try {
        const transaction = attachmentDatabase.db.transaction(['files', 'metadata'], 'readonly');
        
        // جلب البيانات الوصفية
        const metadata = await new Promise((resolve, reject) => {
            const request = transaction.objectStore('metadata').get(fileId);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
        
        if (!metadata) return null;
        
        // جلب بيانات الملف
        const fileData = await new Promise((resolve, reject) => {
            const request = transaction.objectStore('files').get(fileId);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
        
        return { ...metadata, data: fileData?.data };
        
    } catch (error) {
        console.error('خطأ في جلب الملف:', error);
        return null;
    }
}

function createImageViewer(file) {
    const viewer = document.createElement('div');
    viewer.id = 'image-viewer';
    viewer.innerHTML = `
        <div class="viewer-overlay">
            <div class="viewer-container">
                <div class="viewer-header">
                    <h3>${file.name}</h3>
                    <button class="viewer-close" onclick="closeImageViewer()">✕</button>
                </div>
                <div class="viewer-content">
                    <img src="${file.data}" alt="${file.name}" class="viewer-image">
                </div>
                <div class="viewer-footer">
                    <div class="image-info">
                        <span>${formatFileSize(file.size)}</span>
                        <span>•</span>
                        <span>${file.caseType}</span>
                        <span>•</span>
                        <span>${formatRelativeDate(file.uploadDate)}</span>
                    </div>
                    <div class="viewer-actions">
                        <button class="viewer-btn" onclick="downloadFile('${file.id}')">
                            <i class="fas fa-download"></i> تحميل
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(viewer);
    
    setTimeout(() => {
        viewer.querySelector('.viewer-overlay').classList.add('show');
        document.body.style.overflow = 'hidden';
    }, 100);
}

function closeImageViewer() {
    const viewer = document.getElementById('image-viewer');
    if (viewer) {
        viewer.querySelector('.viewer-overlay').classList.remove('show');
        document.body.style.overflow = 'auto';
        setTimeout(() => {
            document.body.removeChild(viewer);
        }, 300);
    }
}

// ==============================
// تحميل الملفات المحسن
// ==============================
async function downloadFile(fileId) {
    try {
        const file = await getFileFromDatabase(fileId);
        if (!file) {
            showAttachmentToast('الملف غير موجود', 'error');
            return;
        }
        
        // إنشاء رابط التحميل
        const link = document.createElement('a');
        link.href = file.data;
        link.download = file.name;
        link.click();
        
        showAttachmentToast(`تم تحميل ${file.name}`, 'success');
        
    } catch (error) {
        console.error('خطأ في تحميل الملف:', error);
        showAttachmentToast('فشل في تحميل الملف', 'error');
    }
}

// ==============================
// الحفظ التلقائي المحسن
// ==============================
function startAutoSave() {
    if (!currentAttachmentSettings.autoSave) return;
    
    setInterval(async () => {
        try {
            await saveSettingsToStorage();
            console.log('💾 تم الحفظ التلقائي للإعدادات');
        } catch (error) {
            console.error('خطأ في الحفظ التلقائي:', error);
        }
    }, currentAttachmentSettings.saveInterval);
}

async function saveSettingsToStorage() {
    try {
        const settings = {
            ...currentAttachmentSettings,
            lastSave: new Date().toISOString()
        };
        
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
        return true;
    } catch (error) {
        console.error('خطأ في حفظ الإعدادات:', error);
        return false;
    }
}

async function loadAttachmentSettings() {
    try {
        const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
        if (saved) {
            const settings = JSON.parse(saved);
            currentAttachmentSettings = { ...DEFAULT_ATTACHMENT_SETTINGS, ...settings };
        }
    } catch (error) {
        console.error('خطأ في تحميل الإعدادات:', error);
    }
}

// ==============================
// البديل للتخزين العادي
// ==============================
async function fallbackToLocalStorage() {
    console.log('⚠️ التحول للتخزين العادي كبديل...');
    
    try {
        currentAttachmentSettings.useIndexedDB = false;
        
        // محاولة تحميل البيانات من التخزين العادي
        const savedData = localStorage.getItem('charity_attachments_fallback');
        if (savedData) {
            const data = JSON.parse(savedData);
            for (const [id, file] of Object.entries(data.files || {})) {
                attachmentsCache.set(id, file);
            }
        }
        
        // إعداد حفظ بديل
        window.addEventListener('beforeunload', saveFallbackData);
        
        console.log('✅ تم التحول للتخزين البديل بنجاح');
        
    } catch (error) {
        console.error('❌ فشل في التحول للتخزين البديل:', error);
    }
}

function saveFallbackData() {
    try {
        const data = {
            files: Object.fromEntries(attachmentsCache),
            timestamp: new Date().toISOString()
        };
        
        localStorage.setItem('charity_attachments_fallback', JSON.stringify(data));
    } catch (error) {
        console.error('خطأ في حفظ البيانات البديلة:', error);
    }
}

// ==============================
// وظائف مساعدة محسنة
// ==============================
function validateFile(file) {
    // التحقق من الحجم
    if (file.size > currentAttachmentSettings.maxFileSize) {
        showAttachmentToast(`الملف "${file.name}" كبير جداً (${formatFileSize(file.size)})`, 'error');
        return false;
    }
    
    // التحقق من النوع
    if (!currentAttachmentSettings.allowedFileTypes.includes(file.type)) {
        showAttachmentToast(`نوع الملف "${file.name}" غير مدعوم`, 'error');
        return false;
    }
    
    return true;
}

function getFileCategory(mimeType) {
    if (mimeType.startsWith('image/')) return 'images';
    if (mimeType === 'application/pdf') return 'pdf';
    if (mimeType.includes('word')) return 'word';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'excel';
    return 'other';
}

function getFileTypeInfo(mimeType) {
    const category = getFileCategory(mimeType);
    const types = {
        images: { icon: '🖼️', color: '#3498db' },
        pdf: { icon: '📄', color: '#e74c3c' },
        word: { icon: '📝', color: '#2980b9' },
        excel: { icon: '📊', color: '#27ae60' },
        other: { icon: '📁', color: '#95a5a6' }
    };
    return types[category] || types.other;
}

function getFileExtension(mimeType) {
    const extensions = {
        'image/jpeg': 'JPG',
        'image/png': 'PNG',
        'image/gif': 'GIF',
        'application/pdf': 'PDF',
        'application/msword': 'DOC',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
        'text/plain': 'TXT'
    };
    return extensions[mimeType] || 'FILE';
}

function formatFileSize(bytes) {
    if (!bytes) return '0 بايت';
    const sizes = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

function formatRelativeDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'منذ لحظات';
    if (diff < 3600000) return `منذ ${Math.floor(diff / 60000)} دقيقة`;
    if (diff < 86400000) return `منذ ${Math.floor(diff / 3600000)} ساعة`;
    if (diff < 604800000) return `منذ ${Math.floor(diff / 86400000)} يوم`;
    
    return date.toLocaleDateString('ar-EG');
}

function truncateText(text, maxLength) {
    if (!text || text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
}

function generateFileId() {
    return 'file_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

async function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

function calculateNewDimensions(originalWidth, originalHeight, maxWidth, maxHeight) {
    let width = originalWidth;
    let height = originalHeight;
    
    if (width > maxWidth || height > maxHeight) {
        const aspectRatio = width / height;
        
        if (width > height) {
            width = maxWidth;
            height = width / aspectRatio;
        } else {
            height = maxHeight;
            width = height * aspectRatio;
        }
    }
    
    return { width: Math.round(width), height: Math.round(height) };
}

function updateElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
}

function getCurrentGalleryFilter() {
    const gallery = document.getElementById('attachment-gallery');
    if (!gallery) return 'all';
    
    const title = gallery.querySelector('.gallery-header h3').textContent;
    if (title.includes('السيد')) return 'سيد';
    if (title.includes('المصاريف')) return 'مصاريف';
    if (title.includes('العامة') || title.includes('عام')) return 'عام';
    return 'all';
}

async function getCaseFromDB(caseId) {
    if (!attachmentDatabase.db) return null;
    
    try {
        const transaction = attachmentDatabase.db.transaction(['cases'], 'readonly');
        const store = transaction.objectStore('cases');
        
        return new Promise((resolve, reject) => {
            const request = store.get(caseId);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        return null;
    }
}

// ==============================
// شريط التقدم المحسن
// ==============================
function showUploadProgress() {
    const progress = document.createElement('div');
    progress.id = 'upload-progress-enhanced';
    progress.innerHTML = `
        <div class="progress-overlay">
            <div class="progress-container">
                <div class="progress-header">
                    <h4>📤 جاري رفع الملفات</h4>
                    <div class="progress-spinner"></div>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: 0%"></div>
                </div>
                <div class="progress-text">بدء الرفع...</div>
                <div class="progress-details">
                    <span id="progress-percentage">0%</span>
                    <span id="progress-status">جاري التحضير...</span>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(progress);
}

function updateUploadProgress(percentage, status = '') {
    const progressFill = document.querySelector('#upload-progress-enhanced .progress-fill');
    const progressText = document.querySelector('#upload-progress-enhanced .progress-text');
    const progressPercentage = document.getElementById('progress-percentage');
    const progressStatus = document.getElementById('progress-status');
    
    if (progressFill) {
        progressFill.style.width = Math.round(percentage) + '%';
    }
    
    if (progressPercentage) {
        progressPercentage.textContent = Math.round(percentage) + '%';
    }
    
    if (status) {
        if (progressText) progressText.textContent = status;
        if (progressStatus) progressStatus.textContent = status;
    }
}

function hideUploadProgress() {
    const progress = document.getElementById('upload-progress-enhanced');
    if (progress) {
        setTimeout(() => {
            if (document.body.contains(progress)) {
                document.body.removeChild(progress);
            }
        }, 1000);
    }
}

// ==============================
// الإشعارات المحسنة
// ==============================
function showAttachmentToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `attachment-toast ${type}`;
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fas ${icons[type] || icons.info}"></i>
        </div>
        <div class="toast-message">${message}</div>
        <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;
    
    document.body.appendChild(toast);
    
    // إظهار الإشعار
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    // إخفاء الإشعار تلقائياً
    setTimeout(() => {
        if (document.body.contains(toast)) {
            toast.classList.remove('show');
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }
    }, 4000);
}

// ==============================
// أزرار المرفقات للنماذج
// ==============================
function addAttachmentButtons() {
    const forms = document.querySelectorAll('.form-container, .content-header');
    forms.forEach(form => {
        if (!form.querySelector('.attachment-quick-btn')) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'attachment-quick-btn';
            btn.innerHTML = `
                <i class="fas fa-paperclip"></i>
                <span>مرفقات</span>
                <span class="attachment-count">0</span>
            `;
            
            btn.onclick = () => {
                const fileInput = document.createElement('input');
                fileInput.type = 'file';
                fileInput.multiple = true;
                fileInput.accept = currentAttachmentSettings.allowedFileTypes.join(',');
                fileInput.onchange = (e) => handleFileUpload([...e.target.files]);
                fileInput.click();
            };
            
            form.appendChild(btn);
        }
    });
}

function updateAttachmentButtons() {
    const buttons = document.querySelectorAll('.attachment-quick-btn .attachment-count');
    const currentCase = getCurrentCaseInfo();
    const caseFiles = Array.from(attachmentsCache.values()).filter(f => f.caseId === currentCase.id);
    
    buttons.forEach(btn => {
        btn.textContent = caseFiles.length;
    });
}

// ==============================
// إعداد مستمعي الأحداث
// ==============================
function setupAttachmentEventListeners() {
    // إعداد السحب والإفلات للصفحة كاملة
    document.addEventListener('dragover', (e) => {
        e.preventDefault();
        document.body.classList.add('drag-over-page');
    });
    
    document.addEventListener('dragleave', (e) => {
        if (!e.relatedTarget) {
            document.body.classList.remove('drag-over-page');
        }
    });
    
    document.addEventListener('drop', (e) => {
        e.preventDefault();
        document.body.classList.remove('drag-over-page');
        
        const files = [...e.dataTransfer.files];
        if (files.length > 0) {
            handleFileUpload(files);
        }
    });
    
    // اختصارات لوحة المفاتيح
    document.addEventListener('keydown', (e) => {
        // Ctrl + U لرفع ملفات
        if (e.ctrlKey && e.key === 'u') {
            e.preventDefault();
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.multiple = true;
            fileInput.accept = currentAttachmentSettings.allowedFileTypes.join(',');
            fileInput.onchange = (e) => handleFileUpload([...e.target.files]);
            fileInput.click();
        }
        
        // Ctrl + G لفتح المعرض
        if (e.ctrlKey && e.key === 'g') {
            e.preventDefault();
            openAttachmentGallery();
        }
    });
}

// ==============================
// إضافة الأنماط المحسنة
// ==============================
function addAttachmentStyles() {
    if (document.getElementById('attachment-styles-enhanced')) return;
    
    const styles = document.createElement('style');
    styles.id = 'attachment-styles-enhanced';
    styles.textContent = `
        /* أزرار المرفقات السريعة */
        .attachment-quick-btn {
            background: linear-gradient(135deg, #3498db, #2980b9);
            color: white;
            border: none;
            padding: 8px 12px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 12px;
            display: inline-flex;
            align-items: center;
            gap: 5px;
            margin: 5px;
            transition: all 0.3s ease;
            position: relative;
        }
        
        .attachment-quick-btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 3px 10px rgba(52, 152, 219, 0.3);
        }
        
        .attachment-count {
            background: rgba(255, 255, 255, 0.2);
            padding: 2px 6px;
            border-radius: 10px;
            font-size: 10px;
            min-width: 16px;
            text-align: center;
        }
        
        /* قسم المرفقات في الشريط الجانبي */
        .attachment-nav-item {
            background: linear-gradient(135deg, #3498db, #2980b9);
            color: white !important;
            margin: 5px 0;
            border-radius: 8px;
        }
        
        .attachment-nav-item:hover {
            background: linear-gradient(135deg, #2980b9, #3498db);
        }
        
        /* معرض المرفقات */
        .gallery-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.8);
            z-index: 10000;
            display: flex;
            justify-content: center;
            align-items: center;
            opacity: 0;
            transition: opacity 0.3s ease;
        }
        
        .gallery-overlay.show {
            opacity: 1;
        }
        
        .gallery-container {
            background: white;
            border-radius: 12px;
            width: 90%;
            max-width: 1000px;
            height: 80%;
            max-height: 600px;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            transform: scale(0.9);
            transition: transform 0.3s ease;
        }
        
        .gallery-overlay.show .gallery-container {
            transform: scale(1);
        }
        
        .gallery-header {
            background: linear-gradient(135deg, #3498db, #2980b9);
            color: white;
            padding: 15px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .gallery-header h3 {
            margin: 0;
            font-size: 18px;
        }
        
        .gallery-close {
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
        }
        
        .gallery-content {
            flex: 1;
            overflow-y: auto;
            padding: 20px;
        }
        
        .gallery-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
            gap: 15px;
        }
        
        .gallery-item {
            background: white;
            border: 1px solid #e3e6f0;
            border-radius: 8px;
            overflow: hidden;
            transition: all 0.3s ease;
        }
        
        .gallery-item:hover {
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
            transform: translateY(-2px);
        }
        
        .gallery-thumbnail {
            position: relative;
            height: 120px;
            background: #f8f9fa;
            cursor: pointer;
            overflow: hidden;
        }
        
        .gallery-thumbnail img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        
        .default-thumb {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 40px;
            color: white;
        }
        
        .file-type-badge {
            position: absolute;
            top: 5px;
            right: 5px;
            color: white;
            padding: 2px 6px;
            border-radius: 10px;
            font-size: 10px;
            font-weight: bold;
        }
        
        .gallery-info {
            padding: 10px;
        }
        
        .file-name {
            font-weight: 600;
            font-size: 12px;
            color: #2c3e50;
            margin-bottom: 5px;
        }
        
        .file-meta {
            display: flex;
            justify-content: space-between;
            font-size: 10px;
            color: #6c757d;
            margin-bottom: 3px;
        }
        
        .case-type {
            background: rgba(52, 152, 219, 0.1);
            color: #3498db;
            padding: 1px 4px;
            border-radius: 3px;
        }
        
        .file-date {
            font-size: 10px;
            color: #95a5a6;
        }
        
        .gallery-actions {
            padding: 8px 10px;
            background: #f8f9fa;
            display: flex;
            justify-content: space-between;
        }
        
        .action-btn {
            background: #e3e6f0;
            border: none;
            color: #6c757d;
            width: 25px;
            height: 25px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 10px;
            transition: all 0.3s ease;
        }
        
        .action-btn:hover {
            background: #d6d8db;
            color: #495057;
        }
        
        .delete-btn:hover {
            background: #e74c3c;
            color: white;
        }
        
        .gallery-footer {
            background: #f8f9fa;
            padding: 10px 20px;
            border-top: 1px solid #e3e6f0;
            text-align: center;
            font-size: 12px;
            color: #6c757d;
        }
        
        .gallery-empty {
            text-align: center;
            padding: 40px;
            color: #6c757d;
        }
        
        .gallery-empty i {
            font-size: 48px;
            color: #bdc3c7;
            margin-bottom: 15px;
        }
        
        .gallery-error {
            text-align: center;
            padding: 40px;
            color: #e74c3c;
        }
        
        /* عارض الصور */
        .viewer-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.9);
            z-index: 10001;
            display: flex;
            flex-direction: column;
            opacity: 0;
            transition: opacity 0.3s ease;
        }
        
        .viewer-overlay.show {
            opacity: 1;
        }
        
        .viewer-header {
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 15px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .viewer-close {
            background: rgba(255, 255, 255, 0.2);
            border: none;
            color: white;
            width: 35px;
            height: 35px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 18px;
        }
        
        .viewer-content {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        .viewer-image {
            max-width: 100%;
            max-height: 100%;
            border-radius: 8px;
            box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
        }
        
        .viewer-footer {
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 15px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .image-info {
            font-size: 14px;
        }
        
        .viewer-btn {
            background: #3498db;
            color: white;
            border: none;
            padding: 8px 15px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
        }
        
        /* شريط التقدم المحسن */
        .progress-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.8);
            z-index: 10002;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .progress-container {
            background: white;
            padding: 30px;
            border-radius: 12px;
            width: 400px;
            max-width: 90%;
        }
        
        .progress-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 20px;
        }
        
        .progress-header h4 {
            margin: 0;
            color: #2c3e50;
        }
        
        .progress-spinner {
            width: 20px;
            height: 20px;
            border: 2px solid #e3e6f0;
            border-top: 2px solid #3498db;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .progress-bar {
            width: 100%;
            height: 10px;
            background: #e3e6f0;
            border-radius: 5px;
            overflow: hidden;
            margin-bottom: 15px;
        }
        
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #3498db, #2980b9);
            transition: width 0.3s ease;
        }
        
        .progress-text {
            font-size: 14px;
            color: #2c3e50;
            margin-bottom: 10px;
        }
        
        .progress-details {
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            color: #6c757d;
        }
        
        /* الإشعارات المحسنة */
        .attachment-toast {
            position: fixed;
            top: 20px;
            right: 20px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
            z-index: 10003;
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 12px 15px;
            max-width: 400px;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            border-left: 4px solid #3498db;
        }
        
        .attachment-toast.show {
            transform: translateX(0);
        }
        
        .attachment-toast.success {
            border-left-color: #27ae60;
        }
        
        .attachment-toast.success .toast-icon {
            color: #27ae60;
        }
        
        .attachment-toast.error {
            border-left-color: #e74c3c;
        }
        
        .attachment-toast.error .toast-icon {
            color: #e74c3c;
        }
        
        .attachment-toast.warning {
            border-left-color: #f39c12;
        }
        
        .attachment-toast.warning .toast-icon {
            color: #f39c12;
        }
        
        .toast-icon {
            font-size: 16px;
            color: #3498db;
        }
        
        .toast-message {
            flex: 1;
            font-size: 14px;
            color: #2c3e50;
        }
        
        .toast-close {
            background: none;
            border: none;
            color: #6c757d;
            cursor: pointer;
            font-size: 16px;
            padding: 0;
            width: 20px;
            height: 20px;
        }
        
        /* تأثير السحب والإفلات للصفحة */
        body.drag-over-page {
            background: rgba(52, 152, 219, 0.1);
        }
        
        body.drag-over-page::after {
            content: '📎 اسحب الملفات هنا للرفع';
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(52, 152, 219, 0.9);
            color: white;
            padding: 20px 30px;
            border-radius: 10px;
            font-size: 18px;
            font-weight: bold;
            z-index: 9999;
            pointer-events: none;
        }
        
        /* تحسينات للهواتف */
        @media (max-width: 768px) {
            .gallery-container {
                width: 95%;
                height: 90%;
            }
            
            .gallery-grid {
                grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
                gap: 10px;
            }
            
            .gallery-item {
                font-size: 11px;
            }
            
            .gallery-thumbnail {
                height: 100px;
            }
            
            .progress-container {
                width: 90%;
                padding: 20px;
            }
            
            .attachment-toast {
                right: 10px;
                left: 10px;
                max-width: none;
            }
            
            .viewer-content {
                padding: 10px;
            }
        }
    `;
    
    document.head.appendChild(styles);
}

// ==============================
// تهيئة النظام عند تحميل الصفحة
// ==============================
document.addEventListener('DOMContentLoaded', function() {
    // إضافة الأنماط فوراً
    addAttachmentStyles();
    
    // تأخير التهيئة قليلاً للسماح للنظام الرئيسي بالتحميل
    setTimeout(async () => {
        await initializeAttachmentSystem();
    }, 2500);
});

// ==============================
// إتاحة الوظائف عالمياً
// ==============================
window.attachmentSystem = {
    open: openAttachmentGallery,
    openByType: openAttachmentsByType,
    upload: handleFileUpload,
    download: downloadFile,
    preview: previewFile,
    delete: deleteFileFromGallery,
    isReady: () => isInitialized,
    settings: currentAttachmentSettings,
    cache: attachmentsCache
};

// ==============================
// معالج الأخطاء العام
// ==============================
window.addEventListener('error', function(e) {
    if (e.filename && e.filename.includes('attachments-manager')) {
        console.error('❌ خطأ في نظام المرفقات:', e.error);
        showAttachmentToast('حدث خطأ في نظام المرفقات', 'error');
    }
});

console.log('🎉 تم تحميل نظام إدارة المرفقات المحسن بنجاح!');
console.log('📎 استخدم Ctrl+U لرفع ملفات سريع');
console.log('🖼️ استخدم Ctrl+G لفتح معرض المرفقات');
