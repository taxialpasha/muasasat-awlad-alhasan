/**
 * نظام إدارة المرفقات والوثائق المحسن
 * إصلاح مشكلة اختفاء المرفقات وربطها بالحالات
 * مع ضمان الحفظ المحلي الصحيح
 * 
 * الاستخدام: قم بتضمين هذا الملف في HTML الخاص بك
 * <script src="enhanced-attachments.js"></script>
 */

// ==============================
// إعدادات النظام المحسنة
// ==============================
const ENHANCED_ATTACHMENT_SETTINGS = {
    // إعدادات التخزين المحسنة
    maxFileSize: 50 * 1024 * 1024, // 50MB
    maxTotalStorage: 500 * 1024 * 1024, // 500MB
    compressionQuality: 0.8,
    enableCompression: true,
    
    // إعدادات ربط المرفقات بالحالات
    caseLinkingMethod: 'multiple', // 'formNumber', 'fullName', 'phone', 'multiple'
    enableAutoLink: true, // ربط تلقائي عند حفظ الحالة
    enableMultipleIds: true, // استخدام معرفات متعددة للربط
    
    // أنواع الملفات المدعومة
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    allowedDocumentTypes: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain'
    ],
    
    // إعدادات العرض
    thumbnailSize: 150,
    showPreview: true,
    showFileInfo: true,
    gridView: true,
    
    // إعدادات النسخ الاحتياطي المحسنة
    autoBackup: true,
    backupFrequency: 'immediate', // فوري عند كل تغيير
    keepBackupDays: 30,
    enableIntegrityCheck: true // فحص سلامة البيانات
};

// ==============================
// متغيرات النظام المحسنة
// ==============================
let enhancedAttachmentSettings = { ...ENHANCED_ATTACHMENT_SETTINGS };
let attachmentsDB = null;
let enhancedAttachmentPanel = null;
let caseAttachmentButtons = new Map();
let currentCaseData = null;

// قواعد البيانات المحسنة
const ENHANCED_DB_NAME = 'CharityEnhancedAttachmentsDB';
const ENHANCED_DB_VERSION = 2;
const ATTACHMENTS_STORE = 'attachments';
const CASES_STORE = 'cases';
const LINKS_STORE = 'case_attachment_links';
const BACKUP_STORE = 'backups';

// ==============================
// تهيئة النظام المحسن
// ==============================
async function initializeEnhancedAttachmentSystem() {
    try {
        console.log('🗂️ جاري تهيئة نظام المرفقات المحسن...');
        
        // تحميل الإعدادات
        loadEnhancedAttachmentSettings();
        
        // تهيئة قاعدة البيانات المحسنة
        await initializeEnhancedDB();
        
        // إضافة أزرار المرفقات المحسنة
        addEnhancedAttachmentButtons();
        
        // إنشاء لوحة التحكم المحسنة
        createEnhancedAttachmentPanel();
        
        // إضافة الأنماط المحسنة
        addEnhancedAttachmentStyles();
        
        // إعداد المستمعين المحسنين
        setupEnhancedEventListeners();
        
        // ربط مع نظام حفظ الحالات الرئيسي
        integrateWithMainSystem();
        
        // تحديث إحصائيات التخزين
        updateEnhancedStorageStats();
        
        console.log('✅ تم تهيئة نظام المرفقات المحسن بنجاح');
        showEnhancedToast('🗂️ نظام المرفقات المحسن جاهز مع الحفظ المضمون!', 'success');
        
    } catch (error) {
        console.error('❌ خطأ في تهيئة النظام المحسن:', error);
        showEnhancedToast('فشل في تهيئة نظام المرفقات المحسن', 'error');
    }
}

// ==============================
// تهيئة قاعدة البيانات المحسنة
// ==============================
function initializeEnhancedDB() {
    return new Promise((resolve, reject) => {
        // حذف قاعدة البيانات القديمة إذا كانت موجودة
        const deleteRequest = indexedDB.deleteDatabase('CharityAttachmentsDB');
        
        deleteRequest.onsuccess = () => {
            console.log('تم حذف قاعدة البيانات القديمة');
            createNewEnhancedDB();
        };
        
        deleteRequest.onerror = () => {
            console.log('لا توجد قاعدة بيانات قديمة للحذف');
            createNewEnhancedDB();
        };
        
        function createNewEnhancedDB() {
            const request = indexedDB.open(ENHANCED_DB_NAME, ENHANCED_DB_VERSION);
            
            request.onerror = () => reject(new Error('فشل في فتح قاعدة البيانات المحسنة'));
            
            request.onsuccess = (event) => {
                attachmentsDB = event.target.result;
                console.log('✅ تم فتح قاعدة البيانات المحسنة بنجاح');
                resolve(attachmentsDB);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                console.log('🔄 جاري إنشاء هيكل قاعدة البيانات المحسنة...');
                
                // إنشاء متجر المرفقات المحسن
                if (!db.objectStoreNames.contains(ATTACHMENTS_STORE)) {
                    const attachmentsStore = db.createObjectStore(ATTACHMENTS_STORE, { keyPath: 'id' });
                    attachmentsStore.createIndex('caseId', 'caseId', { unique: false });
                    attachmentsStore.createIndex('formNumber', 'formNumber', { unique: false });
                    attachmentsStore.createIndex('fullName', 'fullName', { unique: false });
                    attachmentsStore.createIndex('phone', 'phone', { unique: false });
                    attachmentsStore.createIndex('type', 'type', { unique: false });
                    attachmentsStore.createIndex('uploadDate', 'uploadDate', { unique: false });
                    attachmentsStore.createIndex('checksum', 'checksum', { unique: false });
                    console.log('✅ تم إنشاء متجر المرفقات');
                }
                
                // إنشاء متجر الحالات
                if (!db.objectStoreNames.contains(CASES_STORE)) {
                    const casesStore = db.createObjectStore(CASES_STORE, { keyPath: 'id' });
                    casesStore.createIndex('formNumber', 'formNumber', { unique: false });
                    casesStore.createIndex('fullName', 'fullName', { unique: false });
                    casesStore.createIndex('phone', 'phone', { unique: false });
                    casesStore.createIndex('createdAt', 'createdAt', { unique: false });
                    console.log('✅ تم إنشاء متجر الحالات');
                }
                
                // إنشاء متجر الروابط
                if (!db.objectStoreNames.contains(LINKS_STORE)) {
                    const linksStore = db.createObjectStore(LINKS_STORE, { keyPath: 'id' });
                    linksStore.createIndex('caseId', 'caseId', { unique: false });
                    linksStore.createIndex('attachmentId', 'attachmentId', { unique: false });
                    linksStore.createIndex('formNumber', 'formNumber', { unique: false });
                    linksStore.createIndex('fullName', 'fullName', { unique: false });
                    linksStore.createIndex('phone', 'phone', { unique: false });
                    console.log('✅ تم إنشاء متجر الروابط');
                }
                
                // إنشاء متجر النسخ الاحتياطية
                if (!db.objectStoreNames.contains(BACKUP_STORE)) {
                    const backupStore = db.createObjectStore(BACKUP_STORE, { keyPath: 'id' });
                    backupStore.createIndex('timestamp', 'timestamp', { unique: false });
                    backupStore.createIndex('type', 'type', { unique: false });
                    console.log('✅ تم إنشاء متجر النسخ الاحتياطية');
                }
            };
        }
    });
}

// ==============================
// ربط مع النظام الرئيسي المحسن
// ==============================
function integrateWithMainSystem() {
    // ربط مع وظيفة حفظ النماذج الرئيسية
    const originalSaveForm = window.saveForm;
    
    if (originalSaveForm) {
        window.saveForm = async function() {
            try {
                // حفظ النموذج الأصلي أولاً
                const result = await originalSaveForm.call(this);
                
                // ربط المرفقات بالحالة المحفوظة
                await linkAttachmentsToSavedCase();
                
                return result;
            } catch (error) {
                console.error('خطأ في حفظ النموذج المحسن:', error);
                throw error;
            }
        };
        
        console.log('✅ تم ربط النظام مع وظيفة الحفظ الرئيسية');
    }
    
    // مراقبة تغييرات النماذج
    observeFormChanges();
}

// ==============================
// ربط المرفقات بالحالات المحفوظة
// ==============================
async function linkAttachmentsToSavedCase() {
    try {
        const formData = getEnhancedFormData();
        
        if (!formData.fullName && !formData.formNumber && !formData.phoneFirst) {
            console.log('لا توجد بيانات كافية لربط المرفقات');
            return;
        }
        
        // إنشاء معرفات متعددة للحالة
        const caseIds = generateCaseIds(formData);
        
        // حفظ بيانات الحالة
        await saveCaseData(formData, caseIds);
        
        // ربط المرفقات الموجودة
        await linkExistingAttachments(caseIds, formData);
        
        // تحديث أزرار المرفقات
        updateAttachmentButtonsCounts();
        
        console.log('✅ تم ربط المرفقات بالحالة المحفوظة');
        showEnhancedToast('تم ربط المرفقات بالحالة بنجاح', 'success');
        
    } catch (error) {
        console.error('❌ خطأ في ربط المرفقات:', error);
        showEnhancedToast('خطأ في ربط المرفقات بالحالة', 'error');
    }
}

// ==============================
// إنشاء معرفات الحالة المتعددة
// ==============================
function generateCaseIds(formData) {
    const ids = {
        primary: null,
        formNumber: formData.formNumber ? `form_${formData.formNumber}` : null,
        fullName: formData.fullName ? `name_${formData.fullName.replace(/\s+/g, '_')}` : null,
        phone: formData.phoneFirst ? `phone_${formData.phoneFirst}` : null,
        combined: null
    };
    
    // إنشاء معرف مدمج
    if (formData.formNumber && formData.fullName) {
        ids.combined = `case_${formData.formNumber}_${formData.fullName.replace(/\s+/g, '_')}`;
        ids.primary = ids.combined;
    } else if (formData.formNumber) {
        ids.primary = ids.formNumber;
    } else if (formData.fullName) {
        ids.primary = ids.fullName;
    } else if (formData.phoneFirst) {
        ids.primary = ids.phone;
    }
    
    // إضافة timestamp للتفرد
    if (ids.primary) {
        ids.primary += `_${Date.now()}`;
    }
    
    return ids;
}

