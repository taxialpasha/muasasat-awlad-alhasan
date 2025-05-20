/**
 * حل مشكلة اختفاء صفحات الحالات
 * هذا الكود يصلح المشكلة ويضيف خاصية المستمسكات بشكل متوافق
 */

// 1. أولاً: إضافة قسم المستمسكات إلى نموذج الحالة
// يجب إضافة هذا الكود مباشرة قبل عنصر `<div class="form-actions no-print">` في نموذج الحالة

const addDocumentsSection = function() {
    // التحقق من أن نموذج الحالة موجود
    const formContent = document.querySelector('.form-content');
    if (!formContent) return;
    
    // التحقق من أن قسم المستمسكات غير موجود بالفعل
    if (document.getElementById('documents-section')) return;
    
    // إنشاء قسم المستمسكات
    const documentsSection = document.createElement('div');
    documentsSection.className = 'form-section';
    documentsSection.id = 'documents-section';
    documentsSection.innerHTML = `
        <h3 class="form-section-title">المستمسكات والوثائق</h3>
        <div class="form-row">
            <div class="form-group full-width">
                <p style="margin-bottom: 10px;">يمكنك رفع المستمسكات والوثائق الخاصة بالحالة هنا</p>
                
                <!-- أزرار رفع المستمسكات -->
                <div class="document-upload-buttons">
                    <button type="button" class="btn btn-primary btn-sm" onclick="uploadDocument('personal')">
                        <i class="fas fa-id-card"></i>
                        <span>مستمسكات شخصية</span>
                    </button>
                    <button type="button" class="btn btn-info btn-sm" onclick="uploadDocument('medical')">
                        <i class="fas fa-file-medical"></i>
                        <span>تقارير طبية</span>
                    </button>
                    <button type="button" class="btn btn-secondary btn-sm" onclick="uploadDocument('financial')">
                        <i class="fas fa-file-invoice-dollar"></i>
                        <span>مستندات مالية</span>
                    </button>
                    <button type="button" class="btn btn-success btn-sm" onclick="uploadDocument('other')">
                        <i class="fas fa-file-alt"></i>
                        <span>ملفات أخرى</span>
                    </button>
                </div>
                
                <!-- عنصر إدخال الملفات (مخفي) -->
                <input type="file" id="document-file-input" multiple style="display: none;" accept=".jpg,.jpeg,.png,.pdf,.doc,.docx">
                
                <!-- عرض المستمسكات المرفوعة -->
                <div class="uploaded-documents-container" id="uploaded-documents-container">
                    <!-- سيتم إضافة المستمسكات هنا عبر JavaScript -->
                    <div class="no-documents-message" id="no-documents-message">
                        لم يتم رفع أي مستمسكات بعد
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // الحصول على آخر قسم في النموذج قبل أزرار الإجراءات
    const formSections = formContent.querySelectorAll('.form-section');
    const lastSection = formSections[formSections.length - 1];
    
    // إضافة قسم المستمسكات بعد آخر قسم
    formContent.insertBefore(documentsSection, lastSection.nextSibling);
    
    // تعديل أزرار الإجراءات لإضافة زر إدارة المستمسكات
    const formActions = document.querySelector('.form-actions');
    if (formActions) {
        // الاحتفاظ بجميع الأزرار الحالية
        const existingButtons = formActions.innerHTML;
        
        // إضافة زر المستمسكات قبل زر "إعادة تعيين"
        const newButtons = existingButtons.replace(
            /<button type="button" class="btn btn-warning" onclick="resetForm\(\)">/,
            `<button type="button" class="btn btn-warning" onclick="manageDocuments()">
                <i class="fas fa-file-alt"></i>
                <span>إدارة المستمسكات</span>
            </button>
            <button type="button" class="btn btn-warning" onclick="resetForm()">`
        );
        
        formActions.innerHTML = newButtons;
    }
};

// 2. إضافة نافذة إدارة المستمسكات إلى الصفحة
const addDocumentsModal = function() {
    // التحقق من أن النافذة غير موجودة بالفعل
    if (document.getElementById('documents-modal')) return;
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'documents-modal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 800px;">
            <div class="modal-header">
                <h2 class="modal-title">إدارة المستمسكات والوثائق</h2>
                <button class="modal-close" onclick="closeModal('documents-modal')">&times;</button>
            </div>
            <div class="modal-body">
                <div class="tabs">
                    <div class="tab active" data-tab="all-documents">جميع المستمسكات</div>
                    <div class="tab" data-tab="personal-documents">مستمسكات شخصية</div>
                    <div class="tab" data-tab="medical-documents">تقارير طبية</div>
                    <div class="tab" data-tab="financial-documents">مستندات مالية</div>
                    <div class="tab" data-tab="other-documents">ملفات أخرى</div>
                </div>
                
                <div class="tab-content active" id="all-documents-tab">
                    <div class="documents-grid" id="all-documents-grid">
                        <!-- سيتم إضافة جميع المستمسكات هنا -->
                    </div>
                </div>
                
                <div class="tab-content" id="personal-documents-tab">
                    <div class="documents-grid" id="personal-documents-grid">
                        <!-- سيتم إضافة المستمسكات الشخصية هنا -->
                    </div>
                </div>
                
                <div class="tab-content" id="medical-documents-tab">
                    <div class="documents-grid" id="medical-documents-grid">
                        <!-- سيتم إضافة التقارير الطبية هنا -->
                    </div>
                </div>
                
                <div class="tab-content" id="financial-documents-tab">
                    <div class="documents-grid" id="financial-documents-grid">
                        <!-- سيتم إضافة المستندات المالية هنا -->
                    </div>
                </div>
                
                <div class="tab-content" id="other-documents-tab">
                    <div class="documents-grid" id="other-documents-grid">
                        <!-- سيتم إضافة الملفات الأخرى هنا -->
                    </div>
                </div>
                
                <div class="upload-options" style="margin-top: 20px; text-align: center;">
                    <button class="btn btn-primary" onclick="uploadDocument('all')">
                        <i class="fas fa-upload"></i>
                        <span>رفع مستمسكات جديدة</span>
                    </button>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-success" onclick="exportDocuments()">
                    <i class="fas fa-file-export"></i>
                    <span>تصدير المستمسكات</span>
                </button>
                <button class="btn btn-light" onclick="closeModal('documents-modal')">
                    <i class="fas fa-times"></i>
                    <span>إغلاق</span>
                </button>
            </div>
        </div>
    `;
    
    // إضافة النافذة إلى الصفحة
    document.body.appendChild(modal);
};

