
/**
 * نظام إدارة المرفقات والوثائق المتكامل
 * ملف منفصل لإدارة جميع المرفقات والوثائق في النظام
 * يدعم الصور، PDF، Word، Excel مع معاينة وحماية وضغط
 * 
 * الاستخدام: قم بتضمين هذا الملف في HTML الخاص بك
 * <script src="attachments-manager.js"></script>
 */

// ==============================
// إعدادات نظام المرفقات الافتراضية
// ==============================
const DEFAULT_ATTACHMENT_SETTINGS = {
    // إعدادات الرفع
    maxFileSize: 10 * 1024 * 1024, // 10 MB
    maxFilesPerCase: 20, // حد أقصى 20 ملف لكل حالة
    allowedFileTypes: [
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf',
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain', 'text/csv'
    ],
    
    // إعدادات الضغط
    compressImages: true,
    imageQuality: 0.8, // جودة الضغط (0.1 - 1.0)
    maxImageWidth: 1920,
    maxImageHeight: 1080,
    
    // إعدادات الأمان
    enableEncryption: false, // تشفير الملفات الحساسة
    passwordProtection: false, // حماية بكلمة مرور
    virusScan: false, // فحص الفيروسات (محاكاة)
    
    // إعدادات العرض
    showThumbnails: true, // معاينة مصغرة
    gridView: true, // عرض شبكي
    sortBy: 'date', // ترتيب حسب (date, name, size, type)
    sortOrder: 'desc', // ترتيب (asc, desc)
    
    // إعدادات التخزين
    useLocalStorage: true, // تخزين محلي
    autoBackup: true, // نسخ احتياطي تلقائي
    backupInterval: 24 * 60 * 60 * 1000, // كل 24 ساعة
    
    // إعدادات الواجهة
    showAttachmentButton: true, // زر المرفقات
    buttonPosition: 'top', // موقع الزر (top, bottom, floating)
    compactMode: false, // وضع مضغوط
    darkMode: false // الوضع المظلم
};

// ==============================
// متغيرات النظام
// ==============================
let currentAttachmentSettings = { ...DEFAULT_ATTACHMENT_SETTINGS };
let attachmentsData = new Map(); // خريطة المرفقات حسب الحالة
let attachmentButtons = new Map(); // أزرار المرفقات
let attachmentManager = null; // مدير المرفقات الرئيسي
let currentCaseId = null; // ID الحالة الحالية
let attachmentViewer = null; // عارض المرفقات

// قاعدة بيانات المرفقات
let attachmentDatabase = {
    files: new Map(), // الملفات الفعلية
    metadata: new Map(), // بيانات الملفات
    folders: new Map(), // المجلدات
    thumbnails: new Map(), // المعاينات المصغرة
    index: new Map() // فهرس للبحث السريع
};

// أنواع الملفات المدعومة
const FILE_TYPES = {
    images: {
        extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'],
        icon: '🖼️',
        color: '#e74c3c',
        category: 'صور'
    },
    documents: {
        extensions: ['pdf'],
        icon: '📄',
        color: '#e74c3c',
        category: 'مستندات'
    },
    word: {
        extensions: ['doc', 'docx'],
        icon: '📝',
        color: '#2980b9',
        category: 'وورد'
    },
    excel: {
        extensions: ['xls', 'xlsx', 'csv'],
        icon: '📊',
        color: '#27ae60',
        category: 'اكسل'
    },
    text: {
        extensions: ['txt'],
        icon: '📃',
        color: '#95a5a6',
        category: 'نص'
    },
    other: {
        extensions: ['*'],
        icon: '📁',
        color: '#95a5a6',
        category: 'أخرى'
    }
};

// ==============================
// تهيئة نظام المرفقات
// ==============================
function initializeAttachmentSystem() {
    try {
        console.log('🔄 بدء تهيئة نظام المرفقات...');
        
        // تحميل الإعدادات المحفوظة
        loadAttachmentSettings();
        
        // تحميل قاعدة بيانات المرفقات
        loadAttachmentDatabase();
        
        // إنشاء مدير المرفقات
        createAttachmentManager();
        
        // إضافة أزرار المرفقات
        addAttachmentButtons();
        
        // إعداد معالجات السحب والإفلات
        setupDragAndDrop();
        
        // إعداد مستمعي الأحداث
        setupAttachmentEventListeners();
        
        // بدء النسخ الاحتياطي التلقائي
        startAutoBackup();
        
        console.log('✅ تم تهيئة نظام المرفقات بنجاح');
        showAttachmentToast('📎 نظام إدارة المرفقات جاهز للاستخدام', 'success');
        
    } catch (error) {
        console.error('❌ خطأ في تهيئة نظام المرفقات:', error);
        showAttachmentToast('فشل في تهيئة نظام المرفقات', 'error');
    }
}