// ==============================
// حفظ بيانات الحالة
// ==============================
async function saveCaseData(formData, caseIds) {
    const caseData = {
        id: caseIds.primary,
        formNumber: formData.formNumber,
        fullName: formData.fullName,
        phone: formData.phoneFirst,
        data: formData,
        caseIds: caseIds,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    return new Promise((resolve, reject) => {
        const transaction = attachmentsDB.transaction([CASES_STORE], 'readwrite');
        const store = transaction.objectStore(CASES_STORE);
        const request = store.put(caseData);
        
        request.onsuccess = () => {
            console.log('✅ تم حفظ بيانات الحالة');
            resolve(caseData);
        };
        
        request.onerror = () => {
            console.error('❌ فشل في حفظ بيانات الحالة');
            reject(new Error('فشل في حفظ بيانات الحالة'));
        };
    });
}

// ==============================
// ربط المرفقات الموجودة
// ==============================
async function linkExistingAttachments(caseIds, formData) {
    try {
        // البحث عن المرفقات غير المربوطة
        const unlinkedAttachments = await getUnlinkedAttachments();
        
        for (const attachment of unlinkedAttachments) {
            // تحديث المرفق بمعرفات الحالة
            attachment.caseId = caseIds.primary;
            attachment.formNumber = formData.formNumber;
            attachment.fullName = formData.fullName;
            attachment.phone = formData.phoneFirst;
            attachment.linkedAt = new Date().toISOString();
            
            // حفظ المرفق المحدث
            await updateAttachment(attachment);
            
            // إنشاء رابط
            await createAttachmentLink(caseIds, attachment.id, formData);
        }
        
        console.log(`✅ تم ربط ${unlinkedAttachments.length} مرفق بالحالة`);
        
    } catch (error) {
        console.error('❌ خطأ في ربط المرفقات الموجودة:', error);
    }
}

// ==============================
// الحصول على المرفقات غير المربوطة
// ==============================
async function getUnlinkedAttachments() {
    return new Promise((resolve, reject) => {
        const transaction = attachmentsDB.transaction([ATTACHMENTS_STORE], 'readonly');
        const store = transaction.objectStore(ATTACHMENTS_STORE);
        const request = store.getAll();
        
        request.onsuccess = () => {
            const allAttachments = request.result || [];
            // فلترة المرفقات غير المربوطة أو المرفقات الحديثة
            const unlinked = allAttachments.filter(att => 
                !att.caseId || 
                !att.linkedAt ||
                (Date.now() - new Date(att.uploadDate).getTime()) < 300000 // آخر 5 دقائق
            );
            resolve(unlinked);
        };
        
        request.onerror = () => reject(new Error('فشل في استرجاع المرفقات'));
    });
}

// ==============================
// إنشاء رابط المرفق
// ==============================
async function createAttachmentLink(caseIds, attachmentId, formData) {
    const link = {
        id: `link_${attachmentId}_${caseIds.primary}`,
        caseId: caseIds.primary,
        attachmentId: attachmentId,
        formNumber: formData.formNumber,
        fullName: formData.fullName,
        phone: formData.phoneFirst,
        createdAt: new Date().toISOString()
    };
    
    return new Promise((resolve, reject) => {
        const transaction = attachmentsDB.transaction([LINKS_STORE], 'readwrite');
        const store = transaction.objectStore(LINKS_STORE);
        const request = store.put(link);
        
        request.onsuccess = () => resolve(link);
        request.onerror = () => reject(new Error('فشل في إنشاء رابط المرفق'));
    });
}

// ==============================
// إضافة أزرار المرفقات المحسنة
// ==============================
function addEnhancedAttachmentButtons() {
    // البحث عن جميع النماذج والحالات
    const forms = document.querySelectorAll('form, .case-item, .content-section');
    
    forms.forEach(addEnhancedAttachmentButtonToForm);
    
    // مراقبة النماذج الجديدة
    observeNewFormsForAttachments();
}

function addEnhancedAttachmentButtonToForm(formElement) {
    // تجاهل النماذج التي تحتوي على زر مرفقات بالفعل
    if (caseAttachmentButtons.has(formElement)) {
        return;
    }
    
    // إنشاء زر المرفقات المحسن
    const attachmentButton = createEnhancedAttachmentButton(formElement);
    
    // إضافة الزر للنموذج
    insertEnhancedAttachmentButton(formElement, attachmentButton);
    
    // حفظ المرجع
    caseAttachmentButtons.set(formElement, attachmentButton);
    
    // تحديث عدد المرفقات
    updateEnhancedAttachmentCount(attachmentButton, formElement);
}

function createEnhancedAttachmentButton(formElement) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'enhanced-attachment-button';
    button.title = 'إدارة المرفقات والوثائق';
    
    // أيقونة المجلد المحسنة
    button.innerHTML = `
        <div class="enhanced-attachment-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M10,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V8C22,6.89 21.1,6 20,6H12L10,4Z"/>
            </svg>
            <div class="enhanced-attachment-badge">
                <span class="attachment-count">0</span>
                <span class="attachment-status"></span>
            </div>
        </div>
        <span class="enhanced-attachment-label">المرفقات</span>
    `;
    
    // أحداث الزر
    button.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openEnhancedAttachmentManager(formElement);
    });
    
    return button;
}

function insertEnhancedAttachmentButton(formElement, attachmentButton) {
    // البحث عن أفضل مكان لإدراج الزر
    let insertionPoint = null;
    
    // محاولة العثور على منطقة الأزرار
    const buttonGroups = formElement.querySelectorAll('.btn-group, .form-actions, .buttons');
    if (buttonGroups.length > 0) {
        insertionPoint = buttonGroups[0];
        insertionPoint.appendChild(attachmentButton);
        return;
    }
    
    // إضافة في نهاية النموذج
    const wrapper = document.createElement('div');
    wrapper.className = 'enhanced-attachment-button-wrapper';
    wrapper.appendChild(attachmentButton);
    formElement.appendChild(wrapper);
}

// ==============================
// تحديث عدد المرفقات المحسن
// ==============================
async function updateEnhancedAttachmentCount(button, formElement) {
    try {
        const formData = getFormDataFromElement(formElement);
        const attachments = await getAttachmentsByMultipleIds(formData);
        
        const countElement = button.querySelector('.attachment-count');
        const statusElement = button.querySelector('.attachment-status');
        
        if (countElement) {
            countElement.textContent = attachments.length;
        }
        
        if (statusElement) {
            if (attachments.length > 0) {
                statusElement.className = 'attachment-status has-attachments';
                button.classList.add('has-attachments');
            } else {
                statusElement.className = 'attachment-status no-attachments';
                button.classList.remove('has-attachments');
            }
        }
        
    } catch (error) {
        console.error('خطأ في تحديث عدد المرفقات:', error);
    }
}

// ==============================
// فتح مدير المرفقات المحسن
// ==============================
async function openEnhancedAttachmentManager(formElement) {
    try {
        const formData = getFormDataFromElement(formElement);
        currentCaseData = formData;
        
        // إنشاء أو عرض مدير الملفات
        const fileManager = await createEnhancedFileManager();
        
        // تحميل المرفقات
        await loadEnhancedAttachments(formData);
        
        // عرض المدير
        fileManager.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
    } catch (error) {
        console.error('خطأ في فتح مدير المرفقات:', error);
        showEnhancedToast('فشل في فتح مدير المرفقات', 'error');
    }
}