// 3. إضافة الأنماط CSS اللازمة
const addDocumentsStyles = function() {
    // التحقق من أن أنماط المستمسكات غير موجودة بالفعل
    if (document.getElementById('documents-styles')) return;
    
    const styleElement = document.createElement('style');
    styleElement.id = 'documents-styles';
    styleElement.textContent = `
        .document-upload-buttons {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-bottom: 15px;
        }

        .uploaded-documents-container {
            border: 2px dashed #e5e7eb;
            border-radius: 8px;
            padding: 15px;
            margin-top: 15px;
            min-height: 100px;
            background-color: #f9fafb;
        }

        .no-documents-message {
            text-align: center;
            color: #9ca3af;
            padding: 20px;
            font-style: italic;
        }

        .documents-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            gap: 15px;
            margin-top: 15px;
        }

        .document-item {
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            overflow: hidden;
            position: relative;
            transition: all 0.2s;
            background-color: white;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
            height: 180px;
            display: flex;
            flex-direction: column;
        }

        .document-item:hover {
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            transform: translateY(-2px);
        }

        .document-preview {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: #f3f4f6;
            padding: 10px;
            overflow: hidden;
        }

        .document-preview img {
            max-width: 100%;
            max-height: 100px;
            object-fit: contain;
        }

        .document-preview i {
            font-size: 40px;
            color: #9ca3af;
        }

        .document-info {
            padding: 8px;
            font-size: 0.8rem;
            border-top: 1px solid #e5e7eb;
            text-align: center;
        }

        .document-name {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            margin-bottom: 3px;
            font-weight: 500;
        }

        .document-category {
            font-size: 0.7rem;
            color: #6b7280;
            margin-bottom: 3px;
        }

        .document-actions {
            position: absolute;
            top: 5px;
            right: 5px;
            display: flex;
            gap: 5px;
        }

        .document-actions button {
            background: rgba(255, 255, 255, 0.8);
            border: none;
            width: 24px;
            height: 24px;
            border-radius: 4px;
            font-size: 12px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #6b7280;
            transition: all 0.2s;
        }

        .document-actions button:hover {
            background: white;
            color: #1e40af;
        }

        .document-actions .delete-document:hover {
            color: #ef4444;
        }

        .document-category-badge {
            position: absolute;
            top: 5px;
            left: 5px;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 0.7rem;
            color: white;
        }

        .document-category-badge.personal {
            background-color: #3b82f6;
        }

        .document-category-badge.medical {
            background-color: #10b981;
        }

        .document-category-badge.financial {
            background-color: #f59e0b;
        }

        .document-category-badge.other {
            background-color: #6b7280;
        }

        .modal-content.document-viewer {
            width: 90%;
            max-width: 1200px;
            height: 90vh;
        }

        .document-viewer-container {
            height: calc(100% - 100px);
            overflow: auto;
            text-align: center;
        }

        .document-viewer-container img {
            max-width: 100%;
            max-height: 100%;
        }

        .document-viewer-container iframe {
            width: 100%;
            height: 100%;
            border: none;
        }

        .view-all-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            background-color: #f3f4f6;
            transition: background-color 0.2s;
        }

        .view-all-btn:hover {
            background-color: #e5e7eb;
        }

        /* تعديل للتوافق مع الجوال */
        @media (max-width: 768px) {
            .document-upload-buttons {
                flex-direction: column;
            }
            
            .documents-grid {
                grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
            }
        }
    `;
    
    // إضافة أنماط CSS إلى الصفحة
    document.head.appendChild(styleElement);
};