// ==============================
// إنشاء مدير المرفقات الرئيسي
// ==============================
function createAttachmentManager() {
    const manager = document.createElement('div');
    manager.id = 'attachment-manager';
    manager.innerHTML = `
        <div class="attachment-overlay">
            <div class="attachment-container">
                <div class="attachment-header">
                    <div class="attachment-title">
                        <h3>📎 إدارة المرفقات والوثائق</h3>
                        <span class="case-info" id="current-case-info">لم يتم تحديد حالة</span>
                    </div>
                    <div class="attachment-actions">
                        <button class="attachment-btn upload-btn" onclick="triggerFileUpload()">
                            <i class="fas fa-upload"></i> رفع ملفات
                        </button>
                        <button class="attachment-btn folder-btn" onclick="createNewFolder()">
                            <i class="fas fa-folder-plus"></i> مجلد جديد
                        </button>
                        <button class="attachment-btn settings-btn" onclick="showAttachmentSettings()">
                            <i class="fas fa-cog"></i> الإعدادات
                        </button>
                        <button class="attachment-btn close-btn" onclick="closeAttachmentManager()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
                
                <div class="attachment-toolbar">
                    <div class="attachment-search">
                        <input type="text" id="attachment-search" placeholder="البحث في المرفقات..." onkeyup="searchAttachments()">
                        <i class="fas fa-search"></i>
                    </div>
                    <div class="attachment-filters">
                        <select id="attachment-filter-type" onchange="filterAttachments()">
                            <option value="all">جميع الأنواع</option>
                            <option value="images">الصور</option>
                            <option value="documents">المستندات</option>
                            <option value="word">وورد</option>
                            <option value="excel">اكسل</option>
                        </select>
                        <select id="attachment-sort" onchange="sortAttachments()">
                            <option value="date-desc">الأحدث أولاً</option>
                            <option value="date-asc">الأقدم أولاً</option>
                            <option value="name-asc">الاسم أ-ي</option>
                            <option value="name-desc">الاسم ي-أ</option>
                            <option value="size-desc">الأكبر حجماً</option>
                            <option value="size-asc">الأصغر حجماً</option>
                        </select>
                    </div>
                    <div class="attachment-view-controls">
                        <button class="view-btn ${currentAttachmentSettings.gridView ? 'active' : ''}" onclick="toggleViewMode('grid')" title="عرض شبكي">
                            <i class="fas fa-th"></i>
                        </button>
                        <button class="view-btn ${!currentAttachmentSettings.gridView ? 'active' : ''}" onclick="toggleViewMode('list')" title="عرض قائمة">
                            <i class="fas fa-list"></i>
                        </button>
                    </div>
                </div>
                
                <div class="attachment-content">
                    <div class="attachment-dropzone" id="attachment-dropzone">
                        <div class="dropzone-content">
                            <i class="fas fa-cloud-upload-alt"></i>
                            <h4>اسحب وأفلت الملفات هنا</h4>
                            <p>أو <button class="upload-link" onclick="triggerFileUpload()">اختر الملفات</button></p>
                            <div class="upload-info">
                                <small>الحد الأقصى: ${formatFileSize(currentAttachmentSettings.maxFileSize)} لكل ملف</small>
                                <small>الأنواع المدعومة: الصور، PDF، Word، Excel</small>
                            </div>
                        </div>
                    </div>
                    
                    <div class="attachment-list" id="attachment-list">
                        <!-- المرفقات ستظهر هنا -->
                    </div>
                </div>
                
                <div class="attachment-footer">
                    <div class="attachment-stats">
                        <span id="attachment-count">0 ملفات</span>
                        <span id="attachment-size">0 بايت</span>
                        <span id="attachment-folders">0 مجلدات</span>
                    </div>
                    <div class="attachment-bulk-actions">
                        <button class="attachment-btn" onclick="selectAllAttachments()">
                            <i class="fas fa-check-square"></i> تحديد الكل
                        </button>
                        <button class="attachment-btn" onclick="deleteSelectedAttachments()">
                            <i class="fas fa-trash"></i> حذف المحدد
                        </button>
                        <button class="attachment-btn" onclick="downloadSelectedAttachments()">
                            <i class="fas fa-download"></i> تحميل المحدد
                        </button>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- حقل رفع الملفات المخفي -->
        <input type="file" id="attachment-file-input" multiple accept="${getAcceptedFileTypes()}" style="display: none;">
    `;
    
    // إضافة الأنماط
    addAttachmentStyles();
    
    document.body.appendChild(manager);
    attachmentManager = manager;
    
    // إعداد معالج رفع الملفات
    setupFileUploadHandler();
}

// ==============================
// إضافة أزرار المرفقات
// ==============================
function addAttachmentButtons() {
    if (!currentAttachmentSettings.showAttachmentButton) return;
    
    // البحث عن مناطق النماذج والحالات
    const formSections = document.querySelectorAll('.form-container, .content-header, .case-container');
    
    formSections.forEach(section => {
        if (!section.querySelector('.attachment-button')) {
            addAttachmentButtonToSection(section);
        }
    });
    
    // مراقبة إضافة أقسام جديدة
    observeNewSections();
}

function addAttachmentButtonToSection(section) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'attachment-button';
    button.innerHTML = `
        <i class="fas fa-paperclip"></i>
        <span>المرفقات</span>
        <span class="attachment-count-badge" id="attachment-badge-${generateSectionId(section)}">0</span>
    `;
    
    button.onclick = () => {
        const caseId = extractCaseId(section);
        openAttachmentManager(caseId);
    };
    
    // إضافة الزر حسب الموقع المحدد
    if (currentAttachmentSettings.buttonPosition === 'top') {
        section.insertBefore(button, section.firstChild);
    } else if (currentAttachmentSettings.buttonPosition === 'bottom') {
        section.appendChild(button);
    } else if (currentAttachmentSettings.buttonPosition === 'floating') {
        button.classList.add('floating-attachment-btn');
        document.body.appendChild(button);
    }
    
    attachmentButtons.set(section, button);
}

// ==============================
// إعداد السحب والإفلات
// ==============================
function setupDragAndDrop() {
    const dropzone = document.getElementById('attachment-dropzone');
    if (!dropzone) return;
    
    // منع السلوك الافتراضي للمتصفح
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });
    
    // إضافة تأثيرات بصرية
    ['dragenter', 'dragover'].forEach(eventName => {
        dropzone.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, unhighlight, false);
    });
    
    // معالجة الإفلات
    dropzone.addEventListener('drop', handleDrop, false);
}

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function highlight(e) {
    const dropzone = document.getElementById('attachment-dropzone');
    dropzone.classList.add('drag-over');
}

function unhighlight(e) {
    const dropzone = document.getElementById('attachment-dropzone');
    dropzone.classList.remove('drag-over');
}

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    
    handleFileUpload([...files]);
}

// ==============================
// معالجة رفع الملفات
// ==============================
function setupFileUploadHandler() {
    const fileInput = document.getElementById('attachment-file-input');
    if (!fileInput) return;
    
    fileInput.addEventListener('change', function(e) {
        const files = [...e.target.files];
        handleFileUpload(files);
        
        // إعادة تعيين القيمة للسماح برفع نفس الملف مرة أخرى
        this.value = '';
    });
}

function triggerFileUpload() {
    const fileInput = document.getElementById('attachment-file-input');
    if (fileInput) {
        fileInput.click();
    }
}

