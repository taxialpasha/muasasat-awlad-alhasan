/**
 * نظام إدارة المرفقات والوثائق المتكامل
 * ملف منفصل لإدارة الصور والملفات مع الحفظ المحلي المتقدم
 * يستخدم IndexedDB للملفات الكبيرة و localStorage للإعدادات
 * 
 * الاستخدام: قم بتضمين هذا الملف في HTML الخاص بك
 * <script src="attachments-system.js"></script>
 */

// ==============================
// إعدادات نظام المرفقات الافتراضية
// ==============================
const DEFAULT_ATTACHMENT_SETTINGS = {
    // إعدادات التخزين
    maxFileSize: 50 * 1024 * 1024, // 50MB للملف الواحد
    maxTotalStorage: 500 * 1024 * 1024, // 500MB إجمالي
    compressionQuality: 0.8, // جودة ضغط الصور (0.1-1.0)
    enableCompression: true, // تفعيل ضغط الصور
    
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
    thumbnailSize: 150, // حجم الصور المصغرة
    showPreview: true, // معاينة سريعة
    showFileInfo: true, // معلومات الملف
    gridView: true, // عرض شبكي أم قائمة
    
    // إعدادات الأمان
    enableEncryption: false, // تشفير الملفات الحساسة
    requireConfirmDelete: true, // تأكيد الحذف
    enableWatermark: false, // علامة مائية على الصور
    
    // إعدادات التصنيف
    autoCategories: true, // تصنيف تلقائي
    allowTags: true, // السماح بالعلامات
    enableSearch: true, // البحث في المرفقات
    
    // إعدادات النسخ الاحتياطي
    autoBackup: true, // نسخ احتياطي تلقائي
    backupFrequency: 'weekly', // تكرار النسخ الاحتياطي
    keepBackupDays: 30 // عدد أيام الاحتفاظ بالنسخ الاحتياطية
};

// ==============================
// متغيرات النظام
// ==============================
let currentAttachmentSettings = { ...DEFAULT_ATTACHMENT_SETTINGS };
let attachmentsDB = null;
let attachmentControlPanel = null;
let attachmentButtons = new Map();
let attachmentViewers = new Map();

// قاعدة بيانات IndexedDB للملفات
const DB_NAME = 'CharityAttachmentsDB';
const DB_VERSION = 1;
const ATTACHMENTS_STORE = 'attachments';
const METADATA_STORE = 'metadata';

// ==============================
// تهيئة نظام المرفقات
// ==============================
function initializeAttachmentSystem() {
    try {
        console.log('🗂️ جاري تهيئة نظام إدارة المرفقات...');
        
        // تحميل الإعدادات المحفوظة
        loadAttachmentSettings();
        
        // تهيئة قاعدة البيانات
        initializeAttachmentsDB()
            .then(() => {
                // إضافة أزرار المرفقات
                addAttachmentButtons();
                
                // إنشاء لوحة التحكم
                createAttachmentControlPanel();
                
                // إضافة الأنماط
                addAttachmentStyles();
                
                // إعداد المستمعين
                setupAttachmentEventListeners();
                
                // إنشاء مدير الملفات
                createFileManager();
                
                console.log('✅ تم تهيئة نظام المرفقات بنجاح');
                showAttachmentToast('🗂️ نظام إدارة المرفقات جاهز للاستخدام', 'success');
                
                // تحديث إحصائيات التخزين
                updateStorageStats();
                
            })
            .catch(error => {
                console.error('❌ خطأ في تهيئة قاعدة البيانات:', error);
                showAttachmentToast('فشل في تهيئة قاعدة البيانات', 'error');
            });
        
    } catch (error) {
        console.error('❌ خطأ في تهيئة نظام المرفقات:', error);
        showAttachmentToast('فشل في تهيئة نظام المرفقات', 'error');
    }
}

// ==============================
// تهيئة قاعدة البيانات
// ==============================
function initializeAttachmentsDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = () => {
            reject(new Error('فشل في فتح قاعدة البيانات'));
        };
        
        request.onsuccess = (event) => {
            attachmentsDB = event.target.result;
            resolve(attachmentsDB);
        };
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            // إنشاء متجر المرفقات
            if (!db.objectStoreNames.contains(ATTACHMENTS_STORE)) {
                const attachmentsStore = db.createObjectStore(ATTACHMENTS_STORE, { keyPath: 'id' });
                attachmentsStore.createIndex('caseId', 'caseId', { unique: false });
                attachmentsStore.createIndex('type', 'type', { unique: false });
                attachmentsStore.createIndex('category', 'category', { unique: false });
                attachmentsStore.createIndex('uploadDate', 'uploadDate', { unique: false });
            }
            
            // إنشاء متجر البيانات الوصفية
            if (!db.objectStoreNames.contains(METADATA_STORE)) {
                const metadataStore = db.createObjectStore(METADATA_STORE, { keyPath: 'key' });
            }
        };
    });
}

// ==============================
// إضافة أزرار المرفقات
// ==============================
function addAttachmentButtons() {
    // البحث عن جميع النماذج والحالات
    const forms = document.querySelectorAll('form, .case-item, .content-section');
    
    forms.forEach(addAttachmentButtonToForm);
    
    // مراقبة إضافة نماذج جديدة
    observeNewForms();
}

function addAttachmentButtonToForm(formElement) {
    // تجاهل النماذج التي تحتوي على زر مرفقات بالفعل
    if (attachmentButtons.has(formElement)) {
        return;
    }
    
    // إنشاء زر المرفقات
    const attachmentButton = createAttachmentButton(formElement);
    
    // إضافة الزر للنموذج
    insertAttachmentButton(formElement, attachmentButton);
    
    // حفظ المرجع
    attachmentButtons.set(formElement, attachmentButton);
}

function createAttachmentButton(formElement) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'attachment-button';
    button.title = 'إدارة المرفقات';
    
    // تحديد معرف الحالة
    const caseId = getCaseIdFromForm(formElement);
    button.setAttribute('data-case-id', caseId);
    
    // أيقونة المجلد
    button.innerHTML = `
        <div class="attachment-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z"/>
            </svg>
            <span class="attachment-count">0</span>
        </div>
        <span class="attachment-label">المرفقات</span>
    `;
    
    // أحداث الزر
    button.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openAttachmentManager(caseId);
    });
    
    // تحديث عدد المرفقات
    updateAttachmentCount(button, caseId);
    
    return button;
}