// 4. إضافة وظائف JavaScript لمعالجة المستمسكات
// هذه الوظائف لا تتداخل مع الدوال الأصلية ولا تعدل شيفرتها

// مصفوفة لتخزين المستمسكات المرفوعة للحالة الحالية
window.caseDocuments = [];

// تهيئة نظام المستمسكات
window.initDocumentsSystem = function() {
    // التأكد من وجود النموذج
    const form = document.getElementById('case-form');
    if (!form) return;
    
    // إضافة العناصر اللازمة
    addDocumentsSection();
    addDocumentsModal();
    addDocumentsStyles();
    
    // إضافة تعامل مع حدث تغيير ملف الإدخال
    const fileInput = document.getElementById('document-file-input');
    if (fileInput) {
        // إزالة أي مستمعات أحداث سابقة لتجنب التكرار
        fileInput.removeEventListener('change', handleFileSelection);
        fileInput.addEventListener('change', handleFileSelection);
    }
    
    // تحديث عرض المستمسكات في النموذج
    updateDocumentsDisplay();
    
    // إضافة مستمع أحداث لعلامات التبويب في نافذة المستمسكات
    setupDocumentsTabs();
};

// دالة رفع المستمسكات حسب النوع
window.uploadDocument = function(category) {
    // تعيين فئة المستمسك الحالية
    window.currentDocumentCategory = category;
    
    // اختيار نوع الملفات المسموح بها حسب الفئة
    const fileInput = document.getElementById('document-file-input');
    if (!fileInput) return;
    
    switch(category) {
        case 'personal':
            fileInput.accept = ".jpg,.jpeg,.png,.pdf";
            break;
        case 'medical':
            fileInput.accept = ".jpg,.jpeg,.png,.pdf";
            break;
        case 'financial':
            fileInput.accept = ".jpg,.jpeg,.png,.pdf,.xls,.xlsx";
            break;
        default:
            fileInput.accept = ".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx,.txt";
    }
    
    // تفعيل حقل إدخال الملفات
    fileInput.click();
};