async function handleFileUpload(files) {
    if (!files || files.length === 0) return;
    
    if (!currentCaseId) {
        showAttachmentToast('يرجى تحديد حالة أولاً', 'warning');
        return;
    }
    
    // إظهار شريط التقدم
    showUploadProgress();
    
    let uploadedCount = 0;
    let failedCount = 0;
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        try {
            // التحقق من صحة الملف
            if (!validateFile(file)) {
                failedCount++;
                continue;
            }
            
            // معالجة الملف
            const processedFile = await processFile(file);
            
            // حفظ الملف
            await saveFile(processedFile, currentCaseId);
            
            uploadedCount++;
            updateUploadProgress(((i + 1) / files.length) * 100);
            
        } catch (error) {
            console.error('خطأ في رفع الملف:', file.name, error);
            failedCount++;
        }
    }
    
    // إخفاء شريط التقدم
    hideUploadProgress();
    
    // إظهار النتائج
    if (uploadedCount > 0) {
        showAttachmentToast(`تم رفع ${uploadedCount} ملف بنجاح`, 'success');
        refreshAttachmentList();
        updateAttachmentStats();
    }
    
    if (failedCount > 0) {
        showAttachmentToast(`فشل في رفع ${failedCount} ملف`, 'error');
    }
}

// ==============================
// التحقق من صحة الملفات
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
    
    // التحقق من عدد الملفات
    const currentFiles = attachmentsData.get(currentCaseId) || [];
    if (currentFiles.length >= currentAttachmentSettings.maxFilesPerCase) {
        showAttachmentToast(`تم الوصول للحد الأقصى من الملفات (${currentAttachmentSettings.maxFilesPerCase})`, 'error');
        return false;
    }
    
    return true;
}

// ==============================
// معالجة الملفات
// ==============================
async function processFile(file) {
    let processedFile = {
        id: generateFileId(),
        originalFile: file,
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
        uploadDate: new Date().toISOString(),
        category: getFileCategory(file.type),
        tags: [],
        description: '',
        isProtected: false,
        isCompressed: false
    };
    
    // معالجة الصور
    if (processedFile.category === 'images') {
        processedFile = await processImage(processedFile);
    }
    
    // إنشاء معاينة مصغرة
    processedFile.thumbnail = await generateThumbnail(processedFile);
    
    // تحويل الملف إلى Base64 للتخزين
    processedFile.data = await fileToBase64(processedFile.originalFile);
    
    // إزالة الملف الأصلي لتوفير الذاكرة
    delete processedFile.originalFile;
    
    return processedFile;
}

async function processImage(fileObj) {
    if (!currentAttachmentSettings.compressImages) {
        return fileObj;
    }
    
    try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        return new Promise((resolve) => {
            img.onload = function() {
                // حساب الأبعاد الجديدة
                let { width, height } = calculateNewDimensions(
                    img.width, 
                    img.height, 
                    currentAttachmentSettings.maxImageWidth, 
                    currentAttachmentSettings.maxImageHeight
                );
                
                canvas.width = width;
                canvas.height = height;
                
                // رسم الصورة المضغوطة
                ctx.drawImage(img, 0, 0, width, height);
                
                // تحويل إلى Blob
                canvas.toBlob((blob) => {
                    fileObj.data = blob;
                    fileObj.size = blob.size;
                    fileObj.isCompressed = true;
                    fileObj.compressedWidth = width;
                    fileObj.compressedHeight = height;
                    fileObj.originalWidth = img.width;
                    fileObj.originalHeight = img.height;
                    
                    resolve(fileObj);
                }, fileObj.type, currentAttachmentSettings.imageQuality);
            };
            
            img.src = URL.createObjectURL(fileObj.originalFile);
        });
        
    } catch (error) {
        console.error('خطأ في ضغط الصورة:', error);
        return fileObj;
    }
}

function calculateNewDimensions(originalWidth, originalHeight, maxWidth, maxHeight) {
    let width = originalWidth;
    let height = originalHeight;
    
    // إذا كانت الصورة أكبر من الحد المسموح
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

// ==============================
// إنشاء المعاينات المصغرة
// ==============================
async function generateThumbnail(fileObj) {
    const category = fileObj.category;
    
    if (category === 'images') {
        return await generateImageThumbnail(fileObj);
    } else if (category === 'documents') {
        return await generatePDFThumbnail(fileObj);
    } else {
        return generateDefaultThumbnail(fileObj);
    }
}

async function generateImageThumbnail(fileObj) {
    try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        return new Promise((resolve) => {
            img.onload = function() {
                const size = 150; // حجم المعاينة المصغرة
                canvas.width = size;
                canvas.height = size;
                
                // حساب الموضع للاحتفاظ بالنسبة
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
                
                // رسم خلفية
                ctx.fillStyle = '#f8f9fa';
                ctx.fillRect(0, 0, size, size);
                
                // رسم الصورة
                ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
                
                resolve(canvas.toDataURL('image/jpeg', 0.7));
            };
            
            if (fileObj.data instanceof Blob) {
                img.src = URL.createObjectURL(fileObj.data);
            } else {
                img.src = fileObj.data;
            }
        });
        
    } catch (error) {
        console.error('خطأ في إنشاء معاينة الصورة:', error);
        return generateDefaultThumbnail(fileObj);
    }
}

async function generatePDFThumbnail(fileObj) {
    // محاكاة معاينة PDF (يتطلب مكتبة PDF.js في التطبيق الحقيقي)
    return generateDefaultThumbnail(fileObj);
}

function generateDefaultThumbnail(fileObj) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const size = 150;
    
    canvas.width = size;
    canvas.height = size;
    
    // خلفية ملونة حسب نوع الملف
    const fileTypeInfo = getFileTypeInfo(fileObj.type);
    ctx.fillStyle = fileTypeInfo.color;
    ctx.fillRect(0, 0, size, size);
    
    // رسم الأيقونة
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'white';
    ctx.fillText(fileTypeInfo.icon, size/2, size/2 - 10);
    
    // رسم امتداد الملف
    const extension = fileObj.name.split('.').pop().toUpperCase();
    ctx.font = '14px Arial';
    ctx.fillText(extension, size/2, size/2 + 30);
    
    return canvas.toDataURL('image/jpeg', 0.8);
}