// ==============================
// إنشاء مدير الملفات المحسن
// ==============================
async function createEnhancedFileManager() {
    let fileManager = document.getElementById('enhanced-file-manager');
    
    if (!fileManager) {
        fileManager = document.createElement('div');
        fileManager.id = 'enhanced-file-manager';
        fileManager.innerHTML = `
            <div class="enhanced-file-manager-overlay">
                <div class="enhanced-file-manager-container">
                    <div class="enhanced-file-manager-header">
                        <h3>🗂️ مدير المرفقات المحسن</h3>
                        <div class="case-info" id="current-case-info">
                            <span class="case-name">غير محدد</span>
                            <span class="case-details">لم يتم ربط بحالة</span>
                        </div>
                        <div class="enhanced-file-manager-tools">
                            <button class="tool-btn" onclick="toggleEnhancedFileView()" title="تغيير العرض">
                                <i class="fas fa-th" id="enhanced-view-toggle-icon"></i>
                            </button>
                            <button class="tool-btn" onclick="showAttachmentStats()" title="الإحصائيات">
                                <i class="fas fa-chart-bar"></i>
                            </button>
                            <button class="tool-btn close-btn" onclick="closeEnhancedFileManager()" title="إغلاق">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div class="enhanced-file-manager-toolbar">
                        <div class="toolbar-left">
                            <button class="btn btn-primary" onclick="uploadEnhancedFiles()">
                                <i class="fas fa-cloud-upload-alt"></i>
                                رفع ملفات
                            </button>
                            <button class="btn btn-success" onclick="takeEnhancedPhoto()">
                                <i class="fas fa-camera"></i>
                                التقاط صورة
                            </button>
                            <button class="btn btn-info" onclick="linkToCase()">
                                <i class="fas fa-link"></i>
                                ربط بالحالة
                            </button>
                        </div>
                        <div class="toolbar-right">
                            <div class="search-box">
                                <input type="text" id="enhanced-file-search" placeholder="البحث في المرفقات..." onkeyup="searchEnhancedFiles()">
                                <i class="fas fa-search"></i>
                            </div>
                            <select id="enhanced-file-filter" onchange="filterEnhancedFiles()">
                                <option value="all">جميع المرفقات</option>
                                <option value="linked">المرتبطة بالحالة</option>
                                <option value="unlinked">غير مرتبطة</option>
                                <option value="images">الصور</option>
                                <option value="documents">المستندات</option>
                                <option value="recent">الحديثة</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="enhanced-file-manager-content">
                        <div class="enhanced-file-manager-sidebar">
                            <div class="sidebar-section">
                                <h4>📁 تصنيف المرفقات</h4>
                                <div class="enhanced-folder-tree" id="enhanced-folder-tree">
                                    <div class="folder-item active" data-folder="all">
                                        <i class="fas fa-folder-open"></i>
                                        جميع المرفقات
                                        <span class="folder-count" id="all-count">0</span>
                                    </div>
                                    <div class="folder-item" data-folder="linked">
                                        <i class="fas fa-link"></i>
                                        مرفقات هذه الحالة
                                        <span class="folder-count" id="linked-count">0</span>
                                    </div>
                                    <div class="folder-item" data-folder="unlinked">
                                        <i class="fas fa-unlink"></i>
                                        غير مرتبطة
                                        <span class="folder-count" id="unlinked-count">0</span>
                                    </div>
                                    <div class="folder-item" data-folder="images">
                                        <i class="fas fa-images"></i>
                                        الصور
                                        <span class="folder-count" id="images-count">0</span>
                                    </div>
                                    <div class="folder-item" data-folder="documents">
                                        <i class="fas fa-file-alt"></i>
                                        المستندات
                                        <span class="folder-count" id="documents-count">0</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="sidebar-section">
                                <h4>📊 إحصائيات التخزين</h4>
                                <div class="enhanced-storage-stats" id="enhanced-storage-stats">
                                    <div class="stat-item">
                                        <span class="stat-label">المستخدم:</span>
                                        <span class="stat-value" id="enhanced-used-storage">0 MB</span>
                                    </div>
                                    <div class="stat-item">
                                        <span class="stat-label">المتاح:</span>
                                        <span class="stat-value" id="enhanced-available-storage">500 MB</span>
                                    </div>
                                    <div class="enhanced-storage-bar">
                                        <div class="storage-used" id="enhanced-storage-bar"></div>
                                    </div>
                                    <div class="stat-item">
                                        <span class="stat-label">عدد الملفات:</span>
                                        <span class="stat-value" id="enhanced-files-count">0</span>
                                    </div>
                                    <div class="stat-item">
                                        <span class="stat-label">الحالات المرتبطة:</span>
                                        <span class="stat-value" id="linked-cases-count">0</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="enhanced-file-manager-main">
                            <div class="files-container" id="enhanced-files-container">
                                <div class="loading-placeholder">
                                    <i class="fas fa-spinner fa-spin"></i>
                                    جاري تحميل المرفقات...
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="enhanced-file-manager-footer">
                        <div class="footer-info">
                            <span id="enhanced-selected-files-info">لم يتم تحديد أي مرفق</span>
                        </div>
                        <div class="footer-actions">
                            <button class="btn btn-warning" onclick="linkSelectedFiles()" disabled id="link-btn">
                                <i class="fas fa-link"></i>
                                ربط بالحالة
                            </button>
                            <button class="btn btn-danger" onclick="deleteSelectedEnhancedFiles()" disabled id="enhanced-delete-btn">
                                <i class="fas fa-trash"></i>
                                حذف المحدد
                            </button>
                            <button class="btn btn-primary" onclick="downloadSelectedEnhancedFiles()" disabled id="enhanced-download-btn">
                                <i class="fas fa-download"></i>
                                تحميل المحدد
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- نافذة معاينة محسنة -->
            <div class="enhanced-file-preview-modal" id="enhanced-file-preview">
                <div class="preview-overlay" onclick="closeEnhancedFilePreview()">
                    <div class="preview-container" onclick="event.stopPropagation()">
                        <div class="preview-header">
                            <h4 id="enhanced-preview-title">معاينة المرفق</h4>
                            <div class="preview-info">
                                <span id="preview-case-info">غير مرتبط بحالة</span>
                            </div>
                            <button class="preview-close" onclick="closeEnhancedFilePreview()">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="preview-content" id="enhanced-preview-content">
                            <!-- محتوى المعاينة -->
                        </div>
                        <div class="preview-footer">
                            <button class="btn btn-info" onclick="linkCurrentFileToCase()">
                                <i class="fas fa-link"></i>
                                ربط بالحالة الحالية
                            </button>
                            <button class="btn btn-primary" onclick="downloadCurrentEnhancedFile()">
                                <i class="fas fa-download"></i>
                                تحميل
                            </button>
                            <button class="btn btn-danger" onclick="deleteCurrentEnhancedFile()">
                                <i class="fas fa-trash"></i>
                                حذف
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(fileManager);
    }
    
    return fileManager;
}

// ==============================
// تحميل المرفقات المحسن
// ==============================
async function loadEnhancedAttachments(formData) {
    const filesContainer = document.getElementById('enhanced-files-container');
    filesContainer.innerHTML = '<div class="loading-placeholder"><i class="fas fa-spinner fa-spin"></i> جاري تحميل المرفقات...</div>';
    
    try {
        // تحديث معلومات الحالة الحالية
        updateCurrentCaseInfo(formData);
        
        // تحميل جميع المرفقات
        const allAttachments = await getAllEnhancedAttachments();
        
        // تحميل المرفقات المرتبطة بالحالة
        const linkedAttachments = await getAttachmentsByMultipleIds(formData);
        
        // عرض المرفقات
        displayEnhancedFiles(allAttachments, linkedAttachments, formData);
        
        // تحديث الإحصائيات
        updateEnhancedStorageStats();
        updateFolderCounts(allAttachments, linkedAttachments);
        
    } catch (error) {
        console.error('خطأ في تحميل المرفقات:', error);
        filesContainer.innerHTML = '<div class="error-placeholder"><i class="fas fa-exclamation-triangle"></i> خطأ في تحميل المرفقات</div>';
    }
}

// ==============================
// تحديث معلومات الحالة الحالية
// ==============================
function updateCurrentCaseInfo(formData) {
    const caseInfoElement = document.getElementById('current-case-info');
    if (caseInfoElement) {
        const caseName = caseInfoElement.querySelector('.case-name');
        const caseDetails = caseInfoElement.querySelector('.case-details');
        
        if (formData.fullName) {
            caseName.textContent = formData.fullName;
            
            let details = [];
            if (formData.formNumber) details.push(`رقم: ${formData.formNumber}`);
            if (formData.phoneFirst) details.push(`هاتف: ${formData.phoneFirst}`);
            
            caseDetails.textContent = details.length > 0 ? details.join(' | ') : 'معلومات الحالة';
        } else {
            caseName.textContent = 'حالة جديدة';
            caseDetails.textContent = 'لم يتم حفظ البيانات بعد';
        }
    }
}

// ==============================
// الحصول على جميع المرفقات
// ==============================
async function getAllEnhancedAttachments() {
    return new Promise((resolve, reject) => {
        const transaction = attachmentsDB.transaction([ATTACHMENTS_STORE], 'readonly');
        const store = transaction.objectStore(ATTACHMENTS_STORE);
        const request = store.getAll();
        
        request.onsuccess = () => {
            const attachments = request.result || [];
            // ترتيب حسب تاريخ الرفع (الأحدث أولاً)
            attachments.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
            resolve(attachments);
        };
        
        request.onerror = () => reject(new Error('فشل في استرجاع المرفقات'));
    });
}

// ==============================
// الحصول على المرفقات بمعرفات متعددة
// ==============================
async function getAttachmentsByMultipleIds(formData) {
    if (!formData.fullName && !formData.formNumber && !formData.phoneFirst) {
        return [];
    }
    
    return new Promise((resolve, reject) => {
        const transaction = attachmentsDB.transaction([ATTACHMENTS_STORE], 'readonly');
        const store = transaction.objectStore(ATTACHMENTS_STORE);
        const allAttachments = [];
        
        const request = store.getAll();
        
        request.onsuccess = () => {
            const attachments = request.result || [];
            
            const matchedAttachments = attachments.filter(att => {
                // البحث بالاسم الكامل
                if (formData.fullName && att.fullName === formData.fullName) {
                    return true;
                }
                
                // البحث برقم الاستمارة
                if (formData.formNumber && att.formNumber === formData.formNumber) {
                    return true;
                }
                
                // البحث برقم الهاتف
                if (formData.phoneFirst && att.phone === formData.phoneFirst) {
                    return true;
                }
                
                return false;
            });
            
            resolve(matchedAttachments);
        };
        
        request.onerror = () => reject(new Error('فشل في البحث عن المرفقات'));
    });
}

// ==============================
// عرض الملفات المحسن
// ==============================
function displayEnhancedFiles(allAttachments, linkedAttachments, formData) {
    const filesContainer = document.getElementById('enhanced-files-container');
    
    if (allAttachments.length === 0) {
        filesContainer.innerHTML = `
            <div class="empty-placeholder">
                <i class="fas fa-folder-open"></i>
                <h3>لا توجد مرفقات</h3>
                <p>ابدأ برفع الملفات والصور الخاصة بالحالات</p>
                <button class="btn btn-primary" onclick="uploadEnhancedFiles()">
                    <i class="fas fa-cloud-upload-alt"></i>
                    رفع أول مرفق
                </button>
            </div>
        `;
        return;
    }
    
    const isGridView = enhancedAttachmentSettings.gridView;
    filesContainer.className = isGridView ? 'files-container grid-view' : 'files-container list-view';
    
    const filesHTML = allAttachments.map(file => 
        createEnhancedFileElement(file, isGridView, linkedAttachments.some(linked => linked.id === file.id), formData)
    ).join('');
    
    filesContainer.innerHTML = filesHTML;
    
    // إعداد مستمعي الأحداث
    setupEnhancedFileEventListeners();
}

// ==============================
// إنشاء عنصر الملف المحسن
// ==============================
function createEnhancedFileElement(file, isGridView, isLinked, formData) {
    const fileExtension = getFileExtension(file.name);
    const fileIcon = getFileIcon(file.type, fileExtension);
    const fileSize = formatFileSize(file.size);
    const uploadDate = new Date(file.uploadDate).toLocaleDateString('ar-EG');
    
    const linkStatus = isLinked ? 
        '<div class="link-status linked"><i class="fas fa-link"></i> مرتبط</div>' :
        '<div class="link-status unlinked"><i class="fas fa-unlink"></i> غير مرتبط</div>';
    
    const linkClass = isLinked ? 'linked-file' : 'unlinked-file';
    
    if (isGridView) {
        return `
            <div class="enhanced-file-item grid-item ${linkClass}" data-file-id="${file.id}" data-file-type="${file.type}">
                <div class="file-checkbox">
                    <input type="checkbox" class="enhanced-file-select" onchange="updateEnhancedSelectionInfo()">
                </div>
                ${linkStatus}
                <div class="file-thumbnail" onclick="previewEnhancedFile('${file.id}')">
                    ${file.type.startsWith('image/') ? 
                        `<img src="${file.thumbnail || file.data}" alt="${file.name}" loading="lazy">` :
                        `<div class="file-icon-large">${fileIcon}</div>`
                    }
                </div>
                <div class="file-info">
                    <div class="file-name" title="${file.name}">${truncateText(file.name, 20)}</div>
                    <div class="file-meta">
                        <span class="file-size">${fileSize}</span>
                        <span class="file-date">${uploadDate}</span>
                    </div>
                    ${file.fullName ? `<div class="file-case">الحالة: ${file.fullName}</div>` : ''}
                </div>
                <div class="file-actions">
                    <button class="action-btn" onclick="previewEnhancedFile('${file.id}')" title="معاينة">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${!isLinked ? `
                        <button class="action-btn link-btn" onclick="linkFileToCurrentCase('${file.id}')" title="ربط بالحالة">
                            <i class="fas fa-link"></i>
                        </button>
                    ` : ''}
                    <button class="action-btn" onclick="downloadEnhancedFile('${file.id}')" title="تحميل">
                        <i class="fas fa-download"></i>
                    </button>
                    <button class="action-btn delete-btn" onclick="deleteEnhancedFile('${file.id}')" title="حذف">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    } else {
        return `
            <div class="enhanced-file-item list-item ${linkClass}" data-file-id="${file.id}" data-file-type="${file.type}">
                <div class="file-checkbox">
                    <input type="checkbox" class="enhanced-file-select" onchange="updateEnhancedSelectionInfo()">
                </div>
                <div class="file-icon">${fileIcon}</div>
                <div class="file-details">
                    <div class="file-name">${file.name}</div>
                    <div class="file-meta">
                        <span class="file-type">${getFileTypeLabel(file.type)}</span>
                        <span class="file-size">${fileSize}</span>
                        <span class="file-date">${uploadDate}</span>
                        ${file.fullName ? `<span class="file-case">الحالة: ${file.fullName}</span>` : ''}
                    </div>
                </div>
                ${linkStatus}
                <div class="file-actions">
                    <button class="action-btn" onclick="previewEnhancedFile('${file.id}')" title="معاينة">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${!isLinked ? `
                        <button class="action-btn link-btn" onclick="linkFileToCurrentCase('${file.id}')" title="ربط بالحالة">
                            <i class="fas fa-link"></i>
                        </button>
                    ` : ''}
                    <button class="action-btn" onclick="downloadEnhancedFile('${file.id}')" title="تحميل">
                        <i class="fas fa-download"></i>
                    </button>
                    <button class="action-btn delete-btn" onclick="deleteEnhancedFile('${file.id}')" title="حذف">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }
}

// ==============================
// رفع الملفات المحسن
// ==============================
function uploadEnhancedFiles() {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = [...enhancedAttachmentSettings.allowedImageTypes, ...enhancedAttachmentSettings.allowedDocumentTypes].join(',');
    
    input.onchange = async function(e) {
        const files = Array.from(e.target.files);
        
        if (files.length === 0) return;
        
        await processEnhancedFileUploads(files);
    };
    
    input.click();
}

// ==============================
// معالجة رفع الملفات المحسن
// ==============================
async function processEnhancedFileUploads(files) {
    // إنشاء مؤشر التقدم
    const progressModal = createEnhancedProgressModal(files.length);
    document.body.appendChild(progressModal);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        try {
            updateEnhancedProgressModal(i + 1, files.length, `جاري رفع ${file.name}...`);
            
            // التحقق من صحة الملف
            const validation = validateEnhancedFile(file);
            if (!validation.valid) {
                throw new Error(validation.error);
            }
            
            // معالجة وحفظ الملف
            const attachment = await processEnhancedFileUpload(file);
            await saveEnhancedAttachment(attachment);
            
            // ربط تلقائي إذا كانت البيانات متوفرة
            if (currentCaseData && enhancedAttachmentSettings.enableAutoLink) {
                await linkAttachmentToCurrentCase(attachment.id);
            }
            
            successCount++;
            
        } catch (error) {
            console.error(`خطأ في رفع ${file.name}:`, error);
            errorCount++;
        }
    }
    
    // إزالة مؤشر التقدم
    document.body.removeChild(progressModal);
    
    // عرض النتائج
    if (successCount > 0) {
        showEnhancedToast(`تم رفع ${successCount} ملف بنجاح`, 'success');
        
        // تحديث العرض
        if (currentCaseData) {
            await loadEnhancedAttachments(currentCaseData);
        }
        
        // تحديث أزرار المرفقات
        updateAttachmentButtonsCounts();
    }
    
    if (errorCount > 0) {
        showEnhancedToast(`فشل في رفع ${errorCount} ملف`, 'error');
    }
}

// ==============================
// معالجة رفع الملف الواحد المحسن
// ==============================
async function processEnhancedFileUpload(file) {
    // إنشاء معرف فريد
    const fileId = 'enhanced_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    // معالجة الملف
    let processedData = null;
    let thumbnail = null;
    
    if (file.type.startsWith('image/')) {
        if (enhancedAttachmentSettings.enableCompression) {
            processedData = await compressImage(file, enhancedAttachmentSettings.compressionQuality);
        } else {
            processedData = await fileToBase64(file);
        }
        
        // إنشاء صورة مصغرة
        thumbnail = await createThumbnail(file, enhancedAttachmentSettings.thumbnailSize);
    } else {
        processedData = await fileToBase64(file);
    }
    
    // إنشاء كائن المرفق المحسن
    const attachment = {
        id: fileId,
        name: file.name,
        type: file.type,
        size: file.size,
        data: processedData,
        thumbnail: thumbnail,
        uploadDate: new Date().toISOString(),
        category: categorizeFile(file),
        checksum: await calculateChecksum(processedData),
        // معلومات الربط (ستتم إضافتها لاحقاً)
        caseId: null,
        formNumber: null,
        fullName: null,
        phone: null,
        linkedAt: null
    };
    
    return attachment;
}

// ==============================
// حفظ المرفق المحسن
// ==============================
async function saveEnhancedAttachment(attachment) {
    return new Promise((resolve, reject) => {
        const transaction = attachmentsDB.transaction([ATTACHMENTS_STORE], 'readwrite');
        const store = transaction.objectStore(ATTACHMENTS_STORE);
        const request = store.add(attachment);
        
        request.onsuccess = () => {
            console.log('✅ تم حفظ المرفق المحسن:', attachment.name);
            resolve(attachment);
        };
        
        request.onerror = () => {
            console.error('❌ فشل في حفظ المرفق:', attachment.name);
            reject(new Error('فشل في حفظ المرفق'));
        };
    });
}

// ==============================
// ربط المرفق بالحالة الحالية
// ==============================
async function linkAttachmentToCurrentCase(attachmentId) {
    if (!currentCaseData || !currentCaseData.fullName) {
        return false;
    }
    
    try {
        // الحصول على المرفق
        const attachment = await getEnhancedAttachment(attachmentId);
        if (!attachment) return false;
        
        // تحديث بيانات المرفق
        attachment.fullName = currentCaseData.fullName;
        attachment.formNumber = currentCaseData.formNumber;
        attachment.phone = currentCaseData.phoneFirst;
        attachment.linkedAt = new Date().toISOString();
        
        // حفظ المرفق المحدث
        await updateEnhancedAttachment(attachment);
        
        console.log('✅ تم ربط المرفق بالحالة:', attachment.name);
        return true;
        
    } catch (error) {
        console.error('❌ خطأ في ربط المرفق:', error);
        return false;
    }
}

// ==============================
// الحصول على مرفق محدد
// ==============================
async function getEnhancedAttachment(fileId) {
    return new Promise((resolve, reject) => {
        const transaction = attachmentsDB.transaction([ATTACHMENTS_STORE], 'readonly');
        const store = transaction.objectStore(ATTACHMENTS_STORE);
        const request = store.get(fileId);
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(new Error('فشل في استرجاع المرفق'));
    });
}

// ==============================
// تحديث مرفق موجود
// ==============================
async function updateEnhancedAttachment(attachment) {
    return new Promise((resolve, reject) => {
        const transaction = attachmentsDB.transaction([ATTACHMENTS_STORE], 'readwrite');
        const store = transaction.objectStore(ATTACHMENTS_STORE);
        const request = store.put(attachment);
        
        request.onsuccess = () => resolve(attachment);
        request.onerror = () => reject(new Error('فشل في تحديث المرفق'));
    });
}

// ==============================
// وظائف مساعدة للنظام المحسن
// ==============================

function getEnhancedFormData() {
    // محاولة الحصول على بيانات النموذج من النشاط الحالي
    if (typeof getFormData === 'function') {
        return getFormData();
    }
    
    // محاولة البحث في النموذج النشط
    const activeForm = document.querySelector('form#case-form');
    if (activeForm) {
        return getFormDataFromElement(activeForm);
    }
    
    return {};
}

function getFormDataFromElement(element) {
    const formData = {};
    
    // البحث عن الحقول في العنصر
    const inputs = element.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        if (input.id || input.name) {
            const key = input.id || input.name;
            formData[key] = input.value;
        }
    });
    
    return formData;
}

function validateEnhancedFile(file) {
    // التحقق من نوع الملف
    const allowedTypes = [...enhancedAttachmentSettings.allowedImageTypes, ...enhancedAttachmentSettings.allowedDocumentTypes];
    if (!allowedTypes.includes(file.type)) {
        return { valid: false, error: 'نوع الملف غير مدعوم' };
    }
    
    // التحقق من حجم الملف
    if (file.size > enhancedAttachmentSettings.maxFileSize) {
        return { valid: false, error: `حجم الملف أكبر من ${formatFileSize(enhancedAttachmentSettings.maxFileSize)}` };
    }
    
    return { valid: true };
}

// ==============================
// وظائف مساعدة من النظام الأصلي
// ==============================
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getFileExtension(filename) {
    return filename.split('.').pop().toLowerCase();
}

function getFileIcon(type, extension) {
    if (type.startsWith('image/')) {
        return '<i class="fas fa-image" style="color: #28a745;"></i>';
    } else if (type === 'application/pdf') {
        return '<i class="fas fa-file-pdf" style="color: #dc3545;"></i>';
    } else if (type.includes('word')) {
        return '<i class="fas fa-file-word" style="color: #007bff;"></i>';
    } else if (type.includes('excel') || type.includes('sheet')) {
        return '<i class="fas fa-file-excel" style="color: #28a745;"></i>';
    } else if (type.startsWith('text/')) {
        return '<i class="fas fa-file-alt" style="color: #6c757d;"></i>';
    } else {
        return '<i class="fas fa-file" style="color: #6c757d;"></i>';
    }
}

function getFileTypeLabel(type) {
    const typeLabels = {
        'image/jpeg': 'صورة JPEG',
        'image/png': 'صورة PNG',
        'image/gif': 'صورة GIF',
        'image/webp': 'صورة WebP',
        'application/pdf': 'مستند PDF',
        'application/msword': 'مستند Word',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'مستند Word',
        'application/vnd.ms-excel': 'جدول Excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'جدول Excel',
        'text/plain': 'ملف نصي'
    };
    return typeLabels[type] || 'ملف غير معروف';
}

function categorizeFile(file) {
    if (file.type.startsWith('image/')) {
        return 'images';
    } else if (file.type === 'application/pdf' || file.type.includes('word') || file.type.includes('excel')) {
        return 'documents';
    } else {
        return 'other';
    }
}

function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
}

async function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

async function calculateChecksum(data) {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
        const char = data.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash.toString(16);
}

function compressImage(file, quality) {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = function() {
            let { width, height } = calculateOptimalSize(img.width, img.height, 1920, 1080);
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);
            const compressedData = canvas.toDataURL(file.type, quality);
            resolve(compressedData);
        };
        
        img.src = URL.createObjectURL(file);
    });
}

function createThumbnail(file, size) {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = function() {
            canvas.width = size;
            canvas.height = size;
            const minDim = Math.min(img.width, img.height);
            const x = (img.width - minDim) / 2;
            const y = (img.height - minDim) / 2;
            ctx.drawImage(img, x, y, minDim, minDim, 0, 0, size, size);
            const thumbnailData = canvas.toDataURL('image/jpeg', 0.8);
            resolve(thumbnailData);
        };
        
        img.src = URL.createObjectURL(file);
    });
}

function calculateOptimalSize(originalWidth, originalHeight, maxWidth, maxHeight) {
    let width = originalWidth;
    let height = originalHeight;
    
    if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
    }
    
    if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
    }
    
    return { width: Math.round(width), height: Math.round(height) };
}

// ==============================
// وظائف إضافية للنظام المحسن
// ==============================

function closeEnhancedFileManager() {
    const fileManager = document.getElementById('enhanced-file-manager');
    if (fileManager) {
        fileManager.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

function createEnhancedProgressModal(totalFiles) {
    const modal = document.createElement('div');
    modal.className = 'enhanced-progress-modal';
    modal.innerHTML = `
        <div class="progress-container">
            <div class="progress-title">جاري رفع الملفات المحسن...</div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: 0%"></div>
            </div>
            <div class="progress-text">0 من ${totalFiles}</div>
        </div>
    `;
    return modal;
}

function updateEnhancedProgressModal(current, total, message) {
    const progressFill = document.querySelector('.enhanced-progress-modal .progress-fill');
    const progressText = document.querySelector('.enhanced-progress-modal .progress-text');
    const progressTitle = document.querySelector('.enhanced-progress-modal .progress-title');
    
    if (progressFill) {
        const percentage = (current / total) * 100;
        progressFill.style.width = percentage + '%';
    }
    
    if (progressText) {
        progressText.textContent = `${current} من ${total}`;
    }
    
    if (progressTitle) {
        progressTitle.textContent = message;
    }
}

function updateEnhancedStorageStats() {
    // سيتم تنفيذها
    console.log('تحديث إحصائيات التخزين المحسن');
}

function updateFolderCounts(allAttachments, linkedAttachments) {
    // سيتم تنفيذها
    console.log('تحديث عدد المجلدات');
}

function updateAttachmentButtonsCounts() {
    // تحديث جميع أزرار المرفقات
    caseAttachmentButtons.forEach((button, formElement) => {
        updateEnhancedAttachmentCount(button, formElement);
    });
}

function setupEnhancedFileEventListeners() {
    // إعداد مستمعي الأحداث للملفات
    const checkboxes = document.querySelectorAll('.enhanced-file-select');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', updateEnhancedSelectionInfo);
    });
}

function updateEnhancedSelectionInfo() {
    // تحديث معلومات التحديد
    console.log('تحديث معلومات التحديد');
}

function observeNewFormsForAttachments() {
    // مراقبة النماذج الجديدة
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            mutation.addedNodes.forEach(function(node) {
                if (node.nodeType === 1) {
                    const newForms = node.querySelectorAll ? 
                        node.querySelectorAll('form, .case-item, .content-section') : 
                        [];
                    
                    newForms.forEach(addEnhancedAttachmentButtonToForm);
                    
                    if (node.matches && node.matches('form, .case-item, .content-section')) {
                        addEnhancedAttachmentButtonToForm(node);
                    }
                }
            });
        });
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

function observeFormChanges() {
    // مراقبة تغييرات النماذج لتحديث currentCaseData
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('input', debounce(() => {
            currentCaseData = getFormDataFromElement(form);
        }, 1000));
    });
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ==============================
// إضافة الأنماط المحسنة
// ==============================
function addEnhancedAttachmentStyles() {
    if (document.getElementById('enhanced-attachment-styles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'enhanced-attachment-styles';
    styles.textContent = `
        /* أزرار المرفقات المحسنة */
        .enhanced-attachment-button {
            background: linear-gradient(135deg, #8e44ad, #9b59b6);
            border: none;
            border-radius: 10px;
            color: white;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 10px;
            padding: 12px 18px;
            font-size: 14px;
            font-weight: 600;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
            min-width: 140px;
            justify-content: center;
            box-shadow: 0 4px 15px rgba(142, 68, 173, 0.3);
        }
        
        .enhanced-attachment-button:hover {
            transform: translateY(-3px);
            box-shadow: 0 6px 20px rgba(142, 68, 173, 0.4);
        }
        
        .enhanced-attachment-button.has-attachments {
            background: linear-gradient(135deg, #27ae60, #2ecc71);
            box-shadow: 0 4px 15px rgba(39, 174, 96, 0.3);
        }
        
        .enhanced-attachment-button.has-attachments:hover {
            box-shadow: 0 6px 20px rgba(39, 174, 96, 0.4);
        }
        
        .enhanced-attachment-icon {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .enhanced-attachment-icon svg {
            width: 20px;
            height: 20px;
        }
        
        .enhanced-attachment-badge {
            position: absolute;
            top: -8px;
            right: -8px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .attachment-count {
            background: #e74c3c;
            color: white;
            border-radius: 50%;
            width: 20px;
            height: 20px;
            font-size: 11px;
            font-weight: 700;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid white;
            position: relative;
            z-index: 2;
        }
        
        .attachment-status {
            position: absolute;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            top: -2px;
            right: -2px;
            z-index: 1;
        }
        
        .attachment-status.has-attachments {
            background: #27ae60;
            border: 2px solid white;
        }
        
        .attachment-status.no-attachments {
            background: #95a5a6;
            border: 2px solid white;
        }
        
        .enhanced-attachment-button-wrapper {
            margin-top: 15px;
            text-align: center;
        }
        
        /* مدير الملفات المحسن */
        #enhanced-file-manager {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            z-index: 10000;
            display: none;
        }
        
        .enhanced-file-manager-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.85);
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }
        
        .enhanced-file-manager-container {
            background: white;
            border-radius: 20px;
            width: 100%;
            max-width: 1400px;
            height: 90vh;
            overflow: hidden;
            box-shadow: 0 25px 60px rgba(0, 0, 0, 0.4);
            display: flex;
            flex-direction: column;
            border: 3px solid #8e44ad;
        }
        
        .enhanced-file-manager-header {
            background: linear-gradient(135deg, #8e44ad, #9b59b6);
            color: white;
            padding: 20px 25px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 3px solid #7d3c98;
        }
        
        .enhanced-file-manager-header h3 {
            margin: 0;
            font-size: 22px;
            font-weight: 700;
        }
        
        .case-info {
            display: flex;
            flex-direction: column;
            align-items: center;
            background: rgba(255, 255, 255, 0.15);
            padding: 8px 15px;
            border-radius: 10px;
            min-width: 200px;
        }
        
        .case-name {
            font-weight: 700;
            font-size: 14px;
            margin-bottom: 2px;
        }
        
        .case-details {
            font-size: 11px;
            opacity: 0.9;
        }
        
        .enhanced-file-manager-tools {
            display: flex;
            gap: 12px;
        }
        
        .tool-btn {
            background: rgba(255, 255, 255, 0.2);
            border: none;
            color: white;
            width: 45px;
            height: 45px;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s;
            font-size: 16px;
        }
        
        .tool-btn:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: scale(1.1);
        }
        
        .enhanced-file-manager-toolbar {
            background: linear-gradient(to right, #f8f9fa, #e9ecef);
            padding: 18px 25px;
            border-bottom: 2px solid #dee2e6;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 15px;
        }
        
        .toolbar-left {
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
        }
        
        .toolbar-right {
            display: flex;
            gap: 12px;
            align-items: center;
            flex-wrap: wrap;
        }
        
        .search-box {
            position: relative;
        }
        
        .search-box input {
            padding: 10px 40px 10px 15px;
            border: 2px solid #8e44ad;
            border-radius: 25px;
            font-size: 14px;
            min-width: 250px;
            transition: all 0.3s;
        }
        
        .search-box input:focus {
            outline: none;
            box-shadow: 0 0 0 3px rgba(142, 68, 173, 0.2);
            border-color: #9b59b6;
        }
        
        .search-box i {
            position: absolute;
            right: 15px;
            top: 50%;
            transform: translateY(-50%);
            color: #8e44ad;
            font-size: 16px;
        }
        
        .enhanced-file-manager-content {
            flex: 1;
            display: flex;
            overflow: hidden;
        }
        
        .enhanced-file-manager-sidebar {
            width: 280px;
            background: linear-gradient(to bottom, #f8f9fa, #e9ecef);
            border-right: 2px solid #dee2e6;
            overflow-y: auto;
            padding: 20px;
        }
        
        .sidebar-section {
            margin-bottom: 30px;
        }
        
        .sidebar-section h4 {
            color: #495057;
            margin-bottom: 15px;
            font-size: 15px;
            font-weight: 700;
            padding-bottom: 8px;
            border-bottom: 2px solid #8e44ad;
        }
        
        .enhanced-folder-tree {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        
        .folder-item {
            padding: 12px 15px;
            border-radius: 10px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-size: 14px;
            font-weight: 500;
            transition: all 0.3s;
            border: 2px solid transparent;
        }
        
        .folder-item:hover {
            background: rgba(142, 68, 173, 0.1);
            border-color: rgba(142, 68, 173, 0.3);
        }
        
        .folder-item.active {
            background: linear-gradient(135deg, #8e44ad, #9b59b6);
            color: white;
            border-color: #7d3c98;
        }
        
        .folder-item i {
            margin-left: 10px;
            font-size: 16px;
        }
        
        .folder-count {
            background: rgba(255, 255, 255, 0.9);
            color: #495057;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 700;
            min-width: 20px;
            text-align: center;
        }
        
        .folder-item.active .folder-count {
            background: rgba(255, 255, 255, 0.2);
            color: white;
        }
        
        .enhanced-storage-stats {
            background: white;
            border-radius: 15px;
            padding: 18px;
            border: 2px solid #e9ecef;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }
        
        .stat-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            font-size: 13px;
        }
        
        .stat-label {
            color: #6c757d;
            font-weight: 500;
        }
        
        .stat-value {
            font-weight: 700;
            color: #495057;
        }
        
        .enhanced-storage-bar {
            height: 10px;
            background: #e9ecef;
            border-radius: 5px;
            margin: 12px 0;
            overflow: hidden;
        }
        
        .storage-used {
            height: 100%;
            background: linear-gradient(135deg, #8e44ad, #9b59b6);
            transition: width 0.5s ease;
        }
        
        .enhanced-file-manager-main {
            flex: 1;
            overflow-y: auto;
            padding: 25px;
            background: #fafbfc;
        }
        
        .files-container {
            display: grid;
            gap: 20px;
        }
        
        .files-container.grid-view {
            grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        }
        
        .files-container.list-view {
            grid-template-columns: 1fr;
        }
        
        .enhanced-file-item {
            background: white;
            border: 2px solid #e9ecef;
            border-radius: 15px;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }
        
        .enhanced-file-item:hover {
            border-color: #8e44ad;
            box-shadow: 0 8px 25px rgba(142, 68, 173, 0.15);
            transform: translateY(-2px);
        }
        
        .enhanced-file-item.linked-file {
            border-color: #27ae60;
            background: linear-gradient(to right, #ffffff, #f8fff9);
        }
        
        .enhanced-file-item.unlinked-file {
            border-color: #e74c3c;
            background: linear-gradient(to right, #ffffff, #fff8f8);
        }
        
        .enhanced-file-item.grid-item {
            aspect-ratio: 1;
            display: flex;
            flex-direction: column;
        }
        
        .enhanced-file-item.list-item {
            display: flex;
            align-items: center;
            padding: 18px;
            gap: 18px;
            min-height: 80px;
        }
        
        .file-checkbox {
            position: absolute;
            top: 12px;
            left: 12px;
            z-index: 10;
        }
        
        .file-checkbox input {
            width: 20px;
            height: 20px;
            cursor: pointer;
            accent-color: #8e44ad;
        }
        
        .link-status {
            position: absolute;
            top: 12px;
            right: 12px;
            padding: 4px 8px;
            border-radius: 15px;
            font-size: 10px;
            font-weight: 700;
            z-index: 10;
        }
        
        .link-status.linked {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        
        .link-status.unlinked {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        
        .file-thumbnail {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            overflow: hidden;
            border-radius: 10px;
            margin: 12px;
            margin-bottom: 0;
        }
        
        .file-thumbnail img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 8px;
        }
        
        .file-icon-large {
            font-size: 60px;
            color: #6c757d;
        }
        
        .file-icon {
            font-size: 32px;
            color: #6c757d;
        }
        
        .file-info {
            padding: 15px;
            border-top: 1px solid #e9ecef;
        }
        
        .file-details {
            flex: 1;
        }
        
        .file-name {
            font-weight: 700;
            color: #495057;
            margin-bottom: 6px;
            font-size: 14px;
        }
        
        .file-meta {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            font-size: 12px;
            color: #6c757d;
        }
        
        .file-case {
            font-size: 11px;
            color: #8e44ad;
            font-weight: 600;
            margin-top: 4px;
        }
        
        .file-actions {
            display: flex;
            gap: 6px;
            padding: 12px;
            justify-content: center;
            border-top: 1px solid #e9ecef;
            background: #f8f9fa;
        }
        
        .list-item .file-actions {
            border: none;
            background: none;
            padding: 0;
        }
        
        .action-btn {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            color: #495057;
            width: 36px;
            height: 36px;
            border-radius: 8px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s;
            font-size: 13px;
        }
        
        .action-btn:hover {
            background: #e9ecef;
            transform: translateY(-1px);
        }
        
        .action-btn.link-btn {
            background: #e8f5e8;
            border-color: #27ae60;
            color: #27ae60;
        }
        
        .action-btn.link-btn:hover {
            background: #27ae60;
            color: white;
        }
        
        .action-btn.delete-btn:hover {
            background: #dc3545;
            color: white;
            border-color: #dc3545;
        }
        
        .enhanced-file-manager-footer {
            background: linear-gradient(to right, #f8f9fa, #e9ecef);
            border-top: 2px solid #dee2e6;
            padding: 18px 25px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .footer-info {
            font-size: 14px;
            color: #6c757d;
            font-weight: 500;
        }
        
        .footer-actions {
            display: flex;
            gap: 12px;
        }
        
        /* نافذة المعاينة المحسنة */
        .enhanced-file-preview-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            z-index: 10001;
            display: none;
        }
        
        .preview-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.95);
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }
        
        .preview-container {
            background: white;
            border-radius: 20px;
            max-width: 90vw;
            max-height: 90vh;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            border: 3px solid #8e44ad;
        }
        
        .preview-header {
            background: linear-gradient(135deg, #8e44ad, #9b59b6);
            color: white;
            padding: 18px 25px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .preview-header h4 {
            margin: 0;
            font-size: 18px;
            font-weight: 700;
        }
        
        .preview-info {
            font-size: 12px;
            background: rgba(255, 255, 255, 0.2);
            padding: 4px 12px;
            border-radius: 15px;
        }
        
        .preview-close {
            background: rgba(255, 255, 255, 0.2);
            border: none;
            color: white;
            width: 35px;
            height: 35px;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s;
        }
        
        .preview-close:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: scale(1.1);
        }
        
        .preview-content {
            flex: 1;
            overflow: auto;
            padding: 25px;
            max-height: 70vh;
        }
        
        .preview-footer {
            background: #f8f9fa;
            padding: 18px 25px;
            display: flex;
            gap: 12px;
            justify-content: center;
            border-top: 2px solid #e9ecef;
        }
        
        /* أزرار محسنة */
        .btn {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 10px 18px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            text-decoration: none;
            transition: all 0.3s;
            justify-content: center;
        }
        
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        }
        
        .btn-primary {
            background: linear-gradient(135deg, #007bff, #0056b3);
            color: white;
        }
        
        .btn-success {
            background: linear-gradient(135deg, #28a745, #1e7e34);
            color: white;
        }
        
        .btn-info {
            background: linear-gradient(135deg, #17a2b8, #138496);
            color: white;
        }
        
        .btn-warning {
            background: linear-gradient(135deg, #ffc107, #e0a800);
            color: #212529;
        }
        
        .btn-danger {
            background: linear-gradient(135deg, #dc3545, #c82333);
            color: white;
        }
        
        .btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
        }
        
        /* مؤشر التقدم المحسن */
        .enhanced-progress-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.85);
            z-index: 10003;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        
        .progress-container {
            background: white;
            border-radius: 20px;
            padding: 40px;
            min-width: 450px;
            text-align: center;
            border: 3px solid #8e44ad;
        }
        
        .progress-title {
            margin-bottom: 25px;
            font-size: 20px;
            font-weight: 700;
            color: #495057;
        }
        
        .progress-bar {
            width: 100%;
            height: 12px;
            background: #e9ecef;
            border-radius: 6px;
            overflow: hidden;
            margin-bottom: 18px;
        }
        
        .progress-fill {
            height: 100%;
            background: linear-gradient(135deg, #8e44ad, #9b59b6);
            transition: width 0.3s ease;
        }
        
        .progress-text {
            color: #6c757d;
            font-size: 16px;
            font-weight: 600;
        }
/* إشعارات محسنة */
        .enhanced-toast {
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #8e44ad, #9b59b6);
            color: white;
            padding: 15px 20px;
            border-radius: 12px;
            font-size: 14px;
            font-weight: 600;
            z-index: 10004;
            box-shadow: 0 8px 25px rgba(142, 68, 173, 0.3);
            transform: translateX(400px);
            transition: all 0.5s ease;
            max-width: 400px;
            min-width: 300px;
        }
        
        .enhanced-toast.show {
            transform: translateX(0);
        }
        
        .enhanced-toast.success {
            background: linear-gradient(135deg, #28a745, #20c997);
        }
        
        .enhanced-toast.error {
            background: linear-gradient(135deg, #dc3545, #e83e8c);
        }
        
        .enhanced-toast.warning {
            background: linear-gradient(135deg, #ffc107, #fd7e14);
            color: #212529;
        }
        
        /* أنماط إضافية */
        .loading-placeholder {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 60px 20px;
            color: #6c757d;
            font-size: 16px;
        }
        
        .loading-placeholder i {
            font-size: 48px;
            margin-bottom: 15px;
            color: #8e44ad;
        }
        
        .empty-placeholder {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 80px 20px;
            text-align: center;
        }
        
        .empty-placeholder i {
            font-size: 80px;
            color: #dee2e6;
            margin-bottom: 20px;
        }
        
        .empty-placeholder h3 {
            color: #6c757d;
            margin-bottom: 10px;
            font-size: 24px;
        }
        
        .empty-placeholder p {
            color: #adb5bd;
            margin-bottom: 25px;
            font-size: 16px;
        }
        
        .error-placeholder {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 60px 20px;
            color: #dc3545;
            font-size: 16px;
        }
        
        .error-placeholder i {
            font-size: 48px;
            margin-bottom: 15px;
        }
        
        /* استجابة للشاشات الصغيرة */
        @media (max-width: 768px) {
            .enhanced-file-manager-container {
                height: 100vh;
                max-width: 100%;
                border-radius: 0;
            }
            
            .enhanced-file-manager-content {
                flex-direction: column;
            }
            
            .enhanced-file-manager-sidebar {
                width: 100%;
                height: auto;
                border-right: none;
                border-bottom: 2px solid #dee2e6;
            }
            
            .files-container.grid-view {
                grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            }
            
            .search-box input {
                min-width: 200px;
            }
            
            .toolbar-left,
            .toolbar-right {
                width: 100%;
                justify-content: center;
            }
            
            .enhanced-attachment-button {
                min-width: 120px;
                font-size: 12px;
                padding: 10px 15px;
            }
        }
    `;
    
    document.head.appendChild(styles);
}

// ==============================
// وظائف الإشعارات المحسنة
// ==============================
function showEnhancedToast(message, type = 'info', duration = 4000) {
    // إزالة الإشعارات الموجودة
    const existingToasts = document.querySelectorAll('.enhanced-toast');
    existingToasts.forEach(toast => toast.remove());
    
    // إنشاء إشعار جديد
    const toast = document.createElement('div');
    toast.className = `enhanced-toast ${type}`;
    toast.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <i class="fas ${getToastIcon(type)}"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    // عرض الإشعار
    setTimeout(() => toast.classList.add('show'), 100);
    
    // إخفاء الإشعار
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 500);
    }, duration);
}

function getToastIcon(type) {
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    return icons[type] || icons.info;
}

// ==============================
// وظائف التحكم في العرض
// ==============================
function toggleEnhancedFileView() {
    enhancedAttachmentSettings.gridView = !enhancedAttachmentSettings.gridView;
    saveEnhancedAttachmentSettings();
    
    const viewIcon = document.getElementById('enhanced-view-toggle-icon');
    if (viewIcon) {
        viewIcon.className = enhancedAttachmentSettings.gridView ? 
            'fas fa-list' : 'fas fa-th';
    }
    
    // إعادة تحميل العرض
    if (currentCaseData) {
        loadEnhancedAttachments(currentCaseData);
    }
}

// ==============================
// وظائف البحث والفلترة
// ==============================
function searchEnhancedFiles() {
    const searchTerm = document.getElementById('enhanced-file-search').value.toLowerCase();
    const fileItems = document.querySelectorAll('.enhanced-file-item');
    
    fileItems.forEach(item => {
        const fileName = item.querySelector('.file-name').textContent.toLowerCase();
        const fileCase = item.querySelector('.file-case')?.textContent.toLowerCase() || '';
        
        const matches = fileName.includes(searchTerm) || fileCase.includes(searchTerm);
        item.style.display = matches ? '' : 'none';
    });
    
    updateEnhancedSelectionInfo();
}

function filterEnhancedFiles() {
    const filterValue = document.getElementById('enhanced-file-filter').value;
    const fileItems = document.querySelectorAll('.enhanced-file-item');
    
    fileItems.forEach(item => {
        let shouldShow = true;
        
        switch (filterValue) {
            case 'linked':
                shouldShow = item.classList.contains('linked-file');
                break;
            case 'unlinked':
                shouldShow = item.classList.contains('unlinked-file');
                break;
            case 'images':
                shouldShow = item.dataset.fileType?.startsWith('image/');
                break;
            case 'documents':
                shouldShow = !item.dataset.fileType?.startsWith('image/');
                break;
            case 'recent':
                // عرض الملفات المرفوعة في آخر 24 ساعة
                const uploadDate = item.querySelector('.file-date')?.textContent;
                if (uploadDate) {
                    const fileDate = new Date(uploadDate);
                    const yesterday = new Date();
                    yesterday.setDate(yesterday.getDate() - 1);
                    shouldShow = fileDate > yesterday;
                }
                break;
            case 'all':
            default:
                shouldShow = true;
                break;
        }
        
        item.style.display = shouldShow ? '' : 'none';
    });
    
    updateEnhancedSelectionInfo();
}

// ==============================
// وظائف التحديد المتعدد
// ==============================
function updateEnhancedSelectionInfo() {
    const checkboxes = document.querySelectorAll('.enhanced-file-select');
    const selectedCheckboxes = document.querySelectorAll('.enhanced-file-select:checked');
    const visibleItems = document.querySelectorAll('.enhanced-file-item[style=""], .enhanced-file-item:not([style])');
    
    const selectedCount = selectedCheckboxes.length;
    const totalVisible = visibleItems.length;
    
    // تحديث معلومات التحديد
    const selectionInfo = document.getElementById('enhanced-selected-files-info');
    if (selectionInfo) {
        if (selectedCount === 0) {
            selectionInfo.textContent = `${totalVisible} مرفق معروض`;
        } else {
            selectionInfo.textContent = `تم تحديد ${selectedCount} من ${totalVisible} مرفق`;
        }
    }
    
    // تفعيل/تعطيل الأزرار
    const linkBtn = document.getElementById('link-btn');
    const deleteBtn = document.getElementById('enhanced-delete-btn');
    const downloadBtn = document.getElementById('enhanced-download-btn');
    
    const hasSelection = selectedCount > 0;
    
    if (linkBtn) {
        linkBtn.disabled = !hasSelection;
        linkBtn.style.opacity = hasSelection ? '1' : '0.6';
    }
    
    if (deleteBtn) {
        deleteBtn.disabled = !hasSelection;
        deleteBtn.style.opacity = hasSelection ? '1' : '0.6';
    }
    
    if (downloadBtn) {
        downloadBtn.disabled = !hasSelection;
        downloadBtn.style.opacity = hasSelection ? '1' : '0.6';
    }
}

// ==============================
// وظائف معاينة الملفات
// ==============================
async function previewEnhancedFile(fileId) {
    try {
        const attachment = await getEnhancedAttachment(fileId);
        if (!attachment) {
            showEnhancedToast('لم يتم العثور على الملف', 'error');
            return;
        }
        
        const previewModal = document.getElementById('enhanced-file-preview');
        const previewTitle = document.getElementById('enhanced-preview-title');
        const previewContent = document.getElementById('enhanced-preview-content');
        const previewCaseInfo = document.getElementById('preview-case-info');
        
        // تحديث العنوان
        if (previewTitle) {
            previewTitle.textContent = attachment.name;
        }
        
        // تحديث معلومات الحالة
        if (previewCaseInfo) {
            if (attachment.fullName) {
                previewCaseInfo.textContent = `مرتبط بالحالة: ${attachment.fullName}`;
            } else {
                previewCaseInfo.textContent = 'غير مرتبط بحالة';
            }
        }
        
        // عرض المحتوى
        if (previewContent) {
            if (attachment.type.startsWith('image/')) {
                previewContent.innerHTML = `
                    <div style="text-align: center;">
                        <img src="${attachment.data}" alt="${attachment.name}" 
                             style="max-width: 100%; max-height: 500px; border-radius: 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
                    </div>
                `;
            } else if (attachment.type === 'application/pdf') {
                previewContent.innerHTML = `
                    <div style="text-align: center; padding: 40px;">
                        <i class="fas fa-file-pdf" style="font-size: 80px; color: #dc3545; margin-bottom: 20px;"></i>
                        <h4>مستند PDF</h4>
                        <p>حجم الملف: ${formatFileSize(attachment.size)}</p>
                        <p>تاريخ الرفع: ${new Date(attachment.uploadDate).toLocaleDateString('ar-EG')}</p>
                        <button class="btn btn-primary" onclick="downloadEnhancedFile('${fileId}')">
                            <i class="fas fa-download"></i>
                            تحميل المستند
                        </button>
                    </div>
                `;
            } else {
                previewContent.innerHTML = `
                    <div style="text-align: center; padding: 40px;">
                        ${getFileIcon(attachment.type)}
                        <h4 style="margin: 20px 0;">${attachment.name}</h4>
                        <div style="color: #6c757d; margin-bottom: 20px;">
                            <p>نوع الملف: ${getFileTypeLabel(attachment.type)}</p>
                            <p>حجم الملف: ${formatFileSize(attachment.size)}</p>
                            <p>تاريخ الرفع: ${new Date(attachment.uploadDate).toLocaleDateString('ar-EG')}</p>
                        </div>
                        <button class="btn btn-primary" onclick="downloadEnhancedFile('${fileId}')">
                            <i class="fas fa-download"></i>
                            تحميل الملف
                        </button>
                    </div>
                `;
            }
        }
        
        // حفظ معرف الملف الحالي للمعاينة
        previewModal.dataset.currentFileId = fileId;
        
        // عرض النافذة
        previewModal.style.display = 'block';
        
    } catch (error) {
        console.error('خطأ في معاينة الملف:', error);
        showEnhancedToast('فشل في معاينة الملف', 'error');
    }
}

function closeEnhancedFilePreview() {
    const previewModal = document.getElementById('enhanced-file-preview');
    if (previewModal) {
        previewModal.style.display = 'none';
    }
}

// ==============================
// وظائف التحميل والحذف
// ==============================
async function downloadEnhancedFile(fileId) {
    try {
        const attachment = await getEnhancedAttachment(fileId);
        if (!attachment) {
            showEnhancedToast('لم يتم العثور على الملف', 'error');
            return;
        }
        
        // إنشاء رابط التحميل
        const link = document.createElement('a');
        link.href = attachment.data;
        link.download = attachment.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showEnhancedToast(`تم تحميل ${attachment.name} بنجاح`, 'success');
        
    } catch (error) {
        console.error('خطأ في تحميل الملف:', error);
        showEnhancedToast('فشل في تحميل الملف', 'error');
    }
}

async function deleteEnhancedFile(fileId, skipConfirmation = false) {
    if (!skipConfirmation) {
        const confirmed = confirm('هل أنت متأكد من حذف هذا المرفق؟\nلا يمكن التراجع عن هذا الإجراء.');
        if (!confirmed) return;
    }
    
    try {
        // حذف المرفق من قاعدة البيانات
        await deleteAttachmentFromDB(fileId);
        
        // حذف الروابط المرتبطة
        await deleteAttachmentLinks(fileId);
        
        // إزالة العنصر من الواجهة
        const fileElement = document.querySelector(`[data-file-id="${fileId}"]`);
        if (fileElement) {
            fileElement.remove();
        }
        
        // تحديث العرض والإحصائيات
        updateEnhancedStorageStats();
        updateEnhancedSelectionInfo();
        updateAttachmentButtonsCounts();
        
        showEnhancedToast('تم حذف المرفق بنجاح', 'success');
        
    } catch (error) {
        console.error('خطأ في حذف الملف:', error);
        showEnhancedToast('فشل في حذف المرفق', 'error');
    }
}

async function deleteAttachmentFromDB(fileId) {
    return new Promise((resolve, reject) => {
        const transaction = attachmentsDB.transaction([ATTACHMENTS_STORE], 'readwrite');
        const store = transaction.objectStore(ATTACHMENTS_STORE);
        const request = store.delete(fileId);
        
        request.onsuccess = () => resolve();
        request.onerror = () => reject(new Error('فشل في حذف المرفق من قاعدة البيانات'));
    });
}

async function deleteAttachmentLinks(fileId) {
    return new Promise((resolve, reject) => {
        const transaction = attachmentsDB.transaction([LINKS_STORE], 'readwrite');
        const store = transaction.objectStore(LINKS_STORE);
        const index = store.index('attachmentId');
        const request = index.openCursor(IDBKeyRange.only(fileId));
        
        request.onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
                cursor.delete();
                cursor.continue();
            } else {
                resolve();
            }
        };
        
        request.onerror = () => reject(new Error('فشل في حذف روابط المرفق'));
    });
}

// ==============================
// وظائف الربط مع الحالات
// ==============================
async function linkFileToCurrentCase(fileId) {
    if (!currentCaseData || !currentCaseData.fullName) {
        showEnhancedToast('يجب حفظ بيانات الحالة أولاً', 'warning');
        return;
    }
    
    const success = await linkAttachmentToCurrentCase(fileId);
    
    if (success) {
        showEnhancedToast('تم ربط المرفق بالحالة بنجاح', 'success');
        
        // تحديث العرض
        if (currentCaseData) {
            await loadEnhancedAttachments(currentCaseData);
        }
        
        updateAttachmentButtonsCounts();
    } else {
        showEnhancedToast('فشل في ربط المرفق بالحالة', 'error');
    }
}

async function linkCurrentFileToCase() {
    const previewModal = document.getElementById('enhanced-file-preview');
    const fileId = previewModal?.dataset.currentFileId;
    
    if (fileId) {
        await linkFileToCurrentCase(fileId);
        closeEnhancedFilePreview();
    }
}

async function linkSelectedFiles() {
    if (!currentCaseData || !currentCaseData.fullName) {
        showEnhancedToast('يجب حفظ بيانات الحالة أولاً', 'warning');
        return;
    }
    
    const selectedCheckboxes = document.querySelectorAll('.enhanced-file-select:checked');
    const fileIds = Array.from(selectedCheckboxes).map(checkbox => 
        checkbox.closest('.enhanced-file-item').dataset.fileId
    );
    
    if (fileIds.length === 0) {
        showEnhancedToast('لم يتم تحديد أي مرفق', 'warning');
        return;
    }
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const fileId of fileIds) {
        const success = await linkAttachmentToCurrentCase(fileId);
        if (success) {
            successCount++;
        } else {
            errorCount++;
        }
    }
    
    if (successCount > 0) {
        showEnhancedToast(`تم ربط ${successCount} مرفق بالحالة`, 'success');
        
        // تحديث العرض
        if (currentCaseData) {
            await loadEnhancedAttachments(currentCaseData);
        }
        
        updateAttachmentButtonsCounts();
    }
    
    if (errorCount > 0) {
        showEnhancedToast(`فشل في ربط ${errorCount} مرفق`, 'error');
    }
}

// ==============================
// وظائف التحديد المتعدد للحذف والتحميل
// ==============================
async function deleteSelectedEnhancedFiles() {
    const selectedCheckboxes = document.querySelectorAll('.enhanced-file-select:checked');
    const fileIds = Array.from(selectedCheckboxes).map(checkbox => 
        checkbox.closest('.enhanced-file-item').dataset.fileId
    );
    
    if (fileIds.length === 0) {
        showEnhancedToast('لم يتم تحديد أي مرفق', 'warning');
        return;
    }
    
    const confirmed = confirm(`هل أنت متأكد من حذف ${fileIds.length} مرفق؟\nلا يمكن التراجع عن هذا الإجراء.`);
    if (!confirmed) return;
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const fileId of fileIds) {
        try {
            await deleteEnhancedFile(fileId, true);
            successCount++;
        } catch (error) {
            errorCount++;
        }
    }
    
    if (successCount > 0) {
        showEnhancedToast(`تم حذف ${successCount} مرفق بنجاح`, 'success');
    }
    
    if (errorCount > 0) {
        showEnhancedToast(`فشل في حذف ${errorCount} مرفق`, 'error');
    }
}

async function downloadSelectedEnhancedFiles() {
    const selectedCheckboxes = document.querySelectorAll('.enhanced-file-select:checked');
    const fileIds = Array.from(selectedCheckboxes).map(checkbox => 
        checkbox.closest('.enhanced-file-item').dataset.fileId
    );
    
    if (fileIds.length === 0) {
        showEnhancedToast('لم يتم تحديد أي مرفق', 'warning');
        return;
    }
    
    showEnhancedToast(`جاري تحميل ${fileIds.length} مرفق...`, 'info');
    
    for (const fileId of fileIds) {
        try {
            await downloadEnhancedFile(fileId);
            // تأخير بسيط بين التحميلات
            await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
            console.error('خطأ في تحميل الملف:', error);
        }
    }
}

async function downloadCurrentEnhancedFile() {
    const previewModal = document.getElementById('enhanced-file-preview');
    const fileId = previewModal?.dataset.currentFileId;
    
    if (fileId) {
        await downloadEnhancedFile(fileId);
    }
}

async function deleteCurrentEnhancedFile() {
    const previewModal = document.getElementById('enhanced-file-preview');
    const fileId = previewModal?.dataset.currentFileId;
    
    if (fileId) {
        await deleteEnhancedFile(fileId);
        closeEnhancedFilePreview();
    }
}

// ==============================
// وظائف التقاط الصور المحسنة
// ==============================
function takeEnhancedPhoto() {
    // إنشاء عنصر input للكاميرا
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment'; // استخدام الكاميرا الخلفية
    
    input.onchange = async function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        try {
            // معالجة الصورة الملتقطة
            await processEnhancedFileUploads([file]);
            
        } catch (error) {
            console.error('خطأ في التقاط الصورة:', error);
            showEnhancedToast('فشل في التقاط الصورة', 'error');
        }
    };
    
    input.click();
}

// ==============================
// وظائف الإعدادات
// ==============================
function loadEnhancedAttachmentSettings() {
    try {
        const savedSettings = localStorage.getItem('enhancedAttachmentSettings');
        if (savedSettings) {
            const parsed = JSON.parse(savedSettings);
            enhancedAttachmentSettings = { ...ENHANCED_ATTACHMENT_SETTINGS, ...parsed };
        }
    } catch (error) {
        console.error('خطأ في تحميل الإعدادات:', error);
        enhancedAttachmentSettings = { ...ENHANCED_ATTACHMENT_SETTINGS };
    }
}

function saveEnhancedAttachmentSettings() {
    try {
        localStorage.setItem('enhancedAttachmentSettings', JSON.stringify(enhancedAttachmentSettings));
    } catch (error) {
        console.error('خطأ في حفظ الإعدادات:', error);
    }
}

// ==============================
// وظائف الإحصائيات المحسنة
// ==============================
async function updateEnhancedStorageStats() {
    try {
        const allAttachments = await getAllEnhancedAttachments();
        
        // حساب المساحة المستخدمة
        const totalSize = allAttachments.reduce((sum, att) => sum + (att.size || 0), 0);
        const usedMB = totalSize / (1024 * 1024);
        const maxMB = enhancedAttachmentSettings.maxTotalStorage / (1024 * 1024);
        const usagePercentage = (usedMB / maxMB) * 100;
        
        // تحديث العناصر في الواجهة
        const usedStorage = document.getElementById('enhanced-used-storage');
        const availableStorage = document.getElementById('enhanced-available-storage');
        const storageBar = document.getElementById('enhanced-storage-bar');
        const filesCount = document.getElementById('enhanced-files-count');
        
        if (usedStorage) {
            usedStorage.textContent = `${usedMB.toFixed(1)} MB`;
        }
        
        if (availableStorage) {
            availableStorage.textContent = `${(maxMB - usedMB).toFixed(1)} MB`;
        }
        
        if (storageBar) {
            storageBar.style.width = `${Math.min(usagePercentage, 100)}%`;
            
            // تغيير اللون حسب الاستخدام
            if (usagePercentage > 90) {
                storageBar.style.background = 'linear-gradient(135deg, #dc3545, #c82333)';
            } else if (usagePercentage > 70) {
                storageBar.style.background = 'linear-gradient(135deg, #ffc107, #e0a800)';
            } else {
                storageBar.style.background = 'linear-gradient(135deg, #8e44ad, #9b59b6)';
            }
        }
        
        if (filesCount) {
            filesCount.textContent = allAttachments.length;
        }
        
        // حساب الحالات المرتبطة
        const linkedCases = new Set(allAttachments
            .filter(att => att.fullName)
            .map(att => att.fullName)
        ).size;
        
        const linkedCasesCount = document.getElementById('linked-cases-count');
        if (linkedCasesCount) {
            linkedCasesCount.textContent = linkedCases;
        }
        
    } catch (error) {
        console.error('خطأ في تحديث الإحصائيات:', error);
    }
}

async function updateFolderCounts(allAttachments, linkedAttachments) {
    try {
        const allCount = document.getElementById('all-count');
        const linkedCount = document.getElementById('linked-count');
        const unlinkedCount = document.getElementById('unlinked-count');
        const imagesCount = document.getElementById('images-count');
        const documentsCount = document.getElementById('documents-count');
        
        if (allCount) {
            allCount.textContent = allAttachments.length;
        }
        
        if (linkedCount) {
            linkedCount.textContent = linkedAttachments.length;
        }
        
        if (unlinkedCount) {
            unlinkedCount.textContent = allAttachments.length - linkedAttachments.length;
        }
        
        if (imagesCount) {
            const imageFiles = allAttachments.filter(att => att.type.startsWith('image/'));
            imagesCount.textContent = imageFiles.length;
        }
        
        if (documentsCount) {
            const documentFiles = allAttachments.filter(att => !att.type.startsWith('image/'));
            documentsCount.textContent = documentFiles.length;
        }
        
    } catch (error) {
        console.error('خطأ في تحديث عدد المجلدات:', error);
    }
}

// ==============================
// وظائف عرض الإحصائيات
// ==============================
async function showAttachmentStats() {
    try {
        const allAttachments = await getAllEnhancedAttachments();
        const linkedAttachments = currentCaseData ? 
            await getAttachmentsByMultipleIds(currentCaseData) : [];
        
        // حساب الإحصائيات
        const totalSize = allAttachments.reduce((sum, att) => sum + (att.size || 0), 0);
        const imageFiles = allAttachments.filter(att => att.type.startsWith('image/'));
        const documentFiles = allAttachments.filter(att => !att.type.startsWith('image/'));
        const recentFiles = allAttachments.filter(att => {
            const uploadDate = new Date(att.uploadDate);
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return uploadDate > weekAgo;
        });
        
        const statsHTML = `
            <div style="padding: 20px; background: white; border-radius: 15px; border: 3px solid #8e44ad;">
                <h3 style="color: #8e44ad; margin-bottom: 20px; text-align: center;">📊 إحصائيات المرفقات</h3>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px;">
                    <div style="background: linear-gradient(135deg, #8e44ad, #9b59b6); color: white; padding: 15px; border-radius: 10px; text-align: center;">
                        <div style="font-size: 24px; font-weight: bold;">${allAttachments.length}</div>
                        <div style="font-size: 14px;">إجمالي المرفقات</div>
                    </div>
                    
                    <div style="background: linear-gradient(135deg, #28a745, #20c997); color: white; padding: 15px; border-radius: 10px; text-align: center;">
                        <div style="font-size: 24px; font-weight: bold;">${linkedAttachments.length}</div>
                        <div style="font-size: 14px;">مرفقات هذه الحالة</div>
                    </div>
                    
                    <div style="background: linear-gradient(135deg, #17a2b8, #138496); color: white; padding: 15px; border-radius: 10px; text-align: center;">
                        <div style="font-size: 24px; font-weight: bold;">${imageFiles.length}</div>
                        <div style="font-size: 14px;">الصور</div>
                    </div>
                    
                    <div style="background: linear-gradient(135deg, #dc3545, #c82333); color: white; padding: 15px; border-radius: 10px; text-align: center;">
                        <div style="font-size: 24px; font-weight: bold;">${documentFiles.length}</div>
                        <div style="font-size: 14px;">المستندات</div>
                    </div>
                </div>
                
                <div style="margin-top: 20px;">
                    <h4 style="color: #495057; margin-bottom: 10px;">معلومات التخزين:</h4>
                    <p><strong>المساحة المستخدمة:</strong> ${formatFileSize(totalSize)}</p>
                    <p><strong>الملفات الحديثة (أسبوع):</strong> ${recentFiles.length} ملف</p>
                    <p><strong>متوسط حجم الملف:</strong> ${allAttachments.length > 0 ? formatFileSize(totalSize / allAttachments.length) : '0 B'}</p>
                </div>
                
                <div style="text-align: center; margin-top: 20px;">
                    <button onclick="closeStatsModal()" style="background: #6c757d; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer;">
                        إغلاق
                    </button>
                </div>
            </div>
        `;
        
        // إنشاء نافذة الإحصائيات
        const statsModal = document.createElement('div');
        statsModal.id = 'stats-modal';
        statsModal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(0,0,0,0.8); z-index: 10002;
            display: flex; justify-content: center; align-items: center; padding: 20px;
        `;
        statsModal.innerHTML = statsHTML;
        
        document.body.appendChild(statsModal);
        
        // إغلاق عند النقر خارج النافذة
        statsModal.addEventListener('click', (e) => {
            if (e.target === statsModal) {
                closeStatsModal();
            }
        });
        
    } catch (error) {
        console.error('خطأ في عرض الإحصائيات:', error);
        showEnhancedToast('فشل في عرض الإحصائيات', 'error');
    }
}

function closeStatsModal() {
    const statsModal = document.getElementById('stats-modal');
    if (statsModal) {
        statsModal.remove();
    }
}

// ==============================
// وظائف المجلدات
// ==============================
function setupEnhancedEventListeners() {
    // إعداد مستمعي أحداث المجلدات
    const folderItems = document.querySelectorAll('.folder-item');
    folderItems.forEach(item => {
        item.addEventListener('click', () => {
            // إزالة التحديد من جميع المجلدات
            folderItems.forEach(f => f.classList.remove('active'));
            
            // تحديد المجلد الحالي
            item.classList.add('active');
            
            // فلترة الملفات حسب المجلد
            const folder = item.dataset.folder;
            filterFilesByFolder(folder);
        });
    });
}

function filterFilesByFolder(folder) {
    const fileItems = document.querySelectorAll('.enhanced-file-item');
    
    fileItems.forEach(item => {
        let shouldShow = true;
        
        switch (folder) {
            case 'linked':
                shouldShow = item.classList.contains('linked-file');
                break;
            case 'unlinked':
                shouldShow = item.classList.contains('unlinked-file');
                break;
            case 'images':
                shouldShow = item.dataset.fileType?.startsWith('image/');
                break;
            case 'documents':
                shouldShow = !item.dataset.fileType?.startsWith('image/');
                break;
            case 'all':
            default:
                shouldShow = true;
                break;
        }
        
        item.style.display = shouldShow ? '' : 'none';
    });
    
    updateEnhancedSelectionInfo();
}

// ==============================
// تهيئة النظام عند تحميل الصفحة
// ==============================
document.addEventListener('DOMContentLoaded', function() {
    // تأخير بسيط للتأكد من تحميل جميع العناصر
    setTimeout(() => {
        initializeEnhancedAttachmentSystem();
    }, 1000);
});

// إضافة Font Awesome إذا لم يكن موجوداً
if (!document.querySelector('link[href*="font-awesome"]')) {
    const fontAwesome = document.createElement('link');
    fontAwesome.rel = 'stylesheet';
    fontAwesome.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css';
    document.head.appendChild(fontAwesome);
}

// تصدير الوظائف الرئيسية للنافذة العمومية
window.enhancedAttachmentSystem = {
    initialize: initializeEnhancedAttachmentSystem,
    openManager: openEnhancedAttachmentManager,
    uploadFiles: uploadEnhancedFiles,
    takePhoto: takeEnhancedPhoto,
    linkToCase: linkFileToCurrentCase,
    showStats: showAttachmentStats,
    closeManager: closeEnhancedFileManager
};

console.log('✅ تم تحميل نظام إدارة المرفقات المحسن بالكامل');