// معالجة اختيار الملفات
window.handleFileSelection = function(event) {
    const files = event.target.files;
    
    if (!files || files.length === 0) {
        return;
    }
    
    // عرض شاشة التحميل
    if (typeof showLoader === 'function') {
        showLoader();
    }
    
    // قراءة كل ملف وإضافته للمستمسكات
    const category = window.currentDocumentCategory || 'other';
    const categoryNames = {
        'personal': 'مستمسكات شخصية',
        'medical': 'تقارير طبية',
        'financial': 'مستندات مالية',
        'other': 'ملفات أخرى'
    };
    
    // معالجة كل ملف من الملفات المختارة
    const totalFiles = files.length;
    let processedFiles = 0;
    
    Array.from(files).forEach(file => {
        // التحقق من حجم الملف (الحد الأقصى 5 ميجابايت)
        if (file.size > 5 * 1024 * 1024) {
            if (typeof showToast === 'function') {
                showToast(`الملف ${file.name} كبير جدًا. الحد الأقصى هو 5 ميجابايت`, 'error');
            }
            processedFiles++;
            
            if (processedFiles === totalFiles) {
                if (typeof hideLoader === 'function') {
                    hideLoader();
                }
                // إعادة تعيين حقل إدخال الملفات
                event.target.value = '';
                updateDocumentsDisplay();
            }
            
            return;
        }
        
        const reader = new FileReader();
        
        reader.onload = function(e) {
            // إنشاء كائن للمستمسك
            const docId = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
            const fileExtension = file.name.split('.').pop().toLowerCase();
            
            // تحديد نوع المعاينة
            let previewType = 'file';
            if (['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension)) {
                previewType = 'image';
            } else if (['pdf'].includes(fileExtension)) {
                previewType = 'pdf';
            }
            
            const documentObj = {
                id: docId,
                name: file.name,
                size: file.size,
                type: file.type,
                category: category,
                categoryName: categoryNames[category] || 'ملف آخر',
                date: new Date().toISOString(),
                extension: fileExtension,
                previewType: previewType,
                data: e.target.result // تخزين البيانات كـ base64
            };
            
            // إضافة المستمسك إلى المصفوفة
            window.caseDocuments.push(documentObj);
            
            // زيادة عداد الملفات المعالجة
            processedFiles++;
            
            // إذا تم الانتهاء من جميع الملفات
            if (processedFiles === totalFiles) {
                if (typeof hideLoader === 'function') {
                    hideLoader();
                }
                // إعادة تعيين حقل إدخال الملفات
                event.target.value = '';
                // تحديث عرض المستمسكات
                updateDocumentsDisplay();
                // إظهار رسالة نجاح
                if (typeof showToast === 'function') {
                    showToast(`تم رفع ${totalFiles} مستند بنجاح`, 'success');
                }
            }
        };
        
        reader.onerror = function() {
            if (typeof showToast === 'function') {
                showToast(`فشل في قراءة الملف ${file.name}`, 'error');
            }
            processedFiles++;
            
            if (processedFiles === totalFiles) {
                if (typeof hideLoader === 'function') {
                    hideLoader();
                }
                event.target.value = '';
                updateDocumentsDisplay();
            }
        };
        
        // قراءة الملف كـ Data URL
        reader.readAsDataURL(file);
    });
};

// تحديث عرض المستمسكات في النموذج
window.updateDocumentsDisplay = function() {
    const container = document.getElementById('uploaded-documents-container');
    const noDocsMessage = document.getElementById('no-documents-message');
    
    if (!container || !noDocsMessage) return;
    
    // إزالة المستمسكات السابقة
    const existingDocs = container.querySelectorAll('.document-item');
    existingDocs.forEach(doc => doc.remove());
    
    // إظهار أو إخفاء رسالة "لا توجد مستمسكات"
    if (window.caseDocuments.length === 0) {
        noDocsMessage.style.display = 'block';
        return;
    } else {
        noDocsMessage.style.display = 'none';
    }
    
    // إنشاء شبكة عرض المستمسكات
    const grid = document.createElement('div');
    grid.className = 'documents-grid';
    
    // إضافة أحدث 4 مستمسكات فقط في النموذج الرئيسي (مع زر "عرض الكل")
    const docsToShow = window.caseDocuments.slice(0, 4);
    
    docsToShow.forEach(doc => {
        grid.appendChild(createDocumentItem(doc));
    });
    
    // إضافة زر "عرض جميع المستمسكات" إذا كان هناك أكثر من 4
    if (window.caseDocuments.length > 4) {
        const viewAllBtn = document.createElement('div');
        viewAllBtn.className = 'document-item view-all-btn';
        viewAllBtn.style.display = 'flex';
        viewAllBtn.style.alignItems = 'center';
        viewAllBtn.style.justifyContent = 'center';
        viewAllBtn.style.cursor = 'pointer';
        viewAllBtn.innerHTML = `
            <div style="text-align: center;">
                <i class="fas fa-file-alt" style="font-size: 30px; color: #6b7280; margin-bottom: 10px;"></i>
                <div>عرض كل المستمسكات (${window.caseDocuments.length})</div>
            </div>
        `;
        viewAllBtn.addEventListener('click', manageDocuments);
        grid.appendChild(viewAllBtn);
    }
    
    container.appendChild(grid);
};

// إنشاء عنصر مستمسك للعرض
window.createDocumentItem = function(doc) {
    const item = document.createElement('div');
    item.className = 'document-item';
    item.dataset.docId = doc.id;
    
    // تحديد أيقونة المعاينة حسب نوع الملف
    let previewContent = '';
    if (doc.previewType === 'image') {
        previewContent = `<img src="${doc.data}" alt="${doc.name}">`;
    } else if (doc.previewType === 'pdf') {
        previewContent = `<i class="fas fa-file-pdf" style="color: #ef4444;"></i>`;
    } else {
        // أيقونة حسب امتداد الملف
        let iconClass = 'fas fa-file';
        switch (doc.extension) {
            case 'doc':
            case 'docx':
                iconClass = 'fas fa-file-word';
                break;
            case 'xls':
            case 'xlsx':
                iconClass = 'fas fa-file-excel';
                break;
            case 'txt':
                iconClass = 'fas fa-file-alt';
                break;
        }
        previewContent = `<i class="${iconClass}"></i>`;
    }
    
    // تعيين لون شارة الفئة
    let categoryClass = 'other';
    switch (doc.category) {
        case 'personal':
            categoryClass = 'personal';
            break;
        case 'medical':
            categoryClass = 'medical';
            break;
        case 'financial':
            categoryClass = 'financial';
            break;
    }
    
    // حساب حجم الملف بتنسيق مناسب
    let fileSize = '';
    if (doc.size < 1024) {
        fileSize = `${doc.size} بايت`;
    } else if (doc.size < 1024 * 1024) {
        fileSize = `${(doc.size / 1024).toFixed(1)} كيلوبايت`;
    } else {
        fileSize = `${(doc.size / (1024 * 1024)).toFixed(1)} ميجابايت`;
    }
    
    item.innerHTML = `
        <div class="document-category-badge ${categoryClass}">${doc.categoryName}</div>
        <div class="document-preview">${previewContent}</div>
        <div class="document-info">
            <div class="document-name">${doc.name}</div>
            <div class="document-size">${fileSize}</div>
        </div>
        <div class="document-actions">
            <button class="view-document" onclick="viewDocument('${doc.id}')">
                <i class="fas fa-eye"></i>
            </button>
            <button class="delete-document" onclick="confirmDeleteDocument('${doc.id}')">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    
    return item;
};

// عرض نافذة إدارة المستمسكات
window.manageDocuments = function() {
    // تحديث شبكة المستمسكات في النافذة
    updateDocumentsGrid();
    
    // عرض النافذة
    if (typeof showModal === 'function') {
        showModal('documents-modal');
    }
};

// تحديث شبكة المستمسكات في نافذة الإدارة
window.updateDocumentsGrid = function() {
    // الحصول على جميع الشبكات
    const allGrid = document.getElementById('all-documents-grid');
    const personalGrid = document.getElementById('personal-documents-grid');
    const medicalGrid = document.getElementById('medical-documents-grid');
    const financialGrid = document.getElementById('financial-documents-grid');
    const otherGrid = document.getElementById('other-documents-grid');
    
    if (!allGrid || !personalGrid || !medicalGrid || !financialGrid || !otherGrid) return;
    
    // مسح المحتوى السابق
    allGrid.innerHTML = '';
    personalGrid.innerHTML = '';
    medicalGrid.innerHTML = '';
    financialGrid.innerHTML = '';
    otherGrid.innerHTML = '';
    
    // إضافة المستمسكات إلى الشبكات المناسبة
    window.caseDocuments.forEach(doc => {
        const docItem = createDocumentItem(doc);
        
        // إضافة إلى شبكة "الكل"
        allGrid.appendChild(docItem.cloneNode(true));
        
        // إضافة إلى الشبكة حسب الفئة
        switch (doc.category) {
            case 'personal':
                personalGrid.appendChild(docItem.cloneNode(true));
                break;
            case 'medical':
                medicalGrid.appendChild(docItem.cloneNode(true));
                break;
            case 'financial':
                financialGrid.appendChild(docItem.cloneNode(true));
                break;
            default:
                otherGrid.appendChild(docItem.cloneNode(true));
        }
    });
    
    // إضافة رسالة إذا لم توجد مستمسكات
    const showEmptyMessage = (grid, category) => {
        if (grid.children.length === 0) {
            const emptyMsg = document.createElement('div');
            emptyMsg.className = 'no-documents-message';
            emptyMsg.textContent = `لا توجد ${category} بعد`;
            grid.appendChild(emptyMsg);
        }
    };
    
    showEmptyMessage(allGrid, 'مستمسكات');
    showEmptyMessage(personalGrid, 'مستمسكات شخصية');
    showEmptyMessage(medicalGrid, 'تقارير طبية');
    showEmptyMessage(financialGrid, 'مستندات مالية');
    showEmptyMessage(otherGrid, 'ملفات أخرى');
};

// عرض مستمسك
window.viewDocument = function(docId) {
    const document = window.caseDocuments.find(doc => doc.id === docId);
    
    if (!document) {
        if (typeof showToast === 'function') {
            showToast('لم يتم العثور على المستمسك', 'error');
        }
        return;
    }
    
    // إنشاء نافذة عرض المستمسك
    const viewerModal = document.createElement('div');
    viewerModal.className = 'modal';
    viewerModal.id = 'document-viewer-modal';
    
    let viewerContent = '';
    
    if (document.previewType === 'image') {
        viewerContent = `<img src="${document.data}" alt="${document.name}">`;
    } else if (document.previewType === 'pdf' && document.data.startsWith('data:application/pdf')) {
        viewerContent = `<iframe src="${document.data}"></iframe>`;
    } else {
        viewerContent = `
            <div style="padding: 50px; text-align: center;">
                <i class="fas fa-file" style="font-size: 60px; margin-bottom: 20px; color: #6b7280;"></i>
                <p>لا يمكن معاينة هذا النوع من الملفات. يمكنك تحميله للعرض.</p>
            </div>
        `;
    }
    
    viewerModal.innerHTML = `
        <div class="modal-content document-viewer">
            <div class="modal-header">
                <h2 class="modal-title">${document.name}</h2>
                <button class="modal-close" onclick="document.getElementById('document-viewer-modal').remove()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="document-viewer-container">
                    ${viewerContent}
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary" onclick="downloadDocument('${docId}')">
                    <i class="fas fa-download"></i>
                    <span>تحميل</span>
                </button>
                <button class="btn btn-light" onclick="document.getElementById('document-viewer-modal').remove()">
                    <i class="fas fa-times"></i>
                    <span>إغلاق</span>
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(viewerModal);
    
    // إظهار النافذة
    setTimeout(() => {
        viewerModal.classList.add('show');
    }, 10);
};

// تحميل مستمسك
window.downloadDocument = function(docId) {
    const document = window.caseDocuments.find(doc => doc.id === docId);
    
    if (!document) {
        if (typeof showToast === 'function') {
            showToast('لم يتم العثور على المستمسك', 'error');
        }
        return;
    }
    
    // إنشاء رابط تحميل وتفعيله
    const link = document.createElement('a');
    link.href = document.data;
    link.download = document.name;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    
    // إزالة الرابط بعد التحميل
    setTimeout(() => {
        document.body.removeChild(link);
    }, 100);
};

// تأكيد حذف مستمسك
window.confirmDeleteDocument = function(docId) {
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: 'تأكيد الحذف',
            text: 'هل أنت متأكد من رغبتك في حذف هذا المستمسك؟',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'نعم، حذف',
            cancelButtonText: 'إلغاء'
        }).then((result) => {
            if (result.isConfirmed) {
                deleteDocument(docId);
            }
        });
    } else {
        if (confirm('هل أنت متأكد من رغبتك في حذف هذا المستمسك؟')) {
            deleteDocument(docId);
        }
    }
};