// ==============================
// حفظ الملفات
// ==============================
async function saveFile(fileObj, caseId) {
    try {
        // حفظ الملف في قاعدة البيانات
        attachmentDatabase.files.set(fileObj.id, fileObj);
        
        // حفظ البيانات الوصفية
        attachmentDatabase.metadata.set(fileObj.id, {
            id: fileObj.id,
            caseId: caseId,
            name: fileObj.name,
            size: fileObj.size,
            type: fileObj.type,
            category: fileObj.category,
            uploadDate: fileObj.uploadDate,
            tags: fileObj.tags,
            description: fileObj.description,
            isProtected: fileObj.isProtected
        });
        
        // حفظ المعاينة المصغرة
        if (fileObj.thumbnail) {
            attachmentDatabase.thumbnails.set(fileObj.id, fileObj.thumbnail);
        }
        
        // إضافة إلى قائمة مرفقات الحالة
        if (!attachmentsData.has(caseId)) {
            attachmentsData.set(caseId, []);
        }
        attachmentsData.get(caseId).push(fileObj.id);
        
        // تحديث الفهرس للبحث
        updateSearchIndex(fileObj);
        
        // حفظ في التخزين المحلي
        await saveToLocalStorage();
        
        console.log('✅ تم حفظ الملف:', fileObj.name);
        
    } catch (error) {
        console.error('❌ خطأ في حفظ الملف:', error);
        throw error;
    }
}

// ==============================
// عرض المرفقات
// ==============================
function refreshAttachmentList() {
    const listContainer = document.getElementById('attachment-list');
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
    
    // جلب بيانات الملفات
    const files = caseAttachments.map(id => attachmentDatabase.metadata.get(id)).filter(Boolean);
    
    // ترتيب الملفات
    const sortedFiles = sortFiles(files);
    
    // إنشاء العرض
    if (currentAttachmentSettings.gridView) {
        listContainer.innerHTML = createGridView(sortedFiles);
    } else {
        listContainer.innerHTML = createListView(sortedFiles);
    }
    
    // تحديث الإحصائيات
    updateAttachmentStats();
}

function createGridView(files) {
    return `
        <div class="attachment-grid">
            ${files.map(file => createFileCard(file)).join('')}
        </div>
    `;
}

function createListView(files) {
    return `
        <div class="attachment-list-view">
            <div class="list-header">
                <div class="col-name">الاسم</div>
                <div class="col-size">الحجم</div>
                <div class="col-date">التاريخ</div>
                <div class="col-actions">الإجراءات</div>
            </div>
            ${files.map(file => createFileRow(file)).join('')}
        </div>
    `;
}

function createFileCard(file) {
    const thumbnail = attachmentDatabase.thumbnails.get(file.id) || getDefaultThumbnail(file.type);
    const typeInfo = getFileTypeInfo(file.type);
    
    return `
        <div class="file-card" data-file-id="${file.id}">
            <div class="file-thumbnail">
                <img src="${thumbnail}" alt="${file.name}" onclick="previewFile('${file.id}')">
                <div class="file-type-badge" style="background: ${typeInfo.color}">
                    ${typeInfo.icon}
                </div>
                ${file.isProtected ? '<div class="protected-badge"><i class="fas fa-lock"></i></div>' : ''}
            </div>
            <div class="file-info">
                <div class="file-name" title="${file.name}">${truncateText(file.name, 15)}</div>
                <div class="file-meta">
                    <span class="file-size">${formatFileSize(file.size)}</span>
                    <span class="file-date">${formatDate(file.uploadDate)}</span>
                </div>
            </div>
            <div class="file-actions">
                <button class="action-btn" onclick="previewFile('${file.id}')" title="معاينة">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="action-btn" onclick="downloadFile('${file.id}')" title="تحميل">
                    <i class="fas fa-download"></i>
                </button>
                <button class="action-btn" onclick="editFileInfo('${file.id}')" title="تعديل">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete-btn" onclick="deleteFile('${file.id}')" title="حذف">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;
}

function createFileRow(file) {
    const typeInfo = getFileTypeInfo(file.type);
    
    return `
        <div class="file-row" data-file-id="${file.id}">
            <div class="col-name">
                <div class="file-icon" style="color: ${typeInfo.color}">
                    ${typeInfo.icon}
                </div>
                <span class="file-name" onclick="previewFile('${file.id}')">${file.name}</span>
                ${file.isProtected ? '<i class="fas fa-lock protected-icon"></i>' : ''}
            </div>
            <div class="col-size">${formatFileSize(file.size)}</div>
            <div class="col-date">${formatDate(file.uploadDate)}</div>
            <div class="col-actions">
                <button class="action-btn" onclick="previewFile('${file.id}')" title="معاينة">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="action-btn" onclick="downloadFile('${file.id}')" title="تحميل">
                    <i class="fas fa-download"></i>
                </button>
                <button class="action-btn" onclick="editFileInfo('${file.id}')" title="تعديل">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete-btn" onclick="deleteFile('${file.id}')" title="حذف">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;
}

// ==============================
// وظائف إدارة المرفقات
// ==============================
function openAttachmentManager(caseId = null) {
    if (!attachmentManager) {
        createAttachmentManager();
    }
    
    currentCaseId = caseId;
    
    // تحديث معلومات الحالة
    updateCaseInfo(caseId);
    
    // عرض المدير
    const overlay = attachmentManager.querySelector('.attachment-overlay');
    overlay.classList.add('show');
    document.body.style.overflow = 'hidden';
    
    // تحديث قائمة المرفقات
    refreshAttachmentList();
}

function closeAttachmentManager() {
    if (attachmentManager) {
        const overlay = attachmentManager.querySelector('.attachment-overlay');
        overlay.classList.remove('show');
        document.body.style.overflow = 'auto';
    }
    
    currentCaseId = null;
}

function previewFile(fileId) {
    const file = attachmentDatabase.files.get(fileId);
    if (!file) {
        showAttachmentToast('الملف غير موجود', 'error');
        return;
    }
    
    // إنشاء نافذة المعاينة
    createFileViewer(file);
}

function downloadFile(fileId) {
    const file = attachmentDatabase.files.get(fileId);
    if (!file) {
        showAttachmentToast('الملف غير موجود', 'error');
        return;
    }
    
    try {
        let dataUrl;
        
        if (file.data instanceof Blob) {
            dataUrl = URL.createObjectURL(file.data);
        } else if (typeof file.data === 'string' && file.data.startsWith('data:')) {
            dataUrl = file.data;
        } else {
            // تحويل Base64 إلى Blob
            const base64Data = file.data.split(',')[1];
            const byteCharacters = atob(base64Data);
            const byteNumbers = new Array(byteCharacters.length);
            
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: file.type });
            dataUrl = URL.createObjectURL(blob);
        }
        
        // إنشاء رابط التحميل
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = file.name;
        link.click();
        
        // تنظيف الذاكرة
        if (dataUrl.startsWith('blob:')) {
            setTimeout(() => URL.revokeObjectURL(dataUrl), 1000);
        }
        
        showAttachmentToast(`تم تحميل الملف: ${file.name}`, 'success');
        
    } catch (error) {
        console.error('خطأ في تحميل الملف:', error);
        showAttachmentToast('فشل في تحميل الملف', 'error');
    }
}

