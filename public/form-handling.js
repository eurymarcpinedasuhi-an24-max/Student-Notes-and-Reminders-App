
class FormHandler {
    constructor() {
        this.forms = {};
        this.errors = {};
        this.isSubmitting = false;
        this.init();
    }

    init() {
        console.log('FormHandler initialized');
        this.setupNoteFormValidation();
        this.setupEditFormValidation();
        this.setupGlobalListeners();
    }

    setupGlobalListeners() {
        // Listen for form submission from the main app
        document.addEventListener('form-submit-request', async (e) => {
            console.log('Form submission requested via event');
            await this.handleFormSubmit(e.detail);
        });

        // Listen for form reset from the main app
        document.addEventListener('form-reset-request', (e) => {
            console.log('Form reset requested via event');
            this.resetForm('note');
        });
    }

    setupNoteFormValidation() {
        console.log('Setting up note form validation');
        
        // Wait for DOM to be ready
        setTimeout(() => {
            const titleInput = document.getElementById('note-title');
            const contentInput = document.getElementById('note-content');
            const datetimeInput = document.getElementById('note-datetime');
            const categorySelect = document.getElementById('note-category');

            if (titleInput && contentInput) {
                this.forms.note = {
                    title: titleInput,
                    content: contentInput,
                    datetime: datetimeInput,
                    category: categorySelect
                };

                console.log('Note form elements found:', this.forms.note);

                // Real-time validation
                titleInput.addEventListener('input', () => this.validateNoteField('title'));
                contentInput.addEventListener('input', () => this.validateNoteField('content'));
                if (datetimeInput) {
                    datetimeInput.addEventListener('change', () => this.validateNoteField('datetime'));
                }
            } else {
                console.warn('Note form elements not found');
            }
        }, 100);
    }

    setupEditFormValidation() {
        // Will be initialized when edit modal opens
        this.forms.edit = null;
    }

    validateNoteField(fieldName) {
        const form = this.forms.note;
        if (!form || !form[fieldName]) return true;

        const field = form[fieldName];
        let isValid = true;
        let errorMessage = '';

        switch (fieldName) {
            case 'title':
                if (field.value.trim().length > 100) {
                    errorMessage = 'Title must be less than 100 characters';
                    isValid = false;
                }
                break;

            case 'content':
                if (!field.value.trim()) {
                    errorMessage = 'Note content is required';
                    isValid = false;
                } else if (field.value.length > 5000) {
                    errorMessage = 'Note content must be less than 5000 characters';
                    isValid = false;
                }
                break;

            case 'datetime':
                if (field.value) {
                    const selectedDate = new Date(field.value);
                    const now = new Date();
                    if (selectedDate < now) {
                        errorMessage = 'Reminder date cannot be in the past';
                        isValid = false;
                    }
                }
                break;
        }

        // Update field styling
        if (isValid) {
            field.style.borderColor = '#4CAF50';
            field.style.borderWidth = '1px';
            this.removeError(fieldName);
        } else {
            field.style.borderColor = '#f44336';
            field.style.borderWidth = '2px';
            this.showError(fieldName, errorMessage);
        }

        return isValid;
    }

    showError(fieldName, message) {
        const form = this.forms.note;
        if (!form || !form[fieldName]) return;

        // Remove existing error
        this.removeError(fieldName);

        // Create error element
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.id = `error-${fieldName}`;
        errorElement.style.color = '#f44336';
        errorElement.style.fontSize = '12px';
        errorElement.style.marginTop = '5px';
        errorElement.textContent = message;

        // Insert after field
        const field = form[fieldName];
        const parent = field.parentElement;
        parent.appendChild(errorElement);

        this.errors[fieldName] = errorElement;
    }

    removeError(fieldName) {
        if (this.errors[fieldName]) {
            const errorElement = this.errors[fieldName];
            if (errorElement && errorElement.parentElement) {
                errorElement.parentElement.removeChild(errorElement);
            }
            delete this.errors[fieldName];
        }
    }

    validateNoteForm() {
        console.log('Validating note form');
        
        if (!this.forms.note) {
            console.warn('Note form not initialized');
            return false;
        }

        const fields = ['title', 'content'];
        let isValid = true;

        fields.forEach(field => {
            if (!this.validateNoteField(field)) {
                isValid = false;
            }
        });

        console.log('Form validation result:', isValid);
        return isValid;
    }

    async handleFormSubmit(formData) {
        console.log('FormHandler: Handling form submit with data:', formData);
        
        // Prevent multiple submissions
        if (this.isSubmitting) {
            console.log('FormHandler: Already submitting, ignoring');
            return { success: false, message: 'Already submitting' };
        }
        
        this.isSubmitting = true;
        
        try {
            // Validate form
            if (!this.validateNoteForm()) {
                const event = new CustomEvent('form-submit-error', {
                    detail: { message: 'Please fix form errors' }
                });
                document.dispatchEvent(event);
                return { success: false, message: 'Validation failed' };
            }

            // Get form data
            const data = this.getFormData();
            console.log('FormHandler: Valid form data:', data);

            // Dispatch success event
            const successEvent = new CustomEvent('form-submit-success', {
                detail: data
            });
            document.dispatchEvent(successEvent);
            
            return { success: true, data: data };
            
        } catch (error) {
            console.error('FormHandler: Error during submission:', error);
            
            const errorEvent = new CustomEvent('form-submit-error', {
                detail: { message: 'Submission failed', error: error }
            });
            document.dispatchEvent(errorEvent);
            
            return { success: false, message: error.message };
        } finally {
            this.isSubmitting = false;
        }
    }