// حذف مستمسك
window.deleteDocument = function(docId) {
    // البحث عن المستمسك في المصفوفة
    const index = window.caseDocuments.findIndex(doc => doc.id === docId);
    
    if (index === -1) {
        if (typeof showToast === 'function') {
            showToast('لم يتم العثور على المستمسك', 'error');
        }
        return;
    }
    
    // حذف المستمسك من المصفوفة
    window.caseDocuments.splice(index, 1);
    
    // تحديث العرض
    updateDocumentsDisplay();
    updateDocumentsGrid();
    
    // عرض رسالة نجاح
    if (typeof showToast === 'function') {
        showToast('تم حذف المستمسك بنجاح', 'success');
    }
};

// تصدير المستمسكات
window.exportDocuments = function() {
    if (window.caseDocuments.length === 0) {
        if (typeof showToast === 'function') {
            showToast('لا توجد مستمسكات للتصدير', 'error');
        }
        return;
    }
    
    // إنشاء ملف ZIP يحتوي على جميع المستمسكات
    if (typeof showToast === 'function') {
        showToast('سيتم تنفيذ هذه الميزة في الإصدار القادم', 'info');
    }
};

// إضافة مستمع أحداث لعلامات التبويب في نافذة المستمسكات
window.setupDocumentsTabs = function() {
    document.querySelectorAll('#documents-modal .tab').forEach(tab => {
        tab.removeEventListener('click', handleTabClick);
        tab.addEventListener('click', handleTabClick);
    });
};