function deleteFile(fileId) {
    const file = attachmentDatabase.metadata.get(fileId);
    if (!file) {
        showAttachmentToast('الملف غير موجود', 'error');
        return;
    }
    
    if (confirm(`هل أنت متأكد من حذف الملف "${file.name}"؟`)) {
        try {
            // حذف من قاعدة البيانات
            attachmentDatabase.files.delete(fileId);
            attachmentDatabase.metadata.delete(fileId);
            attachmentDatabase.thumbnails.delete(fileId);
            
            // حذف من قائمة مرفقات الحالة
            const caseAttachments = attachmentsData.get(file.caseId);
            if (caseAttachments) {
                const index = caseAttachments.indexOf(fileId);
                if (index > -1) {
                    caseAttachments.splice(index, 1);
                }
            }
            
            // تحديث الفهرس
            updateSearchIndex();
            
            // حفظ التغييرات
            saveToLocalStorage();
            
            // تحديث العرض
            refreshAttachmentList();
            
            showAttachmentToast(`تم حذف الملف: ${file.name}`, 'success');
            
        } catch (error) {
            console.error('خطأ في حذف الملف:', error);
            showAttachmentToast('فشل في حذف الملف', 'error');
        }
    }
}

// ==============================
// وظائف مساعدة
// ==============================
function generateFileId() {
    return 'file_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function generateSectionId(section) {
    return 'section_' + Math.random().toString(36).substr(2, 9);
}

function extractCaseId(section) {
    // محاولة استخراج معرف الحالة من السياق
    const formData = getFormData && getFormData();
    if (formData && formData.id) {
        return formData.id;
    }
    
    // إنشاء معرف افتراضي للحالة الحالية
    return 'current_case';
}

function getFileCategory(mimeType) {
    for (const [category, info] of Object.entries(FILE_TYPES)) {
        if (category === 'other') continue;
        
        const extensions = info.extensions;
        for (const ext of extensions) {
            if (mimeType.includes(ext.replace('.', ''))) {
                return category;
            }
        }
    }
    return 'other';
}

function getFileTypeInfo(mimeType) {
    const category = getFileCategory(mimeType);
    return FILE_TYPES[category] || FILE_TYPES.other;
}

