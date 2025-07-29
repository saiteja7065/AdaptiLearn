import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject, listAll } from 'firebase/storage';
import { collection, addDoc, updateDoc, doc, getDocs, query, where, orderBy, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

class PDFStorageService {
  constructor() {
    this.storage = getStorage();
    this.maxFileSize = 50 * 1024 * 1024; // 50MB
    this.allowedTypes = ['application/pdf'];
  }

  // Generate storage path for organized file structure
  generateStoragePath(academicYear, branchId, semester, fileName, type = 'syllabus') {
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    
    if (type === 'subject') {
      return `syllabi/${academicYear}/${branchId}/semester_${semester}/subjects/${sanitizedFileName}`;
    } else if (type === 'complete') {
      return `syllabi/${academicYear}/${branchId}/semester_${semester}/complete_syllabus.pdf`;
    } else if (type === 'extracted') {
      return `syllabi/${academicYear}/${branchId}/semester_${semester}/extracted/${sanitizedFileName}`;
    }
    
    return `syllabi/${academicYear}/${branchId}/semester_${semester}/${sanitizedFileName}`;
  }

  // Validate PDF file before upload
  validateFile(file) {
    const errors = [];
    
    if (!file) {
      errors.push('No file provided');
      return { isValid: false, errors };
    }
    
    if (!this.allowedTypes.includes(file.type)) {
      errors.push('Only PDF files are allowed');
    }
    
    if (file.size > this.maxFileSize) {
      errors.push('File size must be less than 50MB');
    }
    
    if (file.size === 0) {
      errors.push('File appears to be empty');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      fileInfo: {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: new Date(file.lastModified)
      }
    };
  }

  // Upload PDF to Firebase Storage
  async uploadPDF(file, metadata) {
    try {
      // Validate file
      const validation = this.validateFile(file);
      if (!validation.isValid) {
        throw new Error(`File validation failed: ${validation.errors.join(', ')}`);
      }

      const { academicYear, branchId, semester, documentType = 'complete' } = metadata;
      
      // Generate storage path
      const storagePath = this.generateStoragePath(
        academicYear, 
        branchId, 
        semester, 
        file.name, 
        documentType
      );
      
      // Create storage reference
      const storageRef = ref(this.storage, storagePath);
      
      // Upload file with metadata
      const uploadMetadata = {
        contentType: file.type,
        customMetadata: {
          academicYear,
          branchId,
          semester: semester.toString(),
          documentType,
          uploadedAt: new Date().toISOString(),
          originalFileName: file.name
        }
      };
      
      console.log(`📤 Uploading PDF: ${file.name} to ${storagePath}`);
      
      // Upload file
      const snapshot = await uploadBytes(storageRef, file, uploadMetadata);
      
      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      // Create database record
      const docData = {
        academicYear,
        branchId,
        semester,
        documentType,
        fileName: file.name,
        originalFileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        firebaseStorageUrl: `gs://${snapshot.ref.bucket}/${snapshot.ref.fullPath}`,
        publicUrl: downloadURL,
        storagePath: storagePath,
        
        // Status tracking
        uploadStatus: 'completed',
        extractionStatus: 'pending',
        ocrStatus: 'pending',
        
        // Metadata
        totalPages: null,
        extractedContent: null,
        subjects: [],
        
        // Timestamps
        uploadedAt: new Date(),
        createdAt: new Date(),
        lastModified: new Date()
      };
      
      // Save to Firestore
      const docRef = await addDoc(collection(db, 'syllabus_documents'), docData);
      
      console.log(`✅ PDF uploaded successfully: ${docRef.id}`);
      
      return {
        success: true,
        documentId: docRef.id,
        downloadURL,
        storagePath,
        metadata: docData
      };
      
    } catch (error) {
      console.error('❌ PDF upload failed:', error);
      throw new Error(`Upload failed: ${error.message}`);
    }
  }

  // Retrieve PDFs by academic year and branch
  async getPDFsByBranch(academicYear, branchId, semester = null) {
    try {
      let q = query(
        collection(db, 'syllabus_documents'),
        where('academicYear', '==', academicYear),
        where('branchId', '==', branchId),
        orderBy('semester', 'asc'),
        orderBy('createdAt', 'desc')
      );
      
      if (semester) {
        q = query(
          collection(db, 'syllabus_documents'),
          where('academicYear', '==', academicYear),
          where('branchId', '==', branchId),
          where('semester', '==', semester),
          orderBy('createdAt', 'desc')
        );
      }
      
      const querySnapshot = await getDocs(q);
      const documents = [];
      
      querySnapshot.forEach((doc) => {
        documents.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          uploadedAt: doc.data().uploadedAt?.toDate(),
          lastModified: doc.data().lastModified?.toDate()
        });
      });
      
      console.log(`Retrieved ${documents.length} documents for ${branchId}/${academicYear}`);
      
      return {
        success: true,
        documents,
        totalCount: documents.length
      };
      
    } catch (error) {
      console.error('❌ Failed to retrieve PDFs:', error);
      throw new Error(`Retrieval failed: ${error.message}`);
    }
  }

  // Get all available academic years and branches
  async getAvailableStructure() {
    try {
      const q = query(collection(db, 'syllabus_documents'));
      const querySnapshot = await getDocs(q);
      
      const structure = {};
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const { academicYear, branchId, semester } = data;
        
        if (!structure[academicYear]) {
          structure[academicYear] = {};
        }
        
        if (!structure[academicYear][branchId]) {
          structure[academicYear][branchId] = {
            semesters: new Set(),
            totalDocuments: 0
          };
        }
        
        structure[academicYear][branchId].semesters.add(semester);
        structure[academicYear][branchId].totalDocuments++;
      });
      
      // Convert Sets to Arrays for JSON serialization
      Object.keys(structure).forEach(year => {
        Object.keys(structure[year]).forEach(branch => {
          structure[year][branch].semesters = Array.from(structure[year][branch].semesters).sort();
        });
      });
      
      return {
        success: true,
        structure
      };
      
    } catch (error) {
      console.error('❌ Failed to get structure:', error);
      throw new Error(`Structure retrieval failed: ${error.message}`);
    }
  }

  // Delete PDF document
  async deletePDF(documentId) {
    try {
      // Get document data first
      const docRef = doc(db, 'syllabus_documents', documentId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error('Document not found');
      }
      
      const data = docSnap.data();
      
      // Delete from storage
      if (data.storagePath) {
        const storageRef = ref(this.storage, data.storagePath);
        await deleteObject(storageRef);
        console.log(`🗑️ Deleted file from storage: ${data.storagePath}`);
      }
      
      // Delete from Firestore
      await deleteDoc(docRef);
      console.log(`🗑️ Deleted document: ${documentId}`);
      
      return {
        success: true,
        message: 'Document deleted successfully'
      };
      
    } catch (error) {
      console.error('❌ Failed to delete PDF:', error);
      throw new Error(`Deletion failed: ${error.message}`);
    }
  }

  // Batch upload multiple PDFs
  async batchUpload(files, baseMetadata) {
    const results = [];
    const errors = [];
    
    console.log(`📦 Starting batch upload of ${files.length} files`);
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        console.log(`📤 Uploading file ${i + 1}/${files.length}: ${file.name}`);
        
        const result = await this.uploadPDF(file, {
          ...baseMetadata,
          documentType: this.inferDocumentType(file.name)
        });
        
        results.push(result);
        
      } catch (error) {
        console.error(`❌ Failed to upload ${file.name}:`, error);
        errors.push({
          fileName: file.name,
          error: error.message
        });
      }
    }
    
    console.log(`✅ Batch upload completed: ${results.length} successful, ${errors.length} failed`);
    
    return {
      success: results.length > 0,
      results,
      errors,
      summary: {
        total: files.length,
        successful: results.length,
        failed: errors.length
      }
    };
  }

  // Infer document type from filename
  inferDocumentType(fileName) {
    const name = fileName.toLowerCase();
    
    if (name.includes('complete') || name.includes('full') || name.includes('syllabus')) {
      return 'complete';
    } else if (name.includes('subject') || name.includes('math') || name.includes('physics')) {
      return 'subject';
    }
    
    return 'complete'; // default
  }

  // Search PDFs by content or metadata
  async searchPDFs(searchQuery, filters = {}) {
    try {
      let q = collection(db, 'syllabus_documents');
      
      // Apply filters
      if (filters.academicYear) {
        q = query(q, where('academicYear', '==', filters.academicYear));
      }
      
      if (filters.branchId) {
        q = query(q, where('branchId', '==', filters.branchId));
      }
      
      if (filters.semester) {
        q = query(q, where('semester', '==', filters.semester));
      }
      
      q = query(q, orderBy('createdAt', 'desc'));
      
      const querySnapshot = await getDocs(q);
      const documents = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        
        // Basic text search in filename and content
        if (searchQuery) {
          const searchTerms = searchQuery.toLowerCase();
          const fileName = data.fileName?.toLowerCase() || '';
          const subjects = data.subjects?.map(s => s.subjectName?.toLowerCase()).join(' ') || '';
          
          if (fileName.includes(searchTerms) || subjects.includes(searchTerms)) {
            documents.push({
              id: doc.id,
              ...data,
              createdAt: data.createdAt?.toDate(),
              uploadedAt: data.uploadedAt?.toDate()
            });
          }
        } else {
          documents.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate(),
            uploadedAt: data.uploadedAt?.toDate()
          });
        }
      });
      
      return {
        success: true,
        documents,
        totalFound: documents.length
      };
      
    } catch (error) {
      console.error('❌ Search failed:', error);
      throw new Error(`Search failed: ${error.message}`);
    }
  }
}

// Create singleton instance
const pdfStorageService = new PDFStorageService();

export default pdfStorageService;

// Named exports for specific functions
export {
  pdfStorageService
};