// معالج حدث النقر على علامة تبويب
window.handleTabClick = function() {
    // إزالة الفئة النشطة من جميع علامات التبويب
    document.querySelectorAll('#documents-modal .tab').forEach(t => {
        t.classList.remove('active');
    });
    
    // إضافة الفئة النشطة للعلامة المحددة
    this.classList.add('active');
    
    // إخفاء جميع محتويات التبويب
    document.querySelectorAll('#documents-modal .tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // إظهار المحتوى المرتبط بالتبويب المحدد
    const tabId = this.getAttribute('data-tab');
    document.getElementById(`${tabId}-tab`).classList.add('active');
};

//
// 5. التعامل مع حفظ واستعادة المستمسكات مع الحالات
//

// تعديل وظيفتي getFormData وfillFormWithCaseData
// ملاحظة: نقوم بالتعديل بطريقة آمنة بدون المساس بالدوال الأصلية

// الدالة الأصلية للحصول على بيانات النموذج
const originalGetFormData = window.getFormData;

// تعريف دالة جديدة تستدعي الدالة الأصلية وتضيف المستمسكات
window.getFormData = function() {
    // الحصول على البيانات من الدالة الأصلية
    const formData = originalGetFormData ? originalGetFormData.call(this) : {};
    
    // إضافة المستمسكات إذا كانت موجودة
    if (window.caseDocuments && window.caseDocuments.length > 0) {
        formData.documents = window.caseDocuments.map(doc => {
            // استنساخ كائن المستمسك بدون البيانات الكبيرة
            const docCopy = { ...doc };
            
            // تخزين البيانات في localStorage بمعرّف فريد لكل مستمسك
            try {
                const dataKey = `document_data_${doc.id}`;
                localStorage.setItem(dataKey, doc.data);
                // استبدال البيانات الكبيرة بمعرّف
                docCopy.dataKey = dataKey;
                delete docCopy.data;
            } catch (error) {
                console.warn('خطأ أثناء تخزين بيانات المستمسك:', error);
            }
            
            return docCopy;
        });
    }
    
    return formData;
};

// الدالة الأصلية لملء النموذج ببيانات الحالة
const originalFillFormWithCaseData = window.fillFormWithCaseData;

// تعريف دالة جديدة تستدعي الدالة الأصلية وتضيف المستمسكات
window.fillFormWithCaseData = function(caseItem) {
    // استدعاء الدالة الأصلية
    if (originalFillFormWithCaseData) {
        originalFillFormWithCaseData.call(this, caseItem);
    } else {
        // ملء الحقول يدويًا إذا لم تكن الدالة الأصلية موجودة
        for (const key in caseItem) {
            const field = document.getElementById(key);
            if (field) {
                field.value = caseItem[key];
            }
        }
    }
    
    // استعادة المستمسكات المرتبطة بالحالة
    if (caseItem.documents && Array.isArray(caseItem.documents)) {
        window.caseDocuments = caseItem.documents.map(doc => {
            // محاولة استعادة بيانات المستمسك من localStorage
            try {
                const data = localStorage.getItem(doc.dataKey);
                return {
                    ...doc,
                    data: data || '' // استخدام قيمة فارغة إذا لم يتم العثور على البيانات
                };
            } catch (error) {
                console.warn('خطأ أثناء استعادة بيانات المستمسك:', error);
                return doc;
            }
        });
        
        // تصفية المستمسكات التي لا تحتوي على بيانات
        window.caseDocuments = window.caseDocuments.filter(doc => doc.data);
        
        // تحديث عرض المستمسكات
        updateDocumentsDisplay();
    } else {
        // إعادة تعيين المستمسكات إذا لم تكن موجودة
        window.caseDocuments = [];
        updateDocumentsDisplay();
    }
};

// الدالة الأصلية لإعادة تعيين النموذج
const originalResetForm = window.resetForm;

// تعريف دالة جديدة تستدعي الدالة الأصلية وتعيد تعيين المستمسكات
window.resetForm = function() {
    // استدعاء الدالة الأصلية
    if (originalResetForm) {
        originalResetForm.call(this);
    }
    
    // إعادة تعيين المستمسكات
    window.caseDocuments = [];
    updateDocumentsDisplay();
};

// 6. إضافة المستمع الرئيسي لتهيئة نظام المستمسكات
document.addEventListener('DOMContentLoaded', function() {
    // تهيئة نظام المستمسكات عند تحميل الصفحة
    if (window.initDocumentsSystem) {
        setTimeout(window.initDocumentsSystem, 1000);
    }
    
    // إضافة مستمع حدث لعرض الصفحات
    const originalShowPage = window.showPage;
    if (originalShowPage) {
        window.showPage = function(pageId) {
            // استدعاء الدالة الأصلية
            originalShowPage.call(this, pageId);
            
            // إعادة تهيئة نظام المستمسكات إذا كانت الصفحة هي نموذج الحالة الجديدة
            if (pageId === 'new-case') {
                setTimeout(window.initDocumentsSystem, 300);
            }
        };
    }
});