function getAcceptedFileTypes() {
    return currentAttachmentSettings.allowedFileTypes.join(',');
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 بايت';
    
    const k = 1024;
    const sizes = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDate(dateString) {
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
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
}

async function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

// ==============================
// البحث والفلترة
// ==============================
function searchAttachments() {
    const searchTerm = document.getElementById('attachment-search').value.toLowerCase();
    const fileCards = document.querySelectorAll('.file-card, .file-row');
    
    fileCards.forEach(card => {
        const fileName = card.querySelector('.file-name').textContent.toLowerCase();
        if (fileName.includes(searchTerm)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

function filterAttachments() {
    const filterType = document.getElementById('attachment-filter-type').value;
    const fileCards = document.querySelectorAll('.file-card, .file-row');
    
    fileCards.forEach(card => {
        const fileId = card.getAttribute('data-file-id');
        const fileMetadata = attachmentDatabase.metadata.get(fileId);
        
        if (filterType === 'all' || fileMetadata.category === filterType) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

function sortAttachments() {
    const sortValue = document.getElementById('attachment-sort').value;
    const [sortBy, sortOrder] = sortValue.split('-');
    
    currentAttachmentSettings.sortBy = sortBy;
    currentAttachmentSettings.sortOrder = sortOrder;
    
    refreshAttachmentList();
}

function sortFiles(files) {
    const { sortBy, sortOrder } = currentAttachmentSettings;
    
    return files.sort((a, b) => {
        let comparison = 0;
        
        switch (sortBy) {
            case 'name':
                comparison = a.name.localeCompare(b.name, 'ar');
                break;
            case 'size':
                comparison = a.size - b.size;
                break;
            case 'date':
                comparison = new Date(a.uploadDate) - new Date(b.uploadDate);
                break;
            default:
                comparison = 0;
        }
        
        return sortOrder === 'desc' ? -comparison : comparison;
    });
}

// ==============================
// إدارة التخزين المحلي
// ==============================
async function saveToLocalStorage() {
    try {
        const data = {
            attachments: Object.fromEntries(attachmentsData),
            files: Object.fromEntries(attachmentDatabase.files),
            metadata: Object.fromEntries(attachmentDatabase.metadata),
            thumbnails: Object.fromEntries(attachmentDatabase.thumbnails),
            settings: currentAttachmentSettings,
            lastUpdate: new Date().toISOString()
        };
        
        // ضغط البيانات قبل الحفظ
        const compressedData = JSON.stringify(data);
        localStorage.setItem('charity_attachments', compressedData);
        
        console.log('💾 تم حفظ المرفقات في التخزين المحلي');
        
    } catch (error) {
        console.error('❌ خطأ في حفظ المرفقات:', error);
        
        if (error.name === 'QuotaExceededError') {
            showAttachmentToast('مساحة التخزين ممتلئة. يرجى حذف بعض الملفات.', 'error');
        } else {
            showAttachmentToast('فشل في حفظ المرفقات', 'error');
        }
    }
}

function loadAttachmentDatabase() {
    try {
        const data = localStorage.getItem('charity_attachments');
        if (!data) return;
        
        const parsedData = JSON.parse(data);
        
        // تحميل البيانات
        attachmentsData = new Map(Object.entries(parsedData.attachments || {}));
        attachmentDatabase.files = new Map(Object.entries(parsedData.files || {}));
        attachmentDatabase.metadata = new Map(Object.entries(parsedData.metadata || {}));
        attachmentDatabase.thumbnails = new Map(Object.entries(parsedData.thumbnails || {}));
        
        // تحميل الإعدادات
        if (parsedData.settings) {
            currentAttachmentSettings = { ...DEFAULT_ATTACHMENT_SETTINGS, ...parsedData.settings };
        }
        
        console.log('📁 تم تحميل قاعدة بيانات المرفقات');
        
    } catch (error) {
        console.error('❌ خطأ في تحميل المرفقات:', error);
        showAttachmentToast('فشل في تحميل المرفقات المحفوظة', 'error');
    }
}

function loadAttachmentSettings() {
    try {
        const settings = localStorage.getItem('charity_attachment_settings');
        if (settings) {
            currentAttachmentSettings = { ...DEFAULT_ATTACHMENT_SETTINGS, ...JSON.parse(settings) };
        }
    } catch (error) {
        console.error('خطأ في تحميل إعدادات المرفقات:', error);
    }
}

// ==============================
// النسخ الاحتياطي التلقائي
// ==============================
function startAutoBackup() {
    if (!currentAttachmentSettings.autoBackup) return;
    
    setInterval(async () => {
        try {
            await createAttachmentBackup();
            console.log('✅ تم إنشاء نسخة احتياطية تلقائية للمرفقات');
        } catch (error) {
            console.error('❌ خطأ في النسخ الاحتياطي التلقائي:', error);
        }
    }, currentAttachmentSettings.backupInterval);
}

async function createAttachmentBackup() {
    const backupData = {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        attachments: Object.fromEntries(attachmentsData),
        metadata: Object.fromEntries(attachmentDatabase.metadata),
        settings: currentAttachmentSettings
    };
    
    const backupJson = JSON.stringify(backupData, null, 2);
    const backupBlob = new Blob([backupJson], { type: 'application/json' });
    
    // حفظ النسخة الاحتياطية
    const backupName = `attachments_backup_${new Date().toISOString().split('T')[0]}.json`;
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(backupBlob);
    link.download = backupName;
    link.click();
    
    URL.revokeObjectURL(link.href);
}

// ==============================
// وظائف الواجهة
// ==============================
function updateCaseInfo(caseId) {
    const caseInfoElement = document.getElementById('current-case-info');
    if (!caseInfoElement) return;
    
    if (caseId) {
        const attachmentCount = (attachmentsData.get(caseId) || []).length;
        caseInfoElement.textContent = `الحالة: ${caseId} (${attachmentCount} مرفق)`;
    } else {
        caseInfoElement.textContent = 'لم يتم تحديد حالة';
    }
}

function updateAttachmentStats() {
    const countElement = document.getElementById('attachment-count');
    const sizeElement = document.getElementById('attachment-size');
    const foldersElement = document.getElementById('attachment-folders');
    
    if (!currentCaseId) return;
    
    const caseAttachments = attachmentsData.get(currentCaseId) || [];
    const totalSize = caseAttachments.reduce((sum, fileId) => {
        const metadata = attachmentDatabase.metadata.get(fileId);
        return sum + (metadata ? metadata.size : 0);
    }, 0);
    
    if (countElement) countElement.textContent = `${caseAttachments.length} ملفات`;
    if (sizeElement) sizeElement.textContent = formatFileSize(totalSize);
    if (foldersElement) foldersElement.textContent = '0 مجلدات'; // مؤقت
}

function toggleViewMode(mode) {
    currentAttachmentSettings.gridView = mode === 'grid';
    
    // تحديث أزرار العرض
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    event.target.classList.add('active');
    
    // تحديث العرض
    refreshAttachmentList();
}

function showUploadProgress() {
    // إضافة شريط التقدم
    const progressBar = document.createElement('div');
    progressBar.id = 'upload-progress';
    progressBar.innerHTML = `
        <div class="progress-container">
            <div class="progress-bar">
                <div class="progress-fill" style="width: 0%"></div>
            </div>
            <div class="progress-text">جاري الرفع...</div>
        </div>
    `;
    
    document.body.appendChild(progressBar);
}

function updateUploadProgress(percentage) {
    const progressFill = document.querySelector('#upload-progress .progress-fill');
    const progressText = document.querySelector('#upload-progress .progress-text');
    
    if (progressFill) {
        progressFill.style.width = percentage + '%';
    }
    
    if (progressText) {
        progressText.textContent = `جاري الرفع... ${Math.round(percentage)}%`;
    }
}

function hideUploadProgress() {
    const progressBar = document.getElementById('upload-progress');
    if (progressBar) {
        progressBar.remove();
    }
}

function showAttachmentToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `attachment-toast ${type}`;
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle'}"></i>
        </div>
        <div class="toast-message">${message}</div>
    `;
    
    document.body.appendChild(toast);
    
    // إظهار الإشعار
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    // إخفاء الإشعار بعد 4 ثوان
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
// إضافة الأنماط
// ==============================
function addAttachmentStyles() {
    if (document.getElementById('attachment-styles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'attachment-styles';
    styles.textContent = `
        /* أنماط أزرار المرفقات */
        .attachment-button {
            background: linear-gradient(135deg, #3498db, #2980b9);
            color: white;
            border: none;
            padding: 10px 15px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            transition: all 0.3s ease;
            margin: 10px 0;
            position: relative;
        }
        
        .attachment-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(52, 152, 219, 0.3);
        }
        
        .attachment-count-badge {
            background: #e74c3c;
            color: white;
            border-radius: 50%;
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 11px;
            font-weight: 600;
            position: absolute;
            top: -5px;
            right: -5px;
        }
        
        .floating-attachment-btn {
            position: fixed;
            bottom: 80px;
            right: 20px;
            z-index: 1000;
            border-radius: 50%;
            width: 60px;
            height: 60px;
            justify-content: center;
        }
        
        /* نافذة إدارة المرفقات */
        .attachment-overlay {
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
        
        .attachment-overlay.show {
            display: flex;
        }
        
        .attachment-container {
            background: white;
            border-radius: 15px;
            width: 100%;
            max-width: 1200px;
            max-height: 90vh;
            overflow: hidden;
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
            display: flex;
            flex-direction: column;
        }
        
        .attachment-header {
            background: linear-gradient(135deg, #3498db, #2980b9);
            color: white;
            padding: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 15px;
        }
        
        .attachment-title h3 {
            margin: 0 0 5px 0;
            font-size: 18px;
            font-weight: 600;
        }
        
        .case-info {
            font-size: 14px;
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
            padding: 8px 12px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 5px;
            transition: all 0.3s;
        }
        
        .attachment-btn:hover {
            background: rgba(255, 255, 255, 0.3);
        }
        
        .close-btn {
            background: rgba(231, 76, 60, 0.8);
            padding: 8px 10px;
        }
        
        .close-btn:hover {
            background: rgba(231, 76, 60, 1);
        }
        
        /* شريط الأدوات */
        .attachment-toolbar {
            background: #f8f9fa;
            padding: 15px 20px;
            border-bottom: 1px solid #e3e6f0;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 15px;
        }
        
        .attachment-search {
            position: relative;
            flex: 1;
            min-width: 200px;
        }
        
        .attachment-search input {
            width: 100%;
            padding: 8px 35px 8px 12px;
            border: 2px solid #e3e6f0;
            border-radius: 6px;
            font-size: 14px;
            transition: border-color 0.3s;
        }
        
        .attachment-search input:focus {
            outline: none;
            border-color: #3498db;
        }
        
        .attachment-search i {
            position: absolute;
            right: 10px;
            top: 50%;
            transform: translateY(-50%);
            color: #6c757d;
        }
        
        .attachment-filters {
            display: flex;
            gap: 10px;
        }
        
        .attachment-filters select {
            padding: 8px 12px;
            border: 2px solid #e3e6f0;
            border-radius: 6px;
            font-size: 14px;
            background: white;
        }
        
        .attachment-view-controls {
            display: flex;
            gap: 5px;
        }
        
        .view-btn {
            background: #e3e6f0;
            border: none;
            color: #6c757d;
            padding: 8px 10px;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .view-btn.active,
        .view-btn:hover {
            background: #3498db;
            color: white;
        }
        
        /* منطقة المحتوى */
        .attachment-content {
            flex: 1;
            overflow-y: auto;
            padding: 20px;
        }
        
        /* منطقة السحب والإفلات */
        .attachment-dropzone {
            border: 2px dashed #bdc3c7;
            border-radius: 10px;
            padding: 40px 20px;
            text-align: center;
            margin-bottom: 20px;
            transition: all 0.3s;
        }
        
        .attachment-dropzone.drag-over {
            border-color: #3498db;
            background: rgba(52, 152, 219, 0.1);
        }
        
        .dropzone-content i {
            font-size: 48px;
            color: #bdc3c7;
            margin-bottom: 15px;
        }
        
        .dropzone-content h4 {
            color: #2c3e50;
            margin-bottom: 10px;
        }
        
        .upload-link {
            background: none;
            border: none;
            color: #3498db;
            text-decoration: underline;
            cursor: pointer;
            font-size: 14px;
        }
        
        .upload-info {
            margin-top: 15px;
            display: flex;
            flex-direction: column;
            gap: 5px;
        }
        
        .upload-info small {
            color: #6c757d;
            font-size: 12px;
        }
        
        /* عرض الملفات - الشبكة */
        .attachment-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 20px;
        }
        
        .file-card {
            background: white;
            border: 1px solid #e3e6f0;
            border-radius: 10px;
            padding: 15px;
            transition: all 0.3s;
            cursor: pointer;
        }
        
        .file-card:hover {
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
            transform: translateY(-2px);
        }
        
        .file-thumbnail {
            position: relative;
            width: 100%;
            height: 120px;
            border-radius: 8px;
            overflow: hidden;
            margin-bottom: 10px;
            background: #f8f9fa;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .file-thumbnail img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        
        .file-type-badge {
            position: absolute;
            top: 5px;
            right: 5px;
            width: 25px;
            height: 25px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            color: white;
        }
        
        .protected-badge {
            position: absolute;
            top: 5px;
            left: 5px;
            width: 25px;
            height: 25px;
            background: rgba(231, 76, 60, 0.9);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 12px;
        }
        
        .file-info {
            margin-bottom: 10px;
        }
        
        .file-name {
            font-weight: 600;
            color: #2c3e50;
            margin-bottom: 5px;
            font-size: 14px;
        }
        
        .file-meta {
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            color: #6c757d;
        }
        
        .file-actions {
            display: flex;
            justify-content: space-between;
            gap: 5px;
        }
        
        .action-btn {
            background: #f8f9fa;
            border: 1px solid #e3e6f0;
            color: #6c757d;
            width: 30px;
            height: 30px;
            border-radius: 6px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            transition: all 0.3s;
        }
        
        .action-btn:hover {
            background: #e3e6f0;
            color: #495057;
        }
        
        .action-btn.delete-btn:hover {
            background: #e74c3c;
            color: white;
        }
        
        /* عرض الملفات - القائمة */
        .attachment-list-view {
            background: white;
            border-radius: 10px;
            overflow: hidden;
        }
        
        .list-header {
            background: #f8f9fa;
            padding: 15px;
            display: grid;
            grid-template-columns: 2fr 1fr 1fr 1fr;
            gap: 20px;
            font-weight: 600;
            color: #2c3e50;
            border-bottom: 1px solid #e3e6f0;
        }
        
        .file-row {
            padding: 15px;
            display: grid;
            grid-template-columns: 2fr 1fr 1fr 1fr;
            gap: 20px;
            border-bottom: 1px solid #f8f9fa;
            align-items: center;
        }
        
        .file-row:hover {
            background: #f8f9fa;
        }
        
        .col-name {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .file-icon {
            font-size: 20px;
        }
        
        .file-name {
            cursor: pointer;
            color: #3498db;
            text-decoration: none;
        }
        
        .file-name:hover {
            text-decoration: underline;
        }
        
        .protected-icon {
            color: #e74c3c;
            font-size: 12px;
        }
        
        .col-actions {
            display: flex;
            gap: 5px;
        }
        
        /* الحالة الفارغة */
        .empty-attachments {
            text-align: center;
            padding: 60px 20px;
            color: #6c757d;
        }
        
        .empty-attachments i {
            font-size: 64px;
            color: #bdc3c7;
            margin-bottom: 20px;
        }
        
        .empty-attachments h4 {
            margin-bottom: 10px;
            color: #2c3e50;
        }
        
        /* التذييل */
        .attachment-footer {
            background: #f8f9fa;
            padding: 15px 20px;
            border-top: 1px solid #e3e6f0;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 15px;
        }
        
        .attachment-stats {
            display: flex;
            gap: 20px;
            font-size: 14px;
            color: #6c757d;
        }
        
        .attachment-bulk-actions {
            display: flex;
            gap: 10px;
        }
        
        .attachment-bulk-actions .attachment-btn {
            background: #e3e6f0;
            color: #6c757d;
            padding: 6px 10px;
            font-size: 12px;
        }
        
        .attachment-bulk-actions .attachment-btn:hover {
            background: #d6d8db;
        }
        
        /* شريط التقدم */
        #upload-progress {
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
        }
        
        .progress-container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            width: 300px;
            text-align: center;
        }
        
        .progress-bar {
            width: 100%;
            height: 20px;
            background: #e3e6f0;
            border-radius: 10px;
            overflow: hidden;
            margin-bottom: 15px;
        }
        
        .progress-fill {
            height: 100%;
            background: linear-gradient(135deg, #27ae60, #2ecc71);
            transition: width 0.3s ease;
        }
        
        .progress-text {
            font-weight: 500;
            color: #2c3e50;
        }
        
        /* الإشعارات */
        .attachment-toast {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #3498db;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
            z-index: 10002;
            display: flex;
            align-items: center;
            gap: 10px;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            max-width: 400px;
            word-wrap: break-word;
        }
        
        .attachment-toast.show {
            transform: translateX(0);
        }
        
        .attachment-toast.success {
            background: #27ae60;
        }
        
        .attachment-toast.error {
            background: #e74c3c;
        }
        
        .attachment-toast.warning {
            background: #f39c12;
        }
        
        .toast-icon {
            font-size: 18px;
            flex-shrink: 0;
        }
        
        .toast-message {
            flex: 1;
            font-size: 14px;
        }
        
        /* تحسينات للهواتف */
        @media (max-width: 768px) {
            .attachment-overlay {
                padding: 10px;
            }
            
            .attachment-container {
                max-height: 95vh;
            }
            
            .attachment-header {
                padding: 15px;
                flex-direction: column;
                align-items: stretch;
            }
            
            .attachment-actions {
                justify-content: center;
            }
            
            .attachment-toolbar {
                padding: 10px 15px;
                flex-direction: column;
                align-items: stretch;
                gap: 10px;
            }
            
            .attachment-search {
                min-width: auto;
            }
            
            .attachment-filters {
                justify-content: center;
            }
            
            .attachment-content {
                padding: 15px;
            }
            
            .attachment-grid {
                grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
                gap: 15px;
            }
            
            .file-card {
                padding: 10px;
            }
            
            .file-thumbnail {
                height: 100px;
            }
            
            .list-header,
            .file-row {
                grid-template-columns: 2fr 1fr 1fr;
                gap: 10px;
            }
            
            .col-size {
                display: none;
            }
            
            .attachment-footer {
                padding: 10px 15px;
                flex-direction: column;
                align-items: stretch;
            }
            
            .attachment-stats {
                justify-content: center;
                gap: 15px;
            }
            
            .attachment-bulk-actions {
                justify-content: center;
            }
            
            .attachment-toast {
                right: 10px;
                left: 10px;
                max-width: none;
            }
        }
        
        /* تحسينات للشاشات الصغيرة جداً */
        @media (max-width: 480px) {
            .attachment-grid {
                grid-template-columns: 1fr 1fr;
            }
            
            .list-header,
            .file-row {
                grid-template-columns: 1fr 1fr;
            }
            
            .col-date {
                display: none;
            }
            
            .file-actions {
                flex-wrap: wrap;
            }
            
            .action-btn {
                width: 25px;
                height: 25px;
                font-size: 10px;
            }
        }
    `;
    
    document.head.appendChild(styles);
}

// ==============================
// إعداد مستمعي الأحداث
// ==============================
function setupAttachmentEventListeners() {
    // مراقبة تغييرات الصفحة لإضافة أزرار جديدة
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            mutation.addedNodes.forEach(function(node) {
                if (node.nodeType === 1 && node.querySelector) {
                    const newSections = node.querySelectorAll('.form-container, .content-header, .case-container');
                    newSections.forEach(section => {
                        if (!section.querySelector('.attachment-button')) {
                            addAttachmentButtonToSection(section);
                        }
                    });
                }
            });
        });
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    // اختصارات لوحة المفاتيح
    document.addEventListener('keydown', function(e) {
        // Ctrl + Alt + A لفتح مدير المرفقات
        if (e.ctrlKey && e.altKey && e.key === 'A') {
            e.preventDefault();
            openAttachmentManager();
        }
        
        // Escape لإغلاق مدير المرفقات
        if (e.key === 'Escape' && attachmentManager) {
            const overlay = attachmentManager.querySelector('.attachment-overlay');
            if (overlay.classList.contains('show')) {
                closeAttachmentManager();
            }
        }
    });
}

function observeNewSections() {
    // مراقبة إضافة أقسام جديدة
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            mutation.addedNodes.forEach(function(node) {
                if (node.nodeType === 1) {
                    const newSections = node.querySelectorAll ? 
                        node.querySelectorAll('.form-container, .content-header, .case-container') : [];
                    
                    newSections.forEach(section => {
                        if (!attachmentButtons.has(section)) {
                            addAttachmentButtonToSection(section);
                        }
                    });
                    
                    // إذا كان العنصر نفسه قسماً
                    if (node.matches && node.matches('.form-container, .content-header, .case-container')) {
                        if (!attachmentButtons.has(node)) {
                            addAttachmentButtonToSection(node);
                        }
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

// ==============================
// تهيئة النظام عند تحميل الصفحة
// ==============================
document.addEventListener('DOMContentLoaded', function() {
    // تأخير التهيئة للتأكد من تحميل النظام الرئيسي
    setTimeout(() => {
        initializeAttachmentSystem();
    }, 2000);
});

// ==============================
// إتاحة الوظائف عالمياً
// ==============================
window.attachmentSystem = {
    open: openAttachmentManager,
    close: closeAttachmentManager,
    upload: handleFileUpload,
    download: downloadFile,
    delete: deleteFile,
    preview: previewFile,
    backup: createAttachmentBackup,
    settings: currentAttachmentSettings,
    database: attachmentDatabase
};

// ==============================
// معالج الأخطاء
// ==============================
window.addEventListener('error', function(e) {
    if (e.filename && e.filename.includes('attachments-manager')) {
        console.error('خطأ في نظام المرفقات:', e.error);
    }
});

console.log('📎 تم تحميل نظام إدارة المرفقات والوثائق بنجاح!');
console.log('💡 استخدم Ctrl+Alt+A لفتح مدير المرفقات');
console.log('🔧 استخدم attachmentSystem للتحكم البرمجي');