    getFormData() {
        console.log('FormHandler: Getting form data');
        
        if (!this.forms.note) {
            console.warn('Form not initialized');
            return null;
        }

        const form = this.forms.note;
        const data = {
            title: form.title ? form.title.value.trim() : '',
            content: form.content ? form.content.value.trim() : '',
            category: form.category ? form.category.value : 'General',
            datetime: form.datetime ? form.datetime.value || null : null
        };

        console.log('Form data extracted:', data);
        return data;
    }

    resetForm(formName = 'note') {
        console.log(`FormHandler: Resetting form ${formName}`);
        
        const form = this.forms[formName];
        if (!form) {
            console.warn(`Form ${formName} not found`);
            return;
        }

        // Reset all fields
        Object.values(form).forEach(field => {
            if (field && (field.tagName === 'INPUT' || field.tagName === 'TEXTAREA' || field.tagName === 'SELECT')) {
                if (field.tagName === 'SELECT') {
                    field.value = 'General';
                } else {
                    field.value = '';
                }
                field.style.borderColor = '#ccc';
                field.style.borderWidth = '1px';
            }
        });

        // Clear all errors
        Object.keys(this.errors).forEach(fieldName => {
            this.removeError(fieldName);
        });

        console.log(`Form ${formName} reset successfully`);
    }

    validateEditForm() {
        console.log('FormHandler: Validating edit form');
        
        const title = document.getElementById('edit-title');
        const content = document.getElementById('edit-content');
        const datetime = document.getElementById('edit-datetime');

        let isValid = true;

        if (title && title.value.trim().length > 100) {
            title.style.borderColor = '#f44336';
            isValid = false;
        } else if (title) {
            title.style.borderColor = '#4CAF50';
        }

        if (content && (!content.value.trim() || content.value.length > 5000)) {
            content.style.borderColor = '#f44336';
            isValid = false;
        } else if (content) {
            content.style.borderColor = '#4CAF50';
        }

        if (datetime && datetime.value) {
            const selectedDate = new Date(datetime.value);
            const now = new Date();
            if (selectedDate < now) {
                datetime.style.borderColor = '#f44336';
                isValid = false;
            } else {
                datetime.style.borderColor = '#4CAF50';
            }
        }

        console.log('Edit form validation result:', isValid);
        return isValid;
    }

    getEditFormData() {
        console.log('FormHandler: Getting edit form data');
        
        const title = document.getElementById('edit-title');
        const content = document.getElementById('edit-content');
        const category = document.getElementById('edit-category');
        const datetime = document.getElementById('edit-datetime');

        if (!title || !content) {
            console.warn('Edit form elements not found');
            return null;
        }

        const data = {
            title: title.value.trim(),
            content: content.value.trim(),
            category: category ? category.value : 'General',
            datetime: datetime ? datetime.value || null : null
        };

        console.log('Edit form data extracted:', data);
        return data;
    }

    // Initialize edit form in modal
    initializeEditForm(note) {
        console.log('FormHandler: Initializing edit form for note:', note);
        
        this.forms.edit = {
            note: note
        };
        
        // Add validation listeners to edit form
        setTimeout(() => {
            const editTitle = document.getElementById('edit-title');
            const editContent = document.getElementById('edit-content');
            const editDatetime = document.getElementById('edit-datetime');
            
            if (editTitle) {
                editTitle.addEventListener('input', () => this.validateEditField('edit-title'));
            }
            if (editContent) {
                editContent.addEventListener('input', () => this.validateEditField('edit-content'));
            }
            if (editDatetime) {
                editDatetime.addEventListener('change', () => this.validateEditField('edit-datetime'));
            }
        }, 100);
    }

    validateEditField(fieldId) {
        const field = document.getElementById(fieldId);
        if (!field) return true;

        let isValid = true;
        let errorMessage = '';

        switch (fieldId) {
            case 'edit-title':
                if (field.value.trim().length > 100) {
                    errorMessage = 'Title must be less than 100 characters';
                    isValid = false;
                }
                break;

            case 'edit-content':
                if (!field.value.trim()) {
                    errorMessage = 'Note content is required';
                    isValid = false;
                } else if (field.value.length > 5000) {
                    errorMessage = 'Note content must be less than 5000 characters';
                    isValid = false;
                }
                break;

            case 'edit-datetime':
                if (field.value) {
                    const selectedDate = new Date(field.value);
                    const now = new Date();
                    if (selectedDate < now) {
                        errorMessage = 'Reminder date cannot be in the past';
                        isValid = false;
                    }
                }
                break;
        }

        // Update field styling
        if (isValid) {
            field.style.borderColor = '#4CAF50';
            field.style.borderWidth = '1px';
        } else {
            field.style.borderColor = '#f44336';
            field.style.borderWidth = '2px';
        }

        return isValid;
    }
}

// Initialize form handler when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing FormHandler');
    
    // Create global instance
    window.formHandler = new FormHandler();
    
    // Export for use in other files
    window.getFormHandler = () => window.formHandler;
    
    console.log('FormHandler initialized and available at window.formHandler');
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FormHandler;
}