function insertAttachmentButton(formElement, attachmentButton) {
    // البحث عن أفضل مكان لإدراج الزر
    let insertionPoint = null;
    
    // محاولة العثور على منطقة الأزرار
    const buttonGroups = formElement.querySelectorAll('.btn-group, .form-actions, .buttons');
    if (buttonGroups.length > 0) {
        insertionPoint = buttonGroups[0];
        insertionPoint.appendChild(attachmentButton);
        return;
    }
    
    // محاولة العثور على الزر الأخير
    const lastButton = formElement.querySelector('button:last-of-type');
    if (lastButton) {
        lastButton.parentNode.insertBefore(attachmentButton, lastButton.nextSibling);
        return;
    }
    
    // إضافة في نهاية النموذج
    const wrapper = document.createElement('div');
    wrapper.className = 'attachment-button-wrapper';
    wrapper.appendChild(attachmentButton);
    formElement.appendChild(wrapper);
}

function getCaseIdFromForm(formElement) {
    // محاولة الحصول على معرف الحالة من عدة مصادر
    let caseId = null;
    
    // من data attribute
    caseId = formElement.getAttribute('data-case-id') || 
             formElement.getAttribute('data-id');
    
    if (caseId) return caseId;
    
    // من حقل معرف مخفي
    const hiddenId = formElement.querySelector('input[name="id"], input[name="caseId"]');
    if (hiddenId && hiddenId.value) return hiddenId.value;
    
    // من رقم الاستمارة
    const formNumber = formElement.querySelector('#formNumber, input[name="formNumber"]');
    if (formNumber && formNumber.value) return 'form_' + formNumber.value;
    
    // إنشاء معرف جديد
    caseId = 'case_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    formElement.setAttribute('data-case-id', caseId);
    
    return caseId;
}

// ==============================
// مدير الملفات الرئيسي
// ==============================
function createFileManager() {
    const fileManager = document.createElement('div');
    fileManager.id = 'file-manager-modal';
    fileManager.innerHTML = `
        <div class="file-manager-overlay">
            <div class="file-manager-container">
                <div class="file-manager-header">
                    <h3>🗂️ مدير الملفات</h3>
                    <div class="file-manager-tools">
                        <button class="tool-btn" onclick="toggleFileView()" title="تغيير العرض">
                            <i class="fas fa-th" id="view-toggle-icon"></i>
                        </button>
                        <button class="tool-btn" onclick="openFileManagerSettings()" title="الإعدادات">
                            <i class="fas fa-cog"></i>
                        </button>
                        <button class="tool-btn close-btn" onclick="closeFileManager()" title="إغلاق">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
                
                <div class="file-manager-toolbar">
                    <div class="toolbar-left">
                        <button class="btn btn-primary" onclick="uploadFiles()">
                            <i class="fas fa-cloud-upload-alt"></i>
                            رفع ملفات
                        </button>
                        <button class="btn btn-success" onclick="takePhoto()">
                            <i class="fas fa-camera"></i>
                            التقاط صورة
                        </button>
                        <button class="btn btn-warning" onclick="createFolder()">
                            <i class="fas fa-folder-plus"></i>
                            مجلد جديد
                        </button>
                    </div>
                    <div class="toolbar-right">
                        <div class="search-box">
                            <input type="text" id="file-search" placeholder="البحث في الملفات..." onkeyup="searchFiles()">
                            <i class="fas fa-search"></i>
                        </div>
                        <select id="file-filter" onchange="filterFiles()">
                            <option value="all">جميع الملفات</option>
                            <option value="images">الصور</option>
                            <option value="documents">المستندات</option>
                            <option value="recent">الحديثة</option>
                        </select>
                    </div>
                </div>
                
                <div class="file-manager-content">
                    <div class="file-manager-sidebar">
                        <div class="sidebar-section">
                            <h4>📁 المجلدات</h4>
                            <div class="folder-tree" id="folder-tree">
                                <div class="folder-item active" data-folder="all">
                                    <i class="fas fa-folder-open"></i>
                                    جميع الملفات
                                </div>
                                <div class="folder-item" data-folder="images">
                                    <i class="fas fa-images"></i>
                                    الصور
                                </div>
                                <div class="folder-item" data-folder="documents">
                                    <i class="fas fa-file-alt"></i>
                                    المستندات
                                </div>
                                <div class="folder-item" data-folder="recent">
                                    <i class="fas fa-clock"></i>
                                    الملفات الحديثة
                                </div>
                            </div>
                        </div>
                        
                        <div class="sidebar-section">
                            <h4>📊 إحصائيات التخزين</h4>
                            <div class="storage-stats" id="storage-stats">
                                <div class="stat-item">
                                    <span class="stat-label">المستخدم:</span>
                                    <span class="stat-value" id="used-storage">0 MB</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-label">المتاح:</span>
                                    <span class="stat-value" id="available-storage">500 MB</span>
                                </div>
                                <div class="storage-bar">
                                    <div class="storage-used" id="storage-bar"></div>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-label">عدد الملفات:</span>
                                    <span class="stat-value" id="files-count">0</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="file-manager-main">
                        <div class="files-container" id="files-container">
                            <div class="loading-placeholder">
                                <i class="fas fa-spinner fa-spin"></i>
                                جاري تحميل الملفات...
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="file-manager-footer">
                    <div class="footer-info">
                        <span id="selected-files-info">لم يتم تحديد أي ملف</span>
                    </div>
                    <div class="footer-actions">
                        <button class="btn btn-danger" onclick="deleteSelectedFiles()" disabled id="delete-btn">
                            <i class="fas fa-trash"></i>
                            حذف المحدد
                        </button>
                        <button class="btn btn-primary" onclick="downloadSelectedFiles()" disabled id="download-btn">
                            <i class="fas fa-download"></i>
                            تحميل المحدد
                        </button>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- نافذة معاينة الملف -->
        <div class="file-preview-modal" id="file-preview-modal">
            <div class="preview-overlay" onclick="closeFilePreview()">
                <div class="preview-container" onclick="event.stopPropagation()">
                    <div class="preview-header">
                        <h4 id="preview-title">معاينة الملف</h4>
                        <button class="preview-close" onclick="closeFilePreview()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="preview-content" id="preview-content">
                        <!-- محتوى المعاينة سيتم إدراجه هنا -->
                    </div>
                    <div class="preview-footer">
                        <button class="btn btn-primary" onclick="downloadCurrentFile()">
                            <i class="fas fa-download"></i>
                            تحميل
                        </button>
                        <button class="btn btn-danger" onclick="deleteCurrentFile()">
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

// ==============================
// فتح مدير المرفقات لحالة معينة
// ==============================
function openAttachmentManager(caseId) {
    const fileManager = document.getElementById('file-manager-modal');
    fileManager.style.display = 'block';
    fileManager.setAttribute('data-current-case', caseId);
    
    // تحميل ملفات الحالة
    loadCaseFiles(caseId);
    
    // تحديث إحصائيات التخزين
    updateStorageStats();
    
    document.body.style.overflow = 'hidden';
}

function closeFileManager() {
    const fileManager = document.getElementById('file-manager-modal');
    fileManager.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// ==============================
// تحميل وعرض الملفات
// ==============================
async function loadCaseFiles(caseId) {
    const filesContainer = document.getElementById('files-container');
    filesContainer.innerHTML = '<div class="loading-placeholder"><i class="fas fa-spinner fa-spin"></i> جاري تحميل الملفات...</div>';
    
    try {
        const files = await getCaseAttachments(caseId);
        displayFiles(files);
    } catch (error) {
        console.error('خطأ في تحميل الملفات:', error);
        filesContainer.innerHTML = '<div class="error-placeholder"><i class="fas fa-exclamation-triangle"></i> خطأ في تحميل الملفات</div>';
    }
}

function displayFiles(files) {
    const filesContainer = document.getElementById('files-container');
    
    if (files.length === 0) {
        filesContainer.innerHTML = `
            <div class="empty-placeholder">
                <i class="fas fa-folder-open"></i>
                <h3>لا توجد ملفات</h3>
                <p>ابدأ برفع الملفات والصور الخاصة بهذه الحالة</p>
                <button class="btn btn-primary" onclick="uploadFiles()">
                    <i class="fas fa-cloud-upload-alt"></i>
                    رفع أول ملف
                </button>
            </div>
        `;
        return;
    }
    
    const isGridView = currentAttachmentSettings.gridView;
    filesContainer.className = isGridView ? 'files-container grid-view' : 'files-container list-view';
    
    const filesHTML = files.map(file => createFileElement(file, isGridView)).join('');
    filesContainer.innerHTML = filesHTML;
    
    // إعداد مستمعي الأحداث للملفات الجديدة
    setupFileEventListeners();
}

function createFileElement(file, isGridView) {
    const fileExtension = getFileExtension(file.name);
    const fileIcon = getFileIcon(file.type, fileExtension);
    const fileSize = formatFileSize(file.size);
    const uploadDate = new Date(file.uploadDate).toLocaleDateString('ar-EG');
    
    if (isGridView) {
        return `
            <div class="file-item grid-item" data-file-id="${file.id}" data-file-type="${file.type}">
                <div class="file-checkbox">
                    <input type="checkbox" class="file-select" onchange="updateSelectionInfo()">
                </div>
                <div class="file-thumbnail" onclick="previewFile('${file.id}')">
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
                </div>
                <div class="file-actions">
                    <button class="action-btn" onclick="previewFile('${file.id}')" title="معاينة">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn" onclick="downloadFile('${file.id}')" title="تحميل">
                        <i class="fas fa-download"></i>
                    </button>
                    <button class="action-btn delete-btn" onclick="deleteFile('${file.id}')" title="حذف">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    } else {
        return `
            <div class="file-item list-item" data-file-id="${file.id}" data-file-type="${file.type}">
                <div class="file-checkbox">
                    <input type="checkbox" class="file-select" onchange="updateSelectionInfo()">
                </div>
                <div class="file-icon">${fileIcon}</div>
                <div class="file-details">
                    <div class="file-name">${file.name}</div>
                    <div class="file-meta">
                        <span class="file-type">${getFileTypeLabel(file.type)}</span>
                        <span class="file-size">${fileSize}</span>
                        <span class="file-date">${uploadDate}</span>
                    </div>
                </div>
                <div class="file-actions">
                    <button class="action-btn" onclick="previewFile('${file.id}')" title="معاينة">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn" onclick="downloadFile('${file.id}')" title="تحميل">
                        <i class="fas fa-download"></i>
                    </button>
                    <button class="action-btn delete-btn" onclick="deleteFile('${file.id}')" title="حذف">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }
}

// ==============================
// رفع الملفات
// ==============================
function uploadFiles() {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = [...currentAttachmentSettings.allowedImageTypes, ...currentAttachmentSettings.allowedDocumentTypes].join(',');
    
    input.onchange = async function(e) {
        const files = Array.from(e.target.files);
        
        if (files.length === 0) return;
        
        // التحقق من الملفات
        const validFiles = [];
        const errors = [];
        
        for (const file of files) {
            const validation = validateFile(file);
            if (validation.valid) {
                validFiles.push(file);
            } else {
                errors.push(`${file.name}: ${validation.error}`);
            }
        }
        
        if (errors.length > 0) {
            showAttachmentToast(`فشل في رفع بعض الملفات:\n${errors.join('\n')}`, 'warning');
        }
        
        if (validFiles.length > 0) {
            await processFileUploads(validFiles);
        }
    };
    
    input.click();
}

async function processFileUploads(files) {
    const currentCaseId = document.getElementById('file-manager-modal').getAttribute('data-current-case');
    
    // إنشاء مؤشر التقدم
    const progressModal = createProgressModal(files.length);
    document.body.appendChild(progressModal);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        try {
            updateProgressModal(i + 1, files.length, `جاري رفع ${file.name}...`);
            
            const attachment = await processFileUpload(file, currentCaseId);
            await saveAttachment(attachment);
            
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
        showAttachmentToast(`تم رفع ${successCount} ملف بنجاح`, 'success');
        
        // تحديث العرض
        loadCaseFiles(currentCaseId);
        updateAttachmentCount(getAttachmentButtonByCaseId(currentCaseId), currentCaseId);
        updateStorageStats();
    }
    
    if (errorCount > 0) {
        showAttachmentToast(`فشل في رفع ${errorCount} ملف`, 'error');
    }
}

async function processFileUpload(file, caseId) {
    // إنشاء معرف فريد
    const fileId = generateFileId();
    
    // معالجة الصورة إذا لزم الأمر
    let processedData = null;
    let thumbnail = null;
    
    if (file.type.startsWith('image/')) {
        if (currentAttachmentSettings.enableCompression) {
            processedData = await compressImage(file, currentAttachmentSettings.compressionQuality);
        } else {
            processedData = await fileToBase64(file);
        }
        
        // إنشاء صورة مصغرة
        thumbnail = await createThumbnail(file, currentAttachmentSettings.thumbnailSize);
    } else {
        processedData = await fileToBase64(file);
    }
    
    // إنشاء كائن المرفق
    const attachment = {
        id: fileId,
        caseId: caseId,
        name: file.name,
        type: file.type,
        size: file.size,
        data: processedData,
        thumbnail: thumbnail,
        uploadDate: new Date().toISOString(),
        category: categorizeFile(file),
        tags: extractTags(file.name),
        checksum: await calculateChecksum(processedData)
    };
    
    return attachment;
}

// ==============================
// وظائف معالجة الصور
// ==============================
function compressImage(file, quality) {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = function() {
            // حساب الأبعاد الجديدة
            let { width, height } = calculateOptimalSize(img.width, img.height, 1920, 1080);
            
            canvas.width = width;
            canvas.height = height;
            
            // رسم الصورة المضغوطة
            ctx.drawImage(img, 0, 0, width, height);
            
            // تحويل إلى base64
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
            
            // حساب أبعاد الاقتصاص المربعة
            const minDim = Math.min(img.width, img.height);
            const x = (img.width - minDim) / 2;
            const y = (img.height - minDim) / 2;
            
            // رسم الصورة مقصوصة ومقاسة
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
    
    // تقليل الحجم إذا كان أكبر من الحد الأقصى
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
// التقاط الصور بالكاميرا
// ==============================
function takePhoto() {
    // التحقق من دعم الكاميرا
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        showAttachmentToast('الكاميرا غير مدعومة في هذا المتصفح', 'error');
        return;
    }
    
    // إنشاء نافذة الكاميرا
    const cameraModal = createCameraModal();
    document.body.appendChild(cameraModal);
    
    // بدء الكاميرا
    startCamera();
}

function createCameraModal() {
    const modal = document.createElement('div');
    modal.id = 'camera-modal';
    modal.innerHTML = `
        <div class="camera-overlay">
            <div class="camera-container">
                <div class="camera-header">
                    <h3>📷 التقاط صورة</h3>
                    <button class="camera-close" onclick="closeCameraModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="camera-content">
                    <video id="camera-video" autoplay muted></video>
                    <canvas id="camera-canvas" style="display: none;"></canvas>
                </div>
                <div class="camera-controls">
                    <button class="btn btn-primary" onclick="capturePhoto()">
                        <i class="fas fa-camera"></i>
                        التقاط
                    </button>
                    <button class="btn btn-light" onclick="closeCameraModal()">
                        <i class="fas fa-times"></i>
                        إلغاء
                    </button>
                </div>
            </div>
        </div>
    `;
    
    return modal;
}

async function startCamera() {
    try {
        const video = document.getElementById('camera-video');
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                width: { ideal: 1280 },
                height: { ideal: 720 },
                facingMode: 'environment' // الكاميرا الخلفية للهواتف
            } 
        });
        
        video.srcObject = stream;
        
    } catch (error) {
        console.error('خطأ في بدء الكاميرا:', error);
        showAttachmentToast('فشل في الوصول للكاميرا', 'error');
        closeCameraModal();
    }
}

async function capturePhoto() {
    const video = document.getElementById('camera-video');
    const canvas = document.getElementById('camera-canvas');
    const ctx = canvas.getContext('2d');
    
    // تعيين أبعاد الكانفاس
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // التقاط الإطار الحالي
    ctx.drawImage(video, 0, 0);
    
    // تحويل إلى blob
    canvas.toBlob(async (blob) => {
        // إنشاء ملف من البلوب
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const file = new File([blob], `photo_${timestamp}.jpg`, { type: 'image/jpeg' });
        
        // إغلاق الكاميرا
        closeCameraModal();
        
        // معالجة الملف كرفع عادي
        const currentCaseId = document.getElementById('file-manager-modal').getAttribute('data-current-case');
        
        try {
            const attachment = await processFileUpload(file, currentCaseId);
            await saveAttachment(attachment);
            
            showAttachmentToast('تم التقاط الصورة بنجاح', 'success');
            
            // تحديث العرض
            loadCaseFiles(currentCaseId);
            updateAttachmentCount(getAttachmentButtonByCaseId(currentCaseId), currentCaseId);
            updateStorageStats();
            
        } catch (error) {
            console.error('خطأ في حفظ الصورة:', error);
            showAttachmentToast('فشل في حفظ الصورة', 'error');
        }
    }, 'image/jpeg', 0.8);
}

function closeCameraModal() {
    const modal = document.getElementById('camera-modal');
    const video = document.getElementById('camera-video');
    
    // إيقاف الكاميرا
    if (video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
    }
    
    // إزالة النافذة
    if (modal) {
        document.body.removeChild(modal);
    }
}

// ==============================
// حفظ واسترجاع المرفقات من IndexedDB
// ==============================
async function saveAttachment(attachment) {
    return new Promise((resolve, reject) => {
        const transaction = attachmentsDB.transaction([ATTACHMENTS_STORE], 'readwrite');
        const store = transaction.objectStore(ATTACHMENTS_STORE);
        const request = store.add(attachment);
        
        request.onsuccess = () => resolve(attachment);
        request.onerror = () => reject(new Error('فشل في حفظ المرفق'));
    });
}

async function getCaseAttachments(caseId) {
    return new Promise((resolve, reject) => {
        const transaction = attachmentsDB.transaction([ATTACHMENTS_STORE], 'readonly');
        const store = transaction.objectStore(ATTACHMENTS_STORE);
        const index = store.index('caseId');
        const request = index.getAll(caseId);
        
        request.onsuccess = () => {
            const attachments = request.result || [];
            // ترتيب حسب تاريخ الرفع (الأحدث أولاً)
            attachments.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
            resolve(attachments);
        };
        
        request.onerror = () => reject(new Error('فشل في استرجاع المرفقات'));
    });
}

async function getAttachment(fileId) {
    return new Promise((resolve, reject) => {
        const transaction = attachmentsDB.transaction([ATTACHMENTS_STORE], 'readonly');
        const store = transaction.objectStore(ATTACHMENTS_STORE);
        const request = store.get(fileId);
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(new Error('فشل في استرجاع المرفق'));
    });
}

async function deleteAttachment(fileId) {
    return new Promise((resolve, reject) => {
        const transaction = attachmentsDB.transaction([ATTACHMENTS_STORE], 'readwrite');
        const store = transaction.objectStore(ATTACHMENTS_STORE);
        const request = store.delete(fileId);
        
        request.onsuccess = () => resolve();
        request.onerror = () => reject(new Error('فشل في حذف المرفق'));
    });
}

// ==============================
// معاينة الملفات
// ==============================
async function previewFile(fileId) {
    try {
        const file = await getAttachment(fileId);
        if (!file) {
            showAttachmentToast('الملف غير موجود', 'error');
            return;
        }
        
        const previewModal = document.getElementById('file-preview-modal');
        const previewTitle = document.getElementById('preview-title');
        const previewContent = document.getElementById('preview-content');
        
        previewTitle.textContent = file.name;
        previewModal.setAttribute('data-current-file', fileId);
        
        // إنشاء محتوى المعاينة حسب نوع الملف
        if (file.type.startsWith('image/')) {
            previewContent.innerHTML = `
                <div class="image-preview">
                    <img src="${file.data}" alt="${file.name}" style="max-width: 100%; max-height: 70vh; object-fit: contain;">
                </div>
                <div class="file-details">
                    <p><strong>الحجم:</strong> ${formatFileSize(file.size)}</p>
                    <p><strong>النوع:</strong> ${getFileTypeLabel(file.type)}</p>
                    <p><strong>تاريخ الرفع:</strong> ${new Date(file.uploadDate).toLocaleString('ar-EG')}</p>
                </div>
            `;
        } else if (file.type === 'application/pdf') {
            previewContent.innerHTML = `
                <div class="pdf-preview">
                    <embed src="${file.data}" type="application/pdf" width="100%" height="500px">
                </div>
                <div class="file-details">
                    <p><strong>الحجم:</strong> ${formatFileSize(file.size)}</p>
                    <p><strong>تاريخ الرفع:</strong> ${new Date(file.uploadDate).toLocaleString('ar-EG')}</p>
                </div>
            `;
        } else if (file.type.startsWith('text/')) {
            // قراءة محتوى الملف النصي
            const text = await base64ToText(file.data);
            previewContent.innerHTML = `
                <div class="text-preview">
                    <pre>${text}</pre>
                </div>
                <div class="file-details">
                    <p><strong>الحجم:</strong> ${formatFileSize(file.size)}</p>
                    <p><strong>تاريخ الرفع:</strong> ${new Date(file.uploadDate).toLocaleString('ar-EG')}</p>
                </div>
            `;
        } else {
            previewContent.innerHTML = `
                <div class="file-info-preview">
                    <div class="large-file-icon">
                        ${getFileIcon(file.type, getFileExtension(file.name))}
                    </div>
                    <h3>${file.name}</h3>
                    <div class="file-details">
                        <p><strong>النوع:</strong> ${getFileTypeLabel(file.type)}</p>
                        <p><strong>الحجم:</strong> ${formatFileSize(file.size)}</p>
                        <p><strong>تاريخ الرفع:</strong> ${new Date(file.uploadDate).toLocaleString('ar-EG')}</p>
                    </div>
                    <p class="preview-note">لا يمكن معاينة هذا النوع من الملفات. يمكنك تحميله للاطلاع عليه.</p>
                </div>
            `;
        }
        
        previewModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
    } catch (error) {
        console.error('خطأ في معاينة الملف:', error);
        showAttachmentToast('فشل في معاينة الملف', 'error');
    }
}

function closeFilePreview() {
    const previewModal = document.getElementById('file-preview-modal');
    previewModal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// ==============================
// تحميل وحذف الملفات
// ==============================
async function downloadFile(fileId) {
    try {
        const file = await getAttachment(fileId);
        if (!file) {
            showAttachmentToast('الملف غير موجود', 'error');
            return;
        }
        
        // تحويل base64 إلى blob
        const byteCharacters = atob(file.data.split(',')[1]);
        const byteNumbers = new Array(byteCharacters.length);
        
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: file.type });
        
        // إنشاء رابط التحميل
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = file.name;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
        
        showAttachmentToast(`تم تحميل ${file.name}`, 'success');
        
    } catch (error) {
        console.error('خطأ في تحميل الملف:', error);
        showAttachmentToast('فشل في تحميل الملف', 'error');
    }
}

async function deleteFile(fileId) {
    if (!currentAttachmentSettings.requireConfirmDelete || 
        confirm('هل أنت متأكد من حذف هذا الملف؟ لا يمكن التراجع عن هذا الإجراء.')) {
        
        try {
            await deleteAttachment(fileId);
            
            showAttachmentToast('تم حذف الملف بنجاح', 'success');
            
            // تحديث العرض
            const currentCaseId = document.getElementById('file-manager-modal').getAttribute('data-current-case');
            loadCaseFiles(currentCaseId);
            updateAttachmentCount(getAttachmentButtonByCaseId(currentCaseId), currentCaseId);
            updateStorageStats();
            
        } catch (error) {
            console.error('خطأ في حذف الملف:', error);
            showAttachmentToast('فشل في حذف الملف', 'error');
        }
    }
}

// ==============================
// وظائف مساعدة
// ==============================
function validateFile(file) {
    // التحقق من نوع الملف
    const allowedTypes = [...currentAttachmentSettings.allowedImageTypes, ...currentAttachmentSettings.allowedDocumentTypes];
    if (!allowedTypes.includes(file.type)) {
        return { valid: false, error: 'نوع الملف غير مدعوم' };
    }
    
    // التحقق من حجم الملف
    if (file.size > currentAttachmentSettings.maxFileSize) {
        return { valid: false, error: `حجم الملف أكبر من ${formatFileSize(currentAttachmentSettings.maxFileSize)}` };
    }
    
    return { valid: true };
}

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

function extractTags(filename) {
    // استخراج الكلمات المفتاحية من اسم الملف
    const words = filename.toLowerCase()
        .replace(/[^\w\s\u0600-\u06FF]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 2);
    
    return [...new Set(words)]; // إزالة الكلمات المكررة
}

function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
}

function generateFileId() {
    return 'file_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

async function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

async function base64ToText(base64Data) {
    const base64 = base64Data.split(',')[1];
    const text = atob(base64);
    return text;
}

async function calculateChecksum(data) {
    // حساب checksum بسيط للتحقق من سلامة الملف
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
        const char = data.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // تحويل إلى 32bit integer
    }
    return hash.toString(16);
}

// ==============================
// تحديث عدد المرفقات في الأزرار
// ==============================
async function updateAttachmentCount(button, caseId) {
    if (!button) return;
    
    try {
        const attachments = await getCaseAttachments(caseId);
        const countElement = button.querySelector('.attachment-count');
        if (countElement) {
            countElement.textContent = attachments.length;
            countElement.style.display = attachments.length > 0 ? 'block' : 'none';
        }
    } catch (error) {
        console.error('خطأ في تحديث عدد المرفقات:', error);
    }
}

function getAttachmentButtonByCaseId(caseId) {
    for (const [form, button] of attachmentButtons) {
        if (button.getAttribute('data-case-id') === caseId) {
            return button;
        }
    }
    return null;
}

// ==============================
// إحصائيات التخزين
// ==============================
async function updateStorageStats() {
    try {
        const stats = await getStorageStats();
        
        const usedElement = document.getElementById('used-storage');
        const availableElement = document.getElementById('available-storage');
        const filesCountElement = document.getElementById('files-count');
        const storageBarElement = document.getElementById('storage-bar');
        
        if (usedElement) usedElement.textContent = formatFileSize(stats.used);
        if (availableElement) availableElement.textContent = formatFileSize(stats.available);
        if (filesCountElement) filesCountElement.textContent = stats.count;
        
        if (storageBarElement) {
            const percentage = (stats.used / currentAttachmentSettings.maxTotalStorage) * 100;
            storageBarElement.style.width = percentage + '%';
            
            // تغيير اللون حسب النسبة
            if (percentage > 90) {
                storageBarElement.style.backgroundColor = '#dc3545'; // أحمر
            } else if (percentage > 70) {
                storageBarElement.style.backgroundColor = '#ffc107'; // أصفر
            } else {
                storageBarElement.style.backgroundColor = '#28a745'; // أخضر
            }
        }
        
    } catch (error) {
        console.error('خطأ في تحديث إحصائيات التخزين:', error);
    }
}

async function getStorageStats() {
    return new Promise((resolve, reject) => {
        const transaction = attachmentsDB.transaction([ATTACHMENTS_STORE], 'readonly');
        const store = transaction.objectStore(ATTACHMENTS_STORE);
        const request = store.getAll();
        
        request.onsuccess = () => {
            const attachments = request.result || [];
            const totalUsed = attachments.reduce((sum, att) => sum + att.size, 0);
            const available = Math.max(0, currentAttachmentSettings.maxTotalStorage - totalUsed);
            
            resolve({
                used: totalUsed,
                available: available,
                count: attachments.length
            });
        };
        
        request.onerror = () => reject(new Error('فشل في حساب إحصائيات التخزين'));
    });
}

// ==============================
// إضافة الأنماط
// ==============================
function addAttachmentStyles() {
    if (document.getElementById('attachment-system-styles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'attachment-system-styles';
    styles.textContent = `
        /* أزرار المرفقات */
        .attachment-button {
            background: linear-gradient(135deg, #6f42c1, #5a359a);
            border: none;
            border-radius: 8px;
            color: white;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 10px 15px;
            font-size: 14px;
            font-weight: 500;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
            min-width: 120px;
            justify-content: center;
        }
        
        .attachment-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(111, 66, 193, 0.3);
        }
        
        .attachment-icon {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .attachment-icon svg {
            width: 18px;
            height: 18px;
        }
        
        .attachment-count {
            position: absolute;
            top: -8px;
            right: -8px;
            background: #dc3545;
            color: white;
            border-radius: 50%;
            width: 18px;
            height: 18px;
            font-size: 10px;
            font-weight: 600;
            display: none;
            align-items: center;
            justify-content: center;
            border: 2px solid white;
        }
        
        .attachment-button-wrapper {
            margin-top: 15px;
            text-align: center;
        }
        
        /* مدير الملفات */
        #file-manager-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            z-index: 10000;
            display: none;
        }
        
        .file-manager-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }
        
        .file-manager-container {
            background: white;
            border-radius: 15px;
            width: 100%;
            max-width: 1200px;
            height: 90vh;
            overflow: hidden;
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
            display: flex;
            flex-direction: column;
        }
        
        .file-manager-header {
            background: linear-gradient(135deg, #6f42c1, #5a359a);
            color: white;
            padding: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .file-manager-header h3 {
            margin: 0;
            font-size: 20px;
            font-weight: 600;
        }
        
        .file-manager-tools {
            display: flex;
            gap: 10px;
        }
        
        .tool-btn {
            background: rgba(255, 255, 255, 0.2);
            border: none;
            color: white;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.3s;
        }
        
        .tool-btn:hover {
            background: rgba(255, 255, 255, 0.3);
        }
        
        .file-manager-toolbar {
            background: #f8f9fa;
            padding: 15px 20px;
            border-bottom: 1px solid #e3e6f0;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 15px;
        }
        
        .toolbar-left {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
        }
        
        .toolbar-right {
            display: flex;
            gap: 10px;
            align-items: center;
            flex-wrap: wrap;
        }
        
        .search-box {
            position: relative;
        }
        
        .search-box input {
            padding: 8px 35px 8px 12px;
            border: 2px solid #e3e6f0;
            border-radius: 6px;
            font-size: 14px;
            min-width: 200px;
        }
        
        .search-box i {
            position: absolute;
            right: 12px;
            top: 50%;
            transform: translateY(-50%);
            color: #6c757d;
        }
        
        .file-manager-content {
            flex: 1;
            display: flex;
            overflow: hidden;
        }
        
        .file-manager-sidebar {
            width: 250px;
            background: #f8f9fa;
            border-right: 1px solid #e3e6f0;
            overflow-y: auto;
            padding: 20px;
        }
        
        .sidebar-section {
            margin-bottom: 25px;
        }
        
        .sidebar-section h4 {
            color: #495057;
            margin-bottom: 12px;
            font-size: 14px;
            font-weight: 600;
        }
        
        .folder-tree {
            display: flex;
            flex-direction: column;
            gap: 5px;
        }
        
        .folder-item {
            padding: 10px 12px;
            border-radius: 6px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
            transition: background 0.3s;
        }
        
        .folder-item:hover {
            background: #e9ecef;
        }
        
        .folder-item.active {
            background: #6f42c1;
            color: white;
        }
        
        .storage-stats {
            background: white;
            border-radius: 8px;
            padding: 15px;
            border: 1px solid #e3e6f0;
        }
        
        .stat-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 13px;
        }
        
        .stat-label {
            color: #6c757d;
        }
        
        .stat-value {
            font-weight: 600;
            color: #495057;
        }
        
        .storage-bar {
            height: 8px;
            background: #e9ecef;
            border-radius: 4px;
            margin: 10px 0;
            overflow: hidden;
        }
        
        .storage-used {
            height: 100%;
            background: #28a745;
            transition: width 0.3s ease;
        }
        
        .file-manager-main {
            flex: 1;
            overflow-y: auto;
            padding: 20px;
        }
        
        .files-container {
            display: grid;
            gap: 15px;
        }
        
        .files-container.grid-view {
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        }
        
        .files-container.list-view {
            grid-template-columns: 1fr;
        }
        
        .file-item {
            background: white;
            border: 2px solid #e3e6f0;
            border-radius: 10px;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        }
        
        .file-item:hover {
            border-color: #6f42c1;
            box-shadow: 0 4px 15px rgba(111, 66, 193, 0.1);
        }
        
        .file-item.grid-item {
            aspect-ratio: 1;
            display: flex;
            flex-direction: column;
        }
        
        .file-item.list-item {
            display: flex;
            align-items: center;
            padding: 15px;
            gap: 15px;
        }
        
        .file-checkbox {
            position: absolute;
            top: 10px;
            left: 10px;
            z-index: 10;
        }
        
        .file-checkbox input {
            width: 18px;
            height: 18px;
            cursor: pointer;
        }
        
        .file-thumbnail {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            overflow: hidden;
        }
        
        .file-thumbnail img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        
        .file-icon-large {
            font-size: 48px;
            color: #6c757d;
        }
        
        .file-icon {
            font-size: 24px;
            color: #6c757d;
        }
        
        .file-info {
            padding: 12px;
            border-top: 1px solid #e3e6f0;
        }
        
        .file-details {
            flex: 1;
        }
        
        .file-name {
            font-weight: 600;
            color: #495057;
            margin-bottom: 4px;
            font-size: 14px;
        }
        
        .file-meta {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            font-size: 12px;
            color: #6c757d;
        }
        
        .file-actions {
            display: flex;
            gap: 5px;
            padding: 8px;
            justify-content: center;
            border-top: 1px solid #e3e6f0;
        }
        
        .list-item .file-actions {
            border: none;
            padding: 0;
        }
        
        .action-btn {
            background: #f8f9fa;
            border: 1px solid #e3e6f0;
            color: #495057;
            width: 32px;
            height: 32px;
            border-radius: 6px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s;
            font-size: 12px;
        }
        
        .action-btn:hover {
            background: #e9ecef;
            transform: translateY(-1px);
        }
        
        .action-btn.delete-btn:hover {
            background: #dc3545;
            color: white;
            border-color: #dc3545;
        }
        
        .file-manager-footer {
            background: #f8f9fa;
            border-top: 1px solid #e3e6f0;
            padding: 15px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .footer-info {
            font-size: 14px;
            color: #6c757d;
        }
        
        .footer-actions {
            display: flex;
            gap: 10px;
        }
        
        /* معاينة الملفات */
        .file-preview-modal {
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
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }
        
        .preview-container {
            background: white;
            border-radius: 15px;
            max-width: 90vw;
            max-height: 90vh;
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }
        
        .preview-header {
            background: #6f42c1;
            color: white;
            padding: 15px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .preview-header h4 {
            margin: 0;
            font-size: 16px;
        }
        
        .preview-close {
            background: rgba(255, 255, 255, 0.2);
            border: none;
            color: white;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .preview-content {
            flex: 1;
            overflow: auto;
            padding: 20px;
            max-height: 70vh;
        }
        
        .preview-footer {
            background: #f8f9fa;
            padding: 15px 20px;
            display: flex;
            gap: 10px;
            justify-content: center;
        }
        
        .image-preview img {
            display: block;
            margin: 0 auto;
            border-radius: 8px;
        }
        
        .file-details {
            margin-top: 15px;
            padding-top: 15px;
            border-top: 1px solid #e3e6f0;
        }
        
        .file-details p {
            margin: 5px 0;
            color: #6c757d;
        }
        
        .text-preview pre {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            font-family: 'Courier New', monospace;
            font-size: 13px;
            overflow: auto;
            max-height: 400px;
        }
        
        .file-info-preview {
            text-align: center;
            padding: 20px;
        }
        
        .large-file-icon {
            font-size: 80px;
            color: #6c757d;
            margin-bottom: 15px;
        }
        
        .preview-note {
            color: #6c757d;
            font-style: italic;
            margin-top: 15px;
        }
        
        /* الكاميرا */
        #camera-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            z-index: 10002;
        }
        
        .camera-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }
        
        .camera-container {
            background: white;
            border-radius: 15px;
            overflow: hidden;
            max-width: 600px;
            width: 100%;
        }
        
        .camera-header {
            background: #6f42c1;
            color: white;
            padding: 15px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .camera-header h3 {
            margin: 0;
            font-size: 18px;
        }
        
        .camera-close {
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
        }
        
        .camera-content {
            position: relative;
            background: #000;
        }
        
        #camera-video {
            width: 100%;
            height: auto;
            display: block;
        }
        
        .camera-controls {
            padding: 20px;
            display: flex;
            gap: 15px;
            justify-content: center;
        }
        
        /* مؤشر التقدم */
        .progress-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.8);
            z-index: 10003;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        
        .progress-container {
            background: white;
            border-radius: 15px;
            padding: 30px;
            min-width: 400px;
            text-align: center;
        }
        
        .progress-title {
            margin-bottom: 20px;
            font-size: 18px;
            font-weight: 600;
        }
        
        .progress-bar {
            width: 100%;
            height: 8px;
            background: #e9ecef;
            border-radius: 4px;
            overflow: hidden;
            margin-bottom: 15px;
        }
        
        .progress-fill {
            height: 100%;
            background: #6f42c1;
            transition: width 0.3s ease;
        }
        
        .progress-text {
            color: #6c757d;
            font-size: 14px;
        }
        
        /* رسائل فارغة */
        .empty-placeholder, .loading-placeholder, .error-placeholder {
            text-align: center;
            padding: 60px 20px;
            color: #6c757d;
        }
        
        .empty-placeholder i, .loading-placeholder i, .error-placeholder i {
            font-size: 48px;
            margin-bottom: 15px;
            display: block;
        }
        
        .empty-placeholder h3 {
            margin: 15px 0 10px;
            color: #495057;
        }
        
        .loading-placeholder i {
            animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        
        /* أزرار */
        .btn {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 8px 16px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            text-decoration: none;
            transition: all 0.3s;
            justify-content: center;
        }
        
        .btn:hover {
            transform: translateY(-1px);
        }
        
        .btn-primary {
            background: #007bff;
            color: white;
        }
        
        .btn-primary:hover {
            background: #0056b3;
        }
        
        .btn-success {
            background: #28a745;
            color: white;
        }
        
        .btn-success:hover {
            background: #1e7e34;
        }
        
        .btn-warning {
            background: #ffc107;
            color: #212529;
        }
        
        .btn-warning:hover {
            background: #e0a800;
        }
        
        .btn-danger {
            background: #dc3545;
            color: white;
        }
        
        .btn-danger:hover {
            background: #c82333;
        }
        
        .btn-light {
            background: #f8f9fa;
            color: #495057;
            border: 1px solid #e3e6f0;
        }
        
        .btn-light:hover {
            background: #e9ecef;
        }
        
        .btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
        }
        
        /* إشعارات */
        .attachment-toast {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #6f42c1;
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            z-index: 10004;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            transform: translateX(100%);
            transition: transform 0.3s ease;
            max-width: 350px;
            word-wrap: break-word;
        }
        
        .attachment-toast.show {
            transform: translateX(0);
        }
        
        .attachment-toast.success {
            background: #28a745;
        }
        
        .attachment-toast.error {
            background: #dc3545;
        }
        
        .attachment-toast.warning {
            background: #ffc107;
            color: #212529;
        }
        
        .attachment-toast.info {
            background: #17a2b8;
        }
        
        /* تحسينات للهواتف */
        @media (max-width: 768px) {
            .file-manager-container {
                height: 95vh;
                margin: 10px;
                width: calc(100% - 20px);
            }
            
            .file-manager-toolbar {
                flex-direction: column;
                gap: 10px;
            }
            
            .toolbar-left, .toolbar-right {
                width: 100%;
                justify-content: center;
            }
            
            .search-box input {
                min-width: 100%;
            }
            
            .file-manager-content {
                flex-direction: column;
            }
            
            .file-manager-sidebar {
                width: 100%;
                max-height: 200px;
                padding: 15px;
            }
            
            .files-container.grid-view {
                grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            }
            
            .preview-container {
                max-width: 95vw;
                max-height: 95vh;
            }
            
            .camera-container {
                margin: 10px;
                width: calc(100% - 20px);
            }
            
            .attachment-toast {
                right: 10px;
                left: 10px;
                max-width: none;
            }
        }
    `;
    
    document.head.appendChild(styles);
}

// ==============================
// مستمعي الأحداث
// ==============================
function setupAttachmentEventListeners() {
    // مراقبة إضافة نماذج جديدة
    observeNewForms();
}

function observeNewForms() {
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            mutation.addedNodes.forEach(function(node) {
                if (node.nodeType === 1) {
                    // البحث عن النماذج الجديدة
                    const newForms = node.querySelectorAll ? 
                        node.querySelectorAll('form, .case-item, .content-section') : 
                        [];
                    
                    newForms.forEach(addAttachmentButtonToForm);
                    
                    // إذا كان العنصر نفسه نموذج
                    if (node.matches && node.matches('form, .case-item, .content-section')) {
                        addAttachmentButtonToForm(node);
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

function setupFileEventListeners() {
    // إعداد مستمعي أحداث اختيار الملفات
    const checkboxes = document.querySelectorAll('.file-select');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', updateSelectionInfo);
    });
}

// ==============================
// وظائف مساعدة إضافية
// ==============================
function createProgressModal(totalFiles) {
    const modal = document.createElement('div');
    modal.className = 'progress-modal';
    modal.innerHTML = `
        <div class="progress-container">
            <div class="progress-title">جاري رفع الملفات...</div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: 0%"></div>
            </div>
            <div class="progress-text">0 من ${totalFiles}</div>
        </div>
    `;
    
    return modal;
}

function updateProgressModal(current, total, message) {
    const progressFill = document.querySelector('.progress-fill');
    const progressText = document.querySelector('.progress-text');
    const progressTitle = document.querySelector('.progress-title');
    
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

function updateSelectionInfo() {
    const selectedFiles = document.querySelectorAll('.file-select:checked');
    const infoElement = document.getElementById('selected-files-info');
    const deleteBtn = document.getElementById('delete-btn');
    const downloadBtn = document.getElementById('download-btn');
    
    if (selectedFiles.length === 0) {
        if (infoElement) infoElement.textContent = 'لم يتم تحديد أي ملف';
        if (deleteBtn) deleteBtn.disabled = true;
        if (downloadBtn) downloadBtn.disabled = true;
    } else {
        if (infoElement) infoElement.textContent = `تم تحديد ${selectedFiles.length} ملف`;
        if (deleteBtn) deleteBtn.disabled = false;
        if (downloadBtn) downloadBtn.disabled = false;
    }
}

function toggleFileView() {
    currentAttachmentSettings.gridView = !currentAttachmentSettings.gridView;
    
    const viewIcon = document.getElementById('view-toggle-icon');
    if (viewIcon) {
        viewIcon.className = currentAttachmentSettings.gridView ? 'fas fa-list' : 'fas fa-th';
    }
    
    // إعادة تحميل العرض
    const currentCaseId = document.getElementById('file-manager-modal').getAttribute('data-current-case');
    loadCaseFiles(currentCaseId);
}

function searchFiles() {
    const searchTerm = document.getElementById('file-search').value.toLowerCase();
    const fileItems = document.querySelectorAll('.file-item');
    
    fileItems.forEach(item => {
        const fileName = item.querySelector('.file-name').textContent.toLowerCase();
        const shouldShow = fileName.includes(searchTerm);
        item.style.display = shouldShow ? 'block' : 'none';
    });
}

function filterFiles() {
    const filterValue = document.getElementById('file-filter').value;
    const fileItems = document.querySelectorAll('.file-item');
    
    fileItems.forEach(item => {
        const fileType = item.getAttribute('data-file-type');
        let shouldShow = true;
        
        switch(filterValue) {
            case 'images':
                shouldShow = fileType.startsWith('image/');
                break;
            case 'documents':
                shouldShow = !fileType.startsWith('image/');
                break;
            case 'recent':
                // إظهار الملفات من آخر 7 أيام
                const uploadDate = new Date(item.querySelector('.file-date').textContent);
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                shouldShow = uploadDate > weekAgo;
                break;
            case 'all':
            default:
                shouldShow = true;
        }
        
        item.style.display = shouldShow ? 'block' : 'none';
    });
}

// ==============================
// وظائف الإعدادات المتقدمة
// ==============================
function createAttachmentControlPanel() {
    // سيتم تنفيذها في تحديث لاحق
    console.log('لوحة تحكم المرفقات ستكون متاحة قريباً');
}

function loadAttachmentSettings() {
    try {
        const savedSettings = localStorage.getItem('charity_attachment_settings');
        if (savedSettings) {
            const parsedSettings = JSON.parse(savedSettings);
            currentAttachmentSettings = { ...DEFAULT_ATTACHMENT_SETTINGS, ...parsedSettings };
            console.log('تم تحميل إعدادات المرفقات المحفوظة');
        }
    } catch (error) {
        console.error('خطأ في تحميل إعدادات المرفقات:', error);
        currentAttachmentSettings = { ...DEFAULT_ATTACHMENT_SETTINGS };
    }
}

function saveAttachmentSettings() {
    try {
        localStorage.setItem('charity_attachment_settings', JSON.stringify(currentAttachmentSettings));
        console.log('تم حفظ إعدادات المرفقات');
        return true;
    } catch (error) {
        console.error('خطأ في حفظ إعدادات المرفقات:', error);
        return false;
    }
}

// ==============================
// وظائف الإشعارات
// ==============================
function showAttachmentToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `attachment-toast ${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (document.body.contains(toast)) {
                document.body.removeChild(toast);
            }
        }, 300);
    }, 4000);
}

// ==============================
// تهيئة النظام عند تحميل الصفحة
// ==============================
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        initializeAttachmentSystem();
    }, 2000);
});

// ==============================
// إتاحة الوظائف عالمياً
// ==============================
window.attachmentSystem = {
    open: openAttachmentManager,
    close: closeFileManager,
    upload: uploadFiles,
    camera: takePhoto,
    settings: currentAttachmentSettings,
    stats: getStorageStats
};

// ==============================
// معالج الأخطاء
// ==============================
window.addEventListener('error', function(e) {
    if (e.filename && e.filename.includes('attachments-system')) {
        console.error('خطأ في نظام المرفقات:', e.error);
    }
});

console.log('🗂️ تم تحميل نظام إدارة المرفقات والوثائق بنجاح!');
console.log('💡 استخدم attachmentSystem للتحكم البرمجي